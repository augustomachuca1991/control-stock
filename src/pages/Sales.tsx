import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Formik, Form } from 'formik'
import type { FormikProps } from 'formik'
import { Plus, Minus, Trash2, FileText, AlertCircle, ShoppingCart, Search, X, Package, Download } from 'lucide-react'
import { Pagination } from '../components/ui/Pagination'
import { BarcodeScanner } from '../components/ui/BarcodeScanner'
import { exportToXLSX, type ExportColumn } from '../lib/export'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { SearchSelect } from '../components/ui/SearchSelect'
import { Input } from '../components/ui/Input'
import { SelectField } from '../components/ui/SelectField'
import { Img } from '../components/ui/Img'
import MarelyLogo from '../components/ui/MarelyLogo'
import { SkeletonRow } from '../components/ui/Skeleton'
import { useProductStore } from '../stores/useProductStore'
import { useSaleStore } from '../stores/useSaleStore'
import { useSales } from '../hooks/useSales'
import { useProducts } from '../hooks/useProducts'
import { supabase } from '../lib/supabaseClient'
import { saleSchema } from '../lib/validation'
import type { Sale, SaleStatus, PaymentMethod } from '../types'
import type { CartItem } from '../stores/useSaleStore'
import { config } from '../config'
import { useAuth } from '../contexts/AuthContext'

type FilterStatus = 'all' | 'active' | 'voided'
type FilterPayment = 'all' | PaymentMethod

const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

function StatusBadge({ status }: { status: SaleStatus }) {
  if (status === 'voided')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger-dim px-2 py-0.5 text-[11px] font-medium text-danger-text">
        <span className="h-1.5 w-1.5 rounded-full bg-danger-text" />
        Anulada
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-dim px-2 py-0.5 text-[11px] font-medium text-success-text">
      <span className="h-1.5 w-1.5 rounded-full bg-success-text" />
      Activa
    </span>
  )
}

function PaymentTag({ method }: { method: PaymentMethod }) {
  const styles: Record<PaymentMethod, string> = {
    cash: 'bg-success-dim text-success-text',
    card: 'bg-primary-dim text-primary-text',
    transfer: 'bg-warning-dim text-warning-text',
  }
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${styles[method]}`}>
      {paymentLabels[method]}
    </span>
  )
}

export function Sales() {
  const { isAdmin } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false)
  const [saleToVoid, setSaleToVoid] = useState<Sale | null>(null)
  const [detailSale, setDetailSale] = useState<Sale | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [sellerName, setSellerName] = useState<string | null>(null)
  const openDetail = useCallback((sale: Sale) => {
    setDetailSale(sale)
    setDetailModalOpen(true)
    setSellerName(null)
    if (sale.userId) {
      supabase.from('profiles').select('full_name').eq('id', sale.userId).single().then(({ data }) => {
        if (data?.full_name) setSellerName(data.full_name)
      })
    }
  }, [])

  const [confirming, setConfirming] = useState(false)
  const [voiding, setVoiding] = useState(false)
  const [previewPaymentMethod, setPreviewPaymentMethod] = useState<PaymentMethod>('cash')

  // filters & search
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPayment, setFilterPayment] = useState<FilterPayment>('all')
  const [search, setSearch] = useState('')

  const quantityRef = useRef<HTMLInputElement>(null)
  const saleFormikRef = useRef<FormikProps<{ paymentMethod: PaymentMethod }>>(null)

  const products = useProductStore((s) => s.products)
  const sales = useSaleStore((s) => s.sales)
  const cart = useSaleStore((s) => s.cart)
  const addToCartStore = useSaleStore((s) => s.addToCart)
  const updateCartItem = useSaleStore((s) => s.updateCartItem)
  const removeFromCart = useSaleStore((s) => s.removeFromCart)
  const clearCart = useSaleStore((s) => s.clearCart)
  const getProductById = useProductStore((s) => s.getProductById)
  const { create: createSale, voidSale, loading: salesLoading } = useSales()
  const { reduceStock, increaseStock, loading: productsLoading } = useProducts()
  const loading = salesLoading || productsLoading

  const receiptHTML = useCallback((sale: Sale, seller: string | null) => {
    const itemsRows = sale.items.map((i) => {
      const desc = getProductById(i.productId)?.description
      return `
        <tr>
          <td style="font-weight:500">${i.productName}</td>
          <td style="color:#888">${desc || `<i>${i.productName}</i>`}</td>
          <td class="r">${i.quantity}</td>
          <td class="r">${config.currency.symbol}${i.unitPrice.toFixed(2)}</td>
          <td class="r">${config.currency.symbol}${(i.quantity * i.unitPrice).toFixed(2)}</td>
        </tr>`
    }).join('')
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      @page{margin:0}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',system-ui,sans-serif;font-size:12px;color:#222;padding:24px}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #d4a853;padding-bottom:16px;margin-bottom:16px}
      .hdr-l{display:flex;gap:12px;align-items:center}
      .hdr-l h2{font-size:18px;font-weight:700;font-family:'Playfair Display',serif}
      .hdr-l p{font-size:11px;color:#888}
      .hdr-r{text-align:right;font-size:11px;color:#888}
      .hdr-r .id{font-size:13px;font-weight:600;color:#222}
      table{width:100%;border-collapse:collapse;margin-bottom:16px}
      th{text-align:left;padding:8px 6px;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#aaa;border-bottom:1px solid #eee}
      th.r,td.r{text-align:right}
      td{padding:8px 6px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
      .ttl td{font-weight:700;font-size:14px;border-bottom:none;padding-top:12px}
      .ftr{display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:1px solid #eee;font-size:11px;color:#888}
      .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;background:#e8f5e9;color:#2e7d32}
      .badge-d{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;background:#ffebee;color:#c62828}
    </style></head><body>
      <div class="hdr">
        <div class="hdr-l">
          <svg viewBox="0 0 220 48" style="width:auto;height:42px" role="img" xmlns="http://www.w3.org/2000/svg"><title>Marely Librería y Papelería</title><text x="0" y="38" font-family="'Playfair Display','Times New Roman',serif" font-size="40" font-weight="900" fill="#c9a84c">M</text><text x="28" y="38" font-family="'Playfair Display','Times New Roman',serif" font-size="40" font-weight="900" fill="#57534e">E</text><line x1="68" y1="6" x2="68" y2="44" stroke="#d4d4d8" stroke-width="0.8" /><text x="78" y="26" font-family="'Playfair Display','Times New Roman',serif" font-size="15" font-weight="700" fill="#57534e" letter-spacing="3">MARELY</text><text x="79" y="40" font-family="'Cormorant Garamond','Georgia',serif" font-size="9" font-weight="300" fill="#888" letter-spacing="2">LIBRERÍA &amp; PAPELERÍA</text></svg>
          
        </div>
        <div class="hdr-r">
          <p class="id">Comprobante de Venta #${sale.id.slice(-8).toUpperCase()}</p>
          <p>${new Date(sale.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>Producto</th><th>Descripción</th><th class="r">Cant.</th><th class="r">P.Unit.</th><th class="r">Subtotal</th></tr></thead>
        <tbody>
          ${itemsRows}
          <tr class="ttl"><td colspan="4" class="r">Total</td><td class="r">${config.currency.symbol}${sale.total.toFixed(2)}</td></tr>
        </tbody>
      </table>
      <div class="ftr">
        <div><p>Método de pago: ${paymentLabels[sale.paymentMethod]}</p><p>Estado: <span class="${sale.status === 'voided' ? 'badge-d' : 'badge'}">${sale.status === 'voided' ? 'Anulada' : 'Activa'}</span></p></div>
        <div class="r">${seller ? `<p>Vendedor: ${seller}</p>` : ''}</div>
      </div>
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:-1;">
        <span style="font-size:140px;font-weight:900;color:#000;opacity:0.03;transform:rotate(-25deg);font-family:'Times New Roman',serif;letter-spacing:15px;">NO FACTURA</span>
      </div>
      <p style="text-align:center;font-size:9px;font-style:italic;color:#999;margin-top:20px;padding-top:10px;border-top:1px solid #eee;">* Este documento es un comprobante interno de control de stock. No válido como factura fiscal.</p>
    </body></html>`
  }, [getProductById])

  const exportToCSV = useCallback(() => {
    if (!detailSale) return
    const sep = ';'
    const head = ['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']
    const rows = detailSale.items.map(i => [
      `"${i.productName}"`, i.quantity, `${config.currency.symbol}${i.unitPrice.toFixed(2)}`, `${config.currency.symbol}${(i.quantity * i.unitPrice).toFixed(2)}`,
    ])
    const total = [`"Total"`, '', '', `${config.currency.symbol}${detailSale.total.toFixed(2)}`]
    const csv = [head.join(sep), ...rows.map(r => r.join(sep)), total.join(sep)].join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `venta_${detailSale.id.slice(-8)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [detailSale])

  const exportToPDF = useCallback(() => {
    if (!detailSale) return
    const html = receiptHTML(detailSale, sellerName)
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (doc) { doc.open(); doc.write(html); doc.close() }
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 500)
  }, [detailSale, sellerName, receiptHTML])

  // Derived stats
  const activeSales = useMemo(() => sales.filter((s) => s.status === 'active'), [sales])
  const totalToday = useMemo(
    () => activeSales.reduce((sum, s) => sum + s.total, 0),
    [activeSales]
  )
  const avgTicket = useMemo(
    () => (activeSales.length > 0 ? totalToday / activeSales.length : 0),
    [activeSales, totalToday]
  )

  // Filtered + searched sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false
      if (filterPayment !== 'all' && s.paymentMethod !== filterPayment) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchId = s.id.slice(-6).toLowerCase().includes(q)
        const matchItems = s.items.some((i) => i.productName.toLowerCase().includes(q))
        if (!matchId && !matchItems) return false
      }
      return true
    })
  }, [sales, filterStatus, filterPayment, search])

  const saleExportColumns: ExportColumn<Sale>[] = [
    { key: 'id', header: 'ID', format: (v) => `#${String(v).slice(-8).toUpperCase()}` },
    { key: (s) => s.items.length, header: 'Items' },
    { key: 'total', header: 'Total', format: (v) => `${config.currency.symbol}${Number(v).toFixed(2)}` },
    { key: 'paymentMethod', header: 'Método de pago', format: (v) => ({ cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' })[String(v)] ?? String(v) },
    { key: 'status', header: 'Estado', format: (v) => v === 'active' ? 'Activa' : 'Anulada' },
    { key: 'createdAt', header: 'Fecha', format: (v) => new Date(Number(v)).toLocaleDateString('es-ES') },
  ]

  const [salePage, setSalePage] = useState(1)
  const salePerPage = 20

  useEffect(() => {
    const maxPages = Math.max(1, Math.ceil(filteredSales.length / salePerPage))
    if (salePage > maxPages) setSalePage(maxPages)
  }, [filteredSales.length, salePage])

  const paginatedSales = useMemo(() => {
    const start = (salePage - 1) * salePerPage
    return filteredSales.slice(start, start + salePerPage)
  }, [filteredSales, salePage])

  const openCreate = useCallback(() => {
    setSelectedProductId('')
    setQuantity('1')
    setModalOpen(true)
  }, [])

  const addToCart = useCallback(() => {
    if (!selectedProductId) return
    const q = parseInt(quantity, 10) || 1
    const product = getProductById(selectedProductId)
    if (!product || q <= 0) return
    if (product.stock <= 0) {
      toast.error(`${product.name} no tiene stock disponible`)
      return
    }
    const existing = cart.find((c) => c.productId === selectedProductId)
    const currentCartQty = existing ? existing.quantity : 0
    const available = product.stock - currentCartQty
    if (available <= 0) {
      toast.error(`Stock insuficiente de ${product.name}`)
      return
    }
    const qty = Math.min(q, available)
    const newItem: CartItem = {
      productId: product.id,
      productName: product.name,
      quantity: existing ? existing.quantity + qty : qty,
      unitPrice: product.price,
      maxStock: product.stock,
    }
    addToCartStore(newItem)
    setSelectedProductId('')
    setQuantity('1')
  }, [selectedProductId, quantity, getProductById, cart, addToCartStore])

  const updateCartQty = useCallback((productId: string, delta: number) => {
    updateCartItem(productId, delta)
  }, [updateCartItem])

  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity * c.unitPrice, 0),
    [cart]
  )

  const handleConfirmSale = useCallback(async () => {
    setConfirming(true)
    const paymentMethod = saleFormikRef.current?.values.paymentMethod ?? 'cash'
    for (const item of cart) {
      const product = getProductById(item.productId)
      if (!product) {
        toast.error(`Producto "${item.productName}" no encontrado`)
        setConfirming(false)
        return
      }
      if (product.stock < item.quantity) {
        toast.error(`Stock insuficiente para "${item.productName}"`)
        setConfirming(false)
        return
      }
    }
    const { data: sale } = await createSale({
      items: cart.map((c) => ({
        productId: c.productId,
        productName: c.productName,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
      })),
      paymentMethod,
    })
    if (sale) {
      const results = await Promise.allSettled(cart.map((c) => reduceStock(c.productId, c.quantity)))
      const failures = results.filter((r) => r.status === 'rejected')
      if (failures.length > 0) toast.error(`Error al actualizar stock de ${failures.length} producto(s)`)
      setLastSale(sale)
    }
    setConfirming(false)
    setPreviewOpen(false)
    setModalOpen(false)
    clearCart()
    if (sale) setReceiptOpen(true)
  }, [cart, createSale, reduceStock, getProductById, clearCart])

  const handleVoidSale = useCallback(async () => {
    if (!saleToVoid) return
    setVoiding(true)
    await Promise.all(saleToVoid.items.map((item) => increaseStock(item.productId, item.quantity)))
    await voidSale(saleToVoid.id)
    setVoiding(false)
    setVoidConfirmOpen(false)
    setSaleToVoid(null)
  }, [saleToVoid, increaseStock, voidSale])

  const productOptions = useMemo(
    () =>
      products
        .filter((p) => p.enabled !== false && p.stock > 0)
        .map((p) => ({
          value: p.id,
          label: `${p.name} — ${config.currency.symbol}${p.price.toFixed(2)} (${p.stock} uds.) · ${p.barcode}`,
        })),
    [products]
  )

  const hasActiveFilters = filterStatus !== 'all' || filterPayment !== 'all' || search.trim() !== ''

  return (
    <>
      {/* Cart banner */}
      {cart.length > 0 && !modalOpen && (
        <div
          className="mb-4 flex items-center justify-between rounded-xl border px-4 py-3"
          style={{
            borderColor: 'var(--clr-border)',
            background: 'var(--clr-primary-dim)',
          }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={15} style={{ color: 'var(--clr-primary)' }} />
            <span className="text-[12px]" style={{ color: 'var(--clr-text)' }}>
              <span className="font-medium">{cart.length} producto{cart.length !== 1 ? 's' : ''}</span> en el carrito
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearCart}
              className="text-[11px] underline transition-colors"
              style={{ color: 'var(--clr-muted)' }}
            >
              Vaciar
            </button>
            <Button variant="gold" size="sm" onClick={() => setModalOpen(true)}>
              <ShoppingCart size={13} /> Ir al carrito
            </Button>
          </div>
        </div>
      )}

      {/* Main panel */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-card)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--clr-border)' }}
        >
          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.8px] text-muted">
              Ventas
            </h2>
            <p className="mt-0.5 text-[11px] text-muted">
              {sales.length} venta{sales.length !== 1 ? 's' : ''} registradas
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mini stats */}
            <div className="hidden sm:flex items-center gap-4 mr-2">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--clr-muted)' }}>Total activo</p>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--clr-primary)' }}>
                  {config.currency.symbol}{totalToday.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--clr-muted)' }}>Ticket prom.</p>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--clr-text)' }}>
                  {config.currency.symbol}{avgTicket.toFixed(2)}
                </p>
              </div>
            </div>
            <Button variant="surface" size="sm" onClick={() => exportToXLSX(filteredSales, saleExportColumns, 'ventas')}>
              <Download size={13} /> XLSX
            </Button>
            {cart.length === 0 && (
              <Button variant="gold" size="sm" onClick={openCreate}>
                <Plus size={15} /> Nueva venta
              </Button>
            )}
          </div>
        </div>

        {/* Filters + Search bar */}
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-3 border-b"
          style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-bg)' }}
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--clr-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por producto o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg pl-8 pr-8 py-2 text-[13px] border outline-none transition-colors placeholder:text-[var(--clr-muted)]"
              style={{
                background: 'var(--clr-surface)',
                borderColor: 'var(--clr-border)',
                color: 'var(--clr-text)',
                colorScheme: 'dark',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--clr-muted)' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(['all', 'active', 'voided'] as FilterStatus[]).map((f) => {
              const labels = { all: 'Todas', active: 'Activas', voided: 'Anuladas' }
              const isActive = filterStatus === f
              return (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className="rounded-full px-3 py-1 text-[12px] font-medium transition-all border"
                  style={
                    isActive
                      ? { background: 'var(--clr-primary)', color: '#fff', borderColor: 'var(--clr-primary)' }
                      : { background: 'transparent', color: 'var(--clr-muted)', borderColor: 'var(--clr-border)' }
                  }
                >
                  {labels[f]}
                </button>
              )
            })}
          </div>

          {/* Payment filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(['all', 'cash', 'card', 'transfer'] as FilterPayment[]).map((f) => {
              const labels = { all: 'Todos', cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transfer.' }
              const isActive = filterPayment === f
              return (
                <button
                  key={f}
                  onClick={() => setFilterPayment(f)}
                  className="rounded-full px-3 py-1 text-[12px] font-medium transition-all border"
                  style={
                    isActive
                      ? { background: 'var(--clr-accent)', color: 'var(--clr-bg)', borderColor: 'var(--clr-accent)' }
                      : { background: 'transparent', color: 'var(--clr-muted)', borderColor: 'var(--clr-border)' }
                  }
                >
                  {labels[f]}
                </button>
              )
            })}
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { setFilterStatus('all'); setFilterPayment('all'); setSearch('') }}
              className="text-[11px] flex items-center gap-1 shrink-0"
              style={{ color: 'var(--clr-primary-text)' }}
            >
              <X size={11} /> Limpiar
            </button>
          )}
        </div>

        {/* Sale list */}
        <div className="p-4 flex flex-col gap-2.5">
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : filteredSales.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-2">
              <ShoppingCart size={28} style={{ color: 'var(--clr-muted)' }} />
              <p className="text-[13px]" style={{ color: 'var(--clr-muted)' }}>
                {hasActiveFilters ? 'No hay ventas que coincidan con los filtros' : 'No hay ventas registradas'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterStatus('all'); setFilterPayment('all'); setSearch('') }}
                  className="text-[12px] underline"
                  style={{ color: 'var(--clr-primary-text)' }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            paginatedSales.map((sale) => {
              const isVoided = sale.status === 'voided'
              return (
                <div
                  key={sale.id}
                  className="flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors"
                  style={{
                    borderColor: isVoided ? 'var(--clr-border-subtle)' : 'var(--clr-border)',
                    background: 'var(--clr-surface)',
                    opacity: isVoided ? 0.6 : 1,
                  }}
                >
                  {/* Status dot */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0 mt-[5px]"
                    style={{ background: isVoided ? 'var(--clr-danger)' : 'var(--clr-success)' }}
                  />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[12px] font-medium tabular-nums"
                        style={{
                          color: 'var(--clr-muted)',
                          textDecoration: isVoided ? 'line-through' : 'none',
                        }}
                      >
                        #{sale.id.slice(-6).toUpperCase()}
                      </span>
                      <PaymentTag method={sale.paymentMethod} />
                      {isVoided && <StatusBadge status="voided" />}
                    </div>
                    <p
                      className="text-[13px] mt-1 truncate"
                      style={{
                        color: 'var(--clr-text)',
                        textDecoration: isVoided ? 'line-through' : 'none',
                      }}
                    >
                      {sale.items.map((i, idx) => (
                        <span key={i.productId}>
                          <span style={{ fontStyle: 'italic', fontWeight: 500 }}>{i.productName}</span> x{i.quantity}
                          {idx < sale.items.length - 1 && <span className="mx-1" style={{ color: 'var(--clr-muted)' }}>·</span>}
                        </span>
                      ))}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--clr-muted)' }}>
                      {new Date(sale.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Total + actions */}
                  <div className="text-right shrink-0">
                    <p
                      className="text-[15px] font-semibold tabular-nums"
                      style={{
                        color: isVoided ? 'var(--clr-muted)' : 'var(--clr-text)',
                        textDecoration: isVoided ? 'line-through' : 'none',
                      }}
                    >
                      {config.currency.symbol}{sale.total.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 justify-end">
                      <button
                        onClick={() => openDetail(sale)}
                        className="text-[11px] transition-opacity hover:opacity-70 flex items-center gap-1"
                        style={{ color: 'var(--clr-muted)' }}
                      >
                        Detalle
                      </button>
                      {!isVoided && isAdmin && (
                        <button
                          onClick={() => { setSaleToVoid(sale); setVoidConfirmOpen(true) }}
                          className="text-[11px] transition-opacity hover:opacity-70"
                          style={{ color: 'var(--clr-danger-text)' }}
                        >
                          Anular
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer count */}
        {filteredSales.length > 0 && (
          <div
            className="px-5 py-2.5 border-t"
            style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-bg)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>
                {filteredSales.length} de {sales.length} venta{sales.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--clr-muted)' }}>
                {filteredSales.filter((s) => s.status === 'active').length} activas ·{' '}
                {filteredSales.filter((s) => s.status === 'voided').length} anuladas
              </span>
            </div>
            <Pagination page={salePage} totalPages={Math.max(1, Math.ceil(filteredSales.length / salePerPage))} onChange={setSalePage} />
          </div>
        )}
      </div>

      {/* ── Modal Nueva Venta ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Venta" size="lg">
        <Formik
          innerRef={saleFormikRef}
          initialValues={{ paymentMethod: 'cash' as PaymentMethod }}
          validationSchema={saleSchema}
          validate={() => {
            if (cart.length === 0) return { cart: 'Agregá al menos un producto' }
            return {}
          }}
          onSubmit={() => {
            setPreviewPaymentMethod(saleFormikRef.current?.values.paymentMethod ?? 'cash')
            setPreviewOpen(true)
          }}
        >
          {({ errors, submitForm }) => (
            <Form>
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 flex items-end gap-2">
                    <div className="flex-1">
                      <SearchSelect
                        label="Producto"
                        options={productOptions}
                        value={selectedProductId}
                        onChange={setSelectedProductId}
                        placeholder="Buscar por nombre o código de barras..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="shrink-0 mb-7 flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-dim hover:text-primary-light"
                      title="Escanear código de barras"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        <line x1="7" x2="7" y1="12" y2="12" /><line x1="12" x2="12" y1="12" y2="12" /><line x1="17" x2="17" y1="12" y2="12" />
                      </svg>
                    </button>
                  </div>
                  <div className="w-full shrink-0 sm:w-24">
                    <Input ref={quantityRef} label="Cant." type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </div>
                  <div className="shrink-0 sm:mb-[23px]">
                    <Button onClick={addToCart} disabled={!selectedProductId}><Plus size={16} /> Agregar</Button>
                  </div>
                </div>

                {cart.length > 0 && (
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}
                  >
                    <div
                      className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest border-b"
                      style={{ color: 'var(--clr-muted)', borderColor: 'var(--clr-border)' }}
                    >
                      Carrito
                    </div>
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between border-b px-4 py-2.5 last:border-0"
                        style={{ borderColor: 'var(--clr-border-subtle)' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: 'var(--clr-text)' }}>{item.productName}</p>
                          <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>{config.currency.symbol}{item.unitPrice.toFixed(2)} c/u</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="gold-outline" size="sm" type="button" onClick={() => updateCartQty(item.productId, -1)}><Minus size={14} /></Button>
                          <span className="w-8 text-center text-[13px] font-medium" style={{ color: 'var(--clr-text)' }}>{item.quantity}</span>
                          <Button variant="gold" size="sm" type="button" onClick={() => updateCartQty(item.productId, 1)}><Plus size={14} /></Button>
                          <Button variant="surface" size="sm" type="button" onClick={() => removeFromCart(item.productId)}><Trash2 size={14} style={{ color: 'var(--clr-danger-text)' }} /></Button>
                        </div>
                      </div>
                    ))}
                    <div
                      className="flex items-center justify-between px-4 py-3 border-t"
                      style={{ borderColor: 'var(--clr-border)' }}
                    >
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--clr-text)' }}>Total</span>
                      <span className="text-[18px] font-bold" style={{ color: 'var(--clr-accent)' }}>{config.currency.symbol}{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <SelectField
                  name="paymentMethod"
                  label="Método de Pago"
                  options={[
                    { value: 'cash', label: 'Efectivo' },
                    { value: 'card', label: 'Tarjeta' },
                    { value: 'transfer', label: 'Transferencia' },
                  ]}
                />

                {(errors as any).cart && (
                  <p className="text-[11px]" style={{ color: 'var(--clr-danger-text)' }}>{(errors as any).cart}</p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="surface" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="button" onClick={() => submitForm()} disabled={cart.length === 0}>
                  Previsualizar ({config.currency.symbol}{cartTotal.toFixed(2)})
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* ── Modal Preview ── */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Previsualizar Venta" size="lg">
        <div className="space-y-5">
          <div className="border-b pb-4" style={{ borderColor: 'var(--clr-border)' }}>
            <h3 className="text-[15px] font-bold" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--clr-text)' }}>{config.storeName}</h3>
            <p className="text-[12px]" style={{ color: 'var(--clr-muted)' }}>Comprobante de venta</p>
            <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>{new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
          </div>

          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'var(--clr-border)' }}>
                <th className="pb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Producto</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Cant.</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>P. Unit.</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.productId} className="border-b" style={{ borderColor: 'var(--clr-border-subtle)' }}>
                  <td className="py-2.5" style={{ color: 'var(--clr-text)' }}>{item.productName}</td>
                  <td className="py-2.5 text-right" style={{ color: 'var(--clr-muted-light)' }}>{item.quantity}</td>
                  <td className="py-2.5 text-right" style={{ color: 'var(--clr-muted-light)' }}>{config.currency.symbol}{item.unitPrice.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-semibold" style={{ color: 'var(--clr-text)' }}>{config.currency.symbol}{(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col items-end gap-1 border-t pt-3" style={{ borderColor: 'var(--clr-border)' }}>
            <div className="flex w-56 items-center justify-between text-[15px] font-bold">
              <span style={{ color: 'var(--clr-text)' }}>Total</span>
              <span style={{ color: 'var(--clr-accent)' }}>{config.currency.symbol}{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-[12px]" style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}>
            <span style={{ color: 'var(--clr-muted)' }}>Método de pago</span>
            <PaymentTag method={previewPaymentMethod} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="gold-outline" onClick={() => setPreviewOpen(false)}>Volver</Button>
          <Button variant="gold" onClick={handleConfirmSale} disabled={confirming}>
            {confirming ? 'Procesando...' : 'Confirmar y emitir comprobante'}
          </Button>
        </div>
      </Modal>

      {/* ── Modal Comprobante ── */}
      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Comprobante emitido" size="md">
        {lastSale && (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 border-b pb-4" style={{ borderColor: 'var(--clr-border)' }}>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'var(--clr-success-dim)' }}
              >
                <FileText size={22} style={{ color: 'var(--clr-success-text)' }} />
              </div>
              <div className="text-center">
                <h3 className="text-[15px] font-bold" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--clr-text)' }}>{config.storeName}</h3>
                <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>Comprobante #{lastSale.id.slice(-8).toUpperCase()}</p>
                <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>{new Date(lastSale.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
              </div>
            </div>

            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'var(--clr-border)' }}>
                  <th className="pb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Producto</th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Cant.</th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>P. Unit.</th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {lastSale.items.map((item) => (
                  <tr key={item.productId} className="border-b" style={{ borderColor: 'var(--clr-border-subtle)' }}>
                    <td className="py-2.5" style={{ color: 'var(--clr-text)' }}>{item.productName}</td>
                    <td className="py-2.5 text-right" style={{ color: 'var(--clr-muted-light)' }}>{item.quantity}</td>
                    <td className="py-2.5 text-right" style={{ color: 'var(--clr-muted-light)' }}>{config.currency.symbol}{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-semibold" style={{ color: 'var(--clr-text)' }}>{config.currency.symbol}{(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col items-end gap-1 border-t pt-3" style={{ borderColor: 'var(--clr-border)' }}>
              <div className="flex w-56 items-center justify-between text-[15px] font-bold">
                <span style={{ color: 'var(--clr-text)' }}>Total</span>
                <span style={{ color: 'var(--clr-accent)' }}>{config.currency.symbol}{lastSale.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-[12px]" style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}>
              <span style={{ color: 'var(--clr-muted)' }}>Método de pago</span>
              <PaymentTag method={lastSale.paymentMethod} />
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <Button variant="gold-outline" onClick={() => setReceiptOpen(false)}>Cerrar</Button>
        </div>
      </Modal>

      {/* ── Modal Detalle de Venta ── */}
      <Modal open={detailModalOpen} onClose={() => { setDetailModalOpen(false); setDetailSale(null) }} title="Detalle de Venta" size="lg">
        {detailSale && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--clr-border)' }}>
              <div className="flex items-center gap-3">
                <MarelyLogo iconOnly width={36} />
                <div>
                  <h3 className="text-[15px] font-bold" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--clr-text)' }}>{config.storeName}</h3>
                  <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>Comprobante de Venta</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>#{detailSale.id.slice(-8).toUpperCase()}</p>
                <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>
                  {new Date(detailSale.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'var(--clr-border)' }}>
                  <th className="pb-2 pr-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}></th>
                  <th className="pb-2 pr-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Producto</th>
                  <th className="pb-2 pr-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Precio</th>
                  <th className="pb-2 pr-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Cant.</th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detailSale.items.map((item) => {
                  const product = getProductById(item.productId)
                  const img = product?.images?.[0]
                  return (
                    <tr key={item.productId} className="border-b" style={{ borderColor: 'var(--clr-border-subtle)' }}>
                      <td className="py-2 pr-2">
                        <div className="h-10 w-10 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--clr-border)' }}>
                          {img ? (
                            <Img src={img} alt="" className="h-full w-full object-cover" skeleton="rounded-lg" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--clr-surface)' }}>
                              <Package size={14} style={{ color: 'var(--clr-muted)' }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-2" style={{ color: 'var(--clr-text)' }}>
                        <p className="font-medium">{item.productName}</p>
                        {product?.barcode && <code className="text-[10px]" style={{ color: 'var(--clr-muted)' }}>{product.barcode}</code>}
                      </td>
                      <td className="py-2 pr-2 text-right" style={{ color: 'var(--clr-muted-light)' }}>{config.currency.symbol}{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2 pr-2 text-right" style={{ color: 'var(--clr-muted-light)' }}>{item.quantity}</td>
                      <td className="py-2 text-right font-semibold" style={{ color: 'var(--clr-text)' }}>{config.currency.symbol}{(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="flex flex-col items-end gap-1 border-t pt-3" style={{ borderColor: 'var(--clr-border)' }}>
              <div className="flex w-56 items-center justify-between text-[15px] font-bold">
                <span style={{ color: 'var(--clr-text)' }}>Total</span>
                <span style={{ color: 'var(--clr-accent)' }}>{config.currency.symbol}{detailSale.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-[12px]" style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Método de pago</span>
                  <div className="mt-1"><PaymentTag method={detailSale.paymentMethod} /></div>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Estado</span>
                  <div className="mt-1"><StatusBadge status={detailSale.status} /></div>
                </div>
              </div>
              {detailSale.userId && (
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Vendedor</span>
                  <p className="mt-0.5 text-[12px] font-medium" style={{ color: 'var(--clr-text)' }}>{sellerName || 'Cargando...'}</p>
                </div>
              )}
            </div>

            <p className="text-[10px] text-center" style={{ color: 'var(--clr-muted)' }}>
              {detailSale.items.length} producto{detailSale.items.length !== 1 ? 's' : ''} en esta venta
            </p>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="surface" onClick={() => { setDetailModalOpen(false); setDetailSale(null) }}>Cerrar</Button>
          <Button variant="gold-outline" size="sm" onClick={exportToCSV}>ExportarCSV</Button>
          <Button variant="gold" size="sm" onClick={exportToPDF}>Exportar PDF</Button>
        </div>
      </Modal>

      {/* ── Modal Anular ── */}
      <Modal open={voidConfirmOpen} onClose={() => { setVoidConfirmOpen(false); setSaleToVoid(null) }} title="Anular venta" size="sm">
        {saleToVoid && (
          <div className="space-y-4">
            <div
              className="flex items-start gap-3 rounded-xl border p-3"
              style={{ borderColor: 'var(--clr-danger)', background: 'var(--clr-danger-dim)' }}
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--clr-danger-text)' }} />
              <div className="text-[12px]" style={{ color: 'var(--clr-muted)' }}>
                <p className="font-semibold" style={{ color: 'var(--clr-danger-text)' }}>¿Anular esta venta?</p>
                <p className="mt-1">Se restaurará el stock de todos los productos de la venta #{saleToVoid.id.slice(-6).toUpperCase()}.</p>
                <p className="mt-1">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="rounded-xl border p-3 space-y-1.5" style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}>
              {saleToVoid.items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-[12px]">
                  <span style={{ color: 'var(--clr-text)' }}>{item.productName}</span>
                  <span style={{ color: 'var(--clr-muted-light)' }}>x{item.quantity} → stock restaurado</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--clr-border)' }}>
              <Button variant="gold-outline" onClick={() => { setVoidConfirmOpen(false); setSaleToVoid(null) }}>
                Cancelar
              </Button>
              <Button variant="surface" onClick={handleVoidSale} disabled={voiding}>
                <AlertCircle size={14} /> {voiding ? 'Anulando...' : 'Confirmar anulación'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => {
          const found = products.find((p) => p.barcode === code)
          if (found) {
            setSelectedProductId(found.id)
            toast.success(`${found.name} seleccionado`)
          } else {
            toast.error(`Producto con código ${code} no encontrado`)
          }
          setScannerOpen(false)
        }}
      />
    </>
  )
}