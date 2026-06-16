import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Plus, ShoppingCart, Search, X, Package, History, Download } from 'lucide-react'
import { Pagination } from '../components/ui/Pagination'
import { BarcodeScanner } from '../components/ui/BarcodeScanner'
import { exportToXLSX, type ExportColumn } from '../lib/export'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { SearchSelect } from '../components/ui/SearchSelect'
import { Input } from '../components/ui/Input'
import { Img } from '../components/ui/Img'
import { SkeletonRow } from '../components/ui/Skeleton'
import { StatusBadge, PaymentTag, paymentLabels } from './sales/salesComponents'
import { CartModal } from './sales/CartModal'
import { PreviewModal } from './sales/PreviewModal'
import { ReceiptModal } from './sales/ReceiptModal'
import { DetailModal } from './sales/DetailModal'
import { VoidConfirmModal } from './sales/VoidConfirmModal'
import { useProductStore } from '../stores/useProductStore'
import { useSaleStore } from '../stores/useSaleStore'
import { useSales } from '../hooks/useSales'
import { useProducts } from '../hooks/useProducts'
import { supabase } from '../lib/supabaseClient'
import type { Sale, PaymentMethod } from '../types'
import type { CartItem } from '../stores/useSaleStore'
import { config } from '../config'
import { useAuth } from '../contexts/AuthContext'

type FilterStatus = 'all' | 'active' | 'voided'
type FilterPayment = 'all' | PaymentMethod

export function Sales() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<'venta' | 'historico'>('venta')
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

  const [cartModalOpen, setCartModalOpen] = useState(false)
  const [cashAmount, setCashAmount] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const quantityRef = useRef<HTMLInputElement>(null)

  const products = useProductStore((s) => s.products)
  const sales = useSaleStore((s) => s.sales)
  const cart = useSaleStore((s) => s.cart)
  const addToCartStore = useSaleStore((s) => s.addToCart)
  const updateCartItem = useSaleStore((s) => s.updateCartItem)
  const removeFromCart = useSaleStore((s) => s.removeFromCart)
  const setCartItemQuantity = useSaleStore((s) => s.setCartItemQuantity)
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
    const discountRow = sale.discountPercent && sale.discountPercent > 0
      ? `<tr><td colspan="4" class="r" style="font-size:11px;color:#e53935;padding-top:6px">Descuento (${sale.discountPercent}%)</td><td class="r" style="font-size:11px;color:#e53935;padding-top:6px">-${config.currency.symbol}${(sale.total * sale.discountPercent / (100 - sale.discountPercent)).toFixed(2)}</td></tr>`
      : ''
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
          ${discountRow}
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
      productDescription: product.description,
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

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity * c.unitPrice, 0),
    [cart]
  )
  const discountAmount = useMemo(
    () => cartSubtotal * discountPercent / 100,
    [cartSubtotal, discountPercent]
  )
  const finalTotal = useMemo(
    () => cartSubtotal - discountAmount,
    [cartSubtotal, discountAmount]
  )

  const handleConfirmSale = useCallback(async () => {
    setConfirming(true)
    if (previewPaymentMethod === 'cash') {
      if (!cashAmount || parseFloat(cashAmount) <= 0) {
        toast.error('Ingresá el importe recibido en efectivo')
        setConfirming(false)
        return
      }
      if (parseFloat(cashAmount) < finalTotal) {
        toast.error(`Faltan ${config.currency.symbol}${(finalTotal - parseFloat(cashAmount)).toFixed(2)} para completar el pago`)
        setConfirming(false)
        return
      }
    }
    const paymentMethod = previewPaymentMethod
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
        productDescription: c.productDescription,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
      })),
      paymentMethod,
      discountPercent,
    })
    if (sale) {
      const results = await Promise.allSettled(cart.map((c) => reduceStock(c.productId, c.quantity)))
      const failures = results.filter((r) => r.status === 'rejected')
      if (failures.length > 0) toast.error(`Error al actualizar stock de ${failures.length} producto(s)`)
      setLastSale(sale)
    }
    setConfirming(false)
    setPreviewOpen(false)
    clearCart()
    setDiscountPercent(0)
    if (sale) setReceiptOpen(true)
  }, [cart, createSale, reduceStock, getProductById, clearCart, previewPaymentMethod, cashAmount, finalTotal, discountPercent])

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

  const availableProducts = useMemo(
    () => products.filter((p) => p.enabled !== false && p.stock > 0),
    [products]
  )

  const productsPerPage = 20
  const [productPage, setProductPage] = useState(1)

  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * productsPerPage
    return availableProducts.slice(start, start + productsPerPage)
  }, [availableProducts, productPage])

  useEffect(() => {
    setProductPage(1)
  }, [availableProducts.length])

  const quickAdd = useCallback((productId: string) => {
    const product = getProductById(productId)
    if (!product || product.stock <= 0) return
    const existing = cart.find((c) => c.productId === productId)
    const currentCartQty = existing ? existing.quantity : 0
    if (currentCartQty >= product.stock) {
      toast.error(`Stock insuficiente de ${product.name}`)
      return
    }
    addToCartStore({
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      quantity: existing ? existing.quantity + 1 : 1,
      unitPrice: product.price,
      maxStock: product.stock,
    })
    toast.success(`${product.name} agregado al carrito`)
  }, [getProductById, cart, addToCartStore])

  const cashDiff = useMemo(() => {
    if (previewPaymentMethod !== 'cash' || !cashAmount) return 0
    return parseFloat(cashAmount) - finalTotal
  }, [previewPaymentMethod, cashAmount, finalTotal])

  const cambio = useMemo(() => Math.max(0, cashDiff), [cashDiff])
  const faltante = useMemo(() => Math.abs(Math.min(0, cashDiff)), [cashDiff])

  const hasActiveFilters = filterStatus !== 'all' || filterPayment !== 'all' || search.trim() !== ''

  return (
    <>
      {/* Cart banner — only shown when on 'historico' tab with items in cart */}
      {cart.length > 0 && (
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
            <Button variant="gold" size="sm" onClick={() => setCartModalOpen(true)}>
              <ShoppingCart size={13} /> Ir al carrito
            </Button>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 w-fit mb-4">
        <button
          onClick={() => setActiveTab('venta')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${activeTab === 'venta'
            ? 'bg-primary-dim text-primary-light'
            : 'text-muted hover:text-muted-light'
            }`}
        >
          <ShoppingCart size={14} /> Venta
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${activeTab === 'historico'
            ? 'bg-primary-dim text-primary-light'
            : 'text-muted hover:text-muted-light'
            }`}
        >
          <History size={14} /> Histórico
        </button>
      </div>

      {/* Main panel */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-card)' }}
      >
        {activeTab === 'historico' ? (
          <>
            {/* Header stats + XLSX */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: 'var(--clr-border)' }}
            >
              <div>
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.8px] text-muted">
                  Histórico
                </h2>
                <p className="mt-0.5 text-[11px] text-muted">
                  {sales.length} venta{sales.length !== 1 ? 's' : ''} registradas
                </p>
              </div>
              <div className="flex items-center gap-3">
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
          </>
        ) : (
          /* ── Tab: Venta ── */
          <div className="p-5 space-y-4">
            {/* Search + Add row */}
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

            {/* Product grid */}
            <div>
              {availableProducts.length === 0 ? (
                <p className="text-center text-[13px] text-muted py-8">No hay productos disponibles para la venta</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {paginatedProducts.map((p) => {
                      const inCart = cart.find((c) => c.productId === p.id)
                      const cartQty = inCart ? inCart.quantity : 0
                      const soldOut = cartQty >= p.stock
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={soldOut}
                          onClick={() => quickAdd(p.id)}
                          className="relative rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:bg-primary-dim disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {p.images?.[0] ? (
                            <Img src={p.images[0]} alt="" className="h-20 w-full rounded-lg object-cover mb-2" skeleton="rounded-lg" />
                          ) : (
                            <div className="h-20 w-full rounded-lg bg-surface mb-2 flex items-center justify-center border border-border">
                              <Package size={20} className="text-muted" />
                            </div>
                          )}
                          {inCart && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white shadow-sm">
                              {cartQty}
                            </span>
                          )}
                          {inCart && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeFromCart(p.id) }}
                              className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full shadow-sm transition-opacity hover:opacity-80"
                              style={{ background: 'var(--clr-danger-text)' }}
                              title="Quitar del carrito"
                            >
                              <X size={10} className="text-white" />
                            </button>
                          )}
                          <p className="text-[13px] font-medium text-text truncate">{p.name}</p>
                          <p className="text-[12px] text-accent font-semibold mt-1">{config.currency.symbol}{p.price.toFixed(2)}</p>
                          <p className="text-[10px] text-muted mt-0.5">{p.stock} uds.</p>
                          {inCart && (
                            <p className="text-[10px] text-primary-light mt-0.5">{cartQty} en carrito</p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {availableProducts.length > productsPerPage && (
                    <div className="mt-3">
                      <Pagination
                        page={productPage}
                        totalPages={Math.max(1, Math.ceil(availableProducts.length / productsPerPage))}
                        onChange={setProductPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Ver carrito banner */}
            {cart.length > 0 && (
              <div
                className="flex items-center justify-between rounded-xl border px-4 py-3"
                style={{
                  borderColor: 'var(--clr-border)',
                  background: 'var(--clr-primary-dim)',
                }}
              >
                <span className="text-[12px]" style={{ color: 'var(--clr-text)' }}>
                  <span className="font-medium">{cart.length} producto{cart.length !== 1 ? 's' : ''}</span> · {config.currency.symbol}{cartSubtotal.toFixed(2)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearCart}
                    className="text-[11px] underline transition-colors"
                    style={{ color: 'var(--clr-muted)' }}
                  >
                    Vaciar
                  </button>
                  <Button variant="gold" size="sm" onClick={() => setCartModalOpen(true)}>
                    <ShoppingCart size={13} /> Ver carrito
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CartModal
        open={cartModalOpen}
        onClose={() => { setCartModalOpen(false); setDiscountPercent(0) }}
        cart={cart}
        cartSubtotal={cartSubtotal}
        discountPercent={discountPercent}
        setDiscountPercent={setDiscountPercent}
        finalTotal={finalTotal}
        previewPaymentMethod={previewPaymentMethod}
        setPreviewPaymentMethod={setPreviewPaymentMethod}
        cashAmount={cashAmount}
        setCashAmount={setCashAmount}
        cambio={cambio}
        faltante={faltante}
        updateCartQty={updateCartQty}
        removeFromCart={removeFromCart}
        setCartItemQuantity={setCartItemQuantity}
        onPreview={() => {
          if (previewPaymentMethod === 'cash') {
            if (!cashAmount || parseFloat(cashAmount) <= 0) {
              toast.error('Ingresá el importe recibido en efectivo')
              return
            }
            if (faltante > 0) {
              toast.error(`Faltan ${config.currency.symbol}${faltante.toFixed(2)} para completar el pago`)
              return
            }
          }
          setCartModalOpen(false); setPreviewOpen(true)
        }}
      />

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        cart={cart}
        cartSubtotal={cartSubtotal}
        discountPercent={discountPercent}
        finalTotal={finalTotal}
        previewPaymentMethod={previewPaymentMethod}
        confirming={confirming}
        handleConfirmSale={handleConfirmSale}
      />
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        lastSale={lastSale}
        onPrint={lastSale ? () => {
          const html = receiptHTML(lastSale, sellerName)
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
        } : undefined}
      />
      <DetailModal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setDetailSale(null) }}
        detailSale={detailSale}
        sellerName={sellerName}
        getProductById={getProductById}
        exportToCSV={exportToCSV}
        exportToPDF={exportToPDF}
      />
      <VoidConfirmModal
        open={voidConfirmOpen}
        onClose={() => { setVoidConfirmOpen(false); setSaleToVoid(null) }}
        saleToVoid={saleToVoid}
        voiding={voiding}
        handleVoidSale={handleVoidSale}
      />

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