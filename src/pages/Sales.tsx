import { useState, useMemo, useCallback, useRef } from 'react'
import { Plus, Minus, Trash2, Barcode, ChevronRight, FileText, AlertCircle } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { SearchSelect } from '../components/ui/SearchSelect'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { useProductStore } from '../stores/useProductStore'
import { useSaleStore } from '../stores/useSaleStore'
import type { Sale, SaleStatus } from '../types'
import { config } from '../config'

interface CartItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  maxStock: number
}

export function Sales() {
  const [modalOpen, setModalOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false)
  const [saleToVoid, setSaleToVoid] = useState<Sale | null>(null)
  const quantityRef = useRef<HTMLInputElement>(null)

  const products = useProductStore((s) => s.products)
  const sales = useSaleStore((s) => s.sales)
  const createSale = useSaleStore((s) => s.createSale)
  const voidSale = useSaleStore((s) => s.voidSale)
  const reduceStock = useProductStore((s) => s.reduceStock)
  const increaseStock = useProductStore((s) => s.increaseStock)
  const getProductById = useProductStore((s) => s.getProductById)

  const openCreate = useCallback(() => {
    setCart([])
    setSelectedProductId('')
    setBarcodeInput('')
    setQuantity('1')
    setPaymentMethod('cash')
    setModalOpen(true)
  }, [])

  /*   const handleBarcodeSearch = useCallback((e: React.FormEvent) => {
      e.preventDefault()
      if (!barcodeInput) return
      const found = products.find((p) => p.barcode === barcodeInput && p.stock > 0)
      if (found) {
        setSelectedProductId(found.id)
        setBarcodeInput('')
        setTimeout(() => quantityRef.current?.focus(), 100)
      }
    }, [barcodeInput, products]) */

  const addToCart = useCallback(() => {
    if (!selectedProductId) return
    const q = parseInt(quantity, 10) || 1
    const product = getProductById(selectedProductId)
    if (!product || q <= 0) return

    setCart((prev) => {
      const existing = prev.find((c) => c.productId === selectedProductId)
      if (existing) {
        return prev.map((c) =>
          c.productId === selectedProductId
            ? { ...c, quantity: Math.min(c.quantity + q, c.maxStock) }
            : c
        )
      }
      return [...prev, { productId: product.id, productName: product.name, quantity: Math.min(q, product.stock), unitPrice: product.price, maxStock: product.stock }]
    })
    setSelectedProductId('')
    setQuantity('1')
  }, [selectedProductId, quantity, getProductById])

  const updateCartQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId !== productId) return c
        const next = c.quantity + delta
        if (next <= 0) return c
        return { ...c, quantity: Math.min(next, c.maxStock) }
      }).filter((c) => c.quantity > 0)
    )
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId))
  }, [])

  const cartTotal = useMemo(() =>
    cart.reduce((sum, c) => sum + c.quantity * c.unitPrice, 0),
    [cart]
  )

  const handleConfirmSale = useCallback(() => {
    const sale = createSale({
      items: cart.map((c) => ({
        productId: c.productId,
        productName: c.productName,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
      })),
      paymentMethod,
    })
    if (sale) {
      cart.forEach((c) => reduceStock(c.productId, c.quantity))
      setLastSale(sale)
    }
    setPreviewOpen(false)
    setModalOpen(false)
    setCart([])
    if (sale) setReceiptOpen(true)
  }, [cart, paymentMethod, createSale, reduceStock])

  const handleVoidSale = useCallback(() => {
    if (!saleToVoid) return
    saleToVoid.items.forEach((item) => increaseStock(item.productId, item.quantity))
    voidSale(saleToVoid.id)
    setVoidConfirmOpen(false)
    setSaleToVoid(null)
  }, [saleToVoid, increaseStock, voidSale])

  const productOptions = useMemo(() =>
    products
      .filter((p) => p.stock > 0)
      .map((p) => ({
        value: p.id,
        label: `${p.name} — ${config.currency.symbol}${p.price.toFixed(2)} (${p.stock} uds.) · ${p.barcode}`,
      })),
    [products]
  )

  const paymentLabels = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }
  const paymentVariants = { cash: 'success' as const, card: 'info' as const, transfer: 'warning' as const }

  const statusBadge = (status: SaleStatus) => {
    if (status === 'voided') return <Badge variant="danger">Anulada</Badge>
    return <Badge variant="success">Activa</Badge>
  }

  const saleColumns = [
    { key: 'id', header: 'Venta', render: (s: Sale) => <span className="font-medium">#{s.id.slice(-4)}</span> },
    { key: 'status', header: 'Estado', render: (s: Sale) => statusBadge(s.status) },
    { key: 'items', header: 'Productos', render: (s: Sale) => s.items.map((i) => `${i.productName} x${i.quantity}`).join(', ') },
    { key: 'total', header: 'Total', render: (s: Sale) => <span className="font-semibold">{config.currency.symbol}{s.total.toFixed(2)}</span> },
    { key: 'payment', header: 'Método', render: (s: Sale) => <Badge variant={paymentVariants[s.paymentMethod]}>{paymentLabels[s.paymentMethod]}</Badge> },
    { key: 'date', header: 'Fecha', render: (s: Sale) => new Date(s.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' }) },
    { key: 'actions', header: '', render: (s: Sale) =>
      s.status === 'active' ? (
        <button
          onClick={(e) => { e.stopPropagation(); setSaleToVoid(s); setVoidConfirmOpen(true) }}
          className="text-[11px] text-danger-text hover:underline transition-colors"
        >
          Anular
        </button>
      ) : null
    },
  ]

  return (
    <>
      <Card
        title="Ventas"
        subtitle={`${sales.length} venta${sales.length !== 1 ? 's' : ''} registradas`}
        actions={<Button variant="gold" size="sm" onClick={openCreate}><Plus size={16} /> Nueva Venta</Button>}
      >
        <Table
          columns={saleColumns}
          data={sales}
          keyExtractor={(s) => s.id}
          emptyMessage="No hay ventas registradas"
          renderCard={(s) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text">#{s.id.slice(-4)}</span>
                <div className="flex items-center gap-2">
                  {statusBadge(s.status)}
                  <Badge variant={paymentVariants[s.paymentMethod]}>{paymentLabels[s.paymentMethod]}</Badge>
                </div>
              </div>
              <div className="text-[12px] text-muted">
                {s.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted">{new Date(s.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}</span>
                  {s.status === 'active' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSaleToVoid(s); setVoidConfirmOpen(true) }}
                      className="text-[11px] text-danger-text hover:underline"
                    >
                      Anular
                    </button>
                  )}
                </div>
                <span className="font-semibold text-text">{config.currency.symbol}{s.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Venta" size="lg">
        <div className="space-y-4">

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <SearchSelect
                label="Producto"
                options={productOptions}
                value={selectedProductId}
                onChange={setSelectedProductId}
                placeholder="Buscar por nombre o código de barras..."
              />
            </div>
            <div className="w-24">
              <Input ref={quantityRef} label="Cant." type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={addToCart} disabled={!selectedProductId}><Plus size={16} /> Agregar</Button>
            </div>
          </div>

          {cart.length > 0 && (
            <div className="rounded-lg border border-border bg-surface">
              <div className="border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Carrito</div>
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between border-b border-border/50 px-4 py-2.5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-text truncate">{item.productName}</p>
                    <p className="text-[11px] text-muted">{config.currency.symbol}{item.unitPrice.toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="gold-outline" size="sm" onClick={() => updateCartQty(item.productId, -1)}><Minus size={14} /></Button>
                    <span className="w-8 text-center text-[13px] font-medium text-text">{item.quantity}</span>
                    <Button variant="gold" size="sm" onClick={() => updateCartQty(item.productId, 1)}><Plus size={14} /></Button>
                    <Button variant="surface" size="sm" onClick={() => removeFromCart(item.productId)}><Trash2 size={14} className="text-danger-text" /></Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-[13px] font-semibold text-text">Total</span>
                <span className="text-[18px] font-bold text-accent">{config.currency.symbol}{cartTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          <Select
            label="Método de Pago"
            options={[
              { value: 'cash', label: 'Efectivo' },
              { value: 'card', label: 'Tarjeta' },
              { value: 'transfer', label: 'Transferencia' },
            ]}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'transfer')}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="surface" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={() => setPreviewOpen(true)} disabled={cart.length === 0}>
            Previsualizar ({config.currency.symbol}{cartTotal.toFixed(2)})
          </Button>
        </div>
      </Modal>

      {/* Preview / Comprobante */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Previsualizar Venta" size="lg">
        <div className="space-y-5">
          <div className="border-b border-border pb-4">
            <h3 className="text-[15px] font-bold text-text">{config.storeName}</h3>
            <p className="text-[12px] text-muted">Comprobante de Venta</p>
            <p className="text-[11px] text-muted">{new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
          </div>

          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Producto</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Cant.</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">P. Unit.</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.productId} className="border-b border-border/50">
                  <td className="py-2.5 text-text">{item.productName}</td>
                  <td className="py-2.5 text-right text-muted-light">{item.quantity}</td>
                  <td className="py-2.5 text-right text-muted-light">{config.currency.symbol}{item.unitPrice.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-semibold text-text">{config.currency.symbol}{(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col items-end gap-1 border-t border-border pt-3">
            <div className="flex w-56 items-center justify-between text-[12px]">
              <span className="text-muted">Subtotal</span>
              <span className="text-muted-light">{config.currency.symbol}{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex w-56 items-center justify-between text-[15px] font-bold">
              <span className="text-text">Total</span>
              <span className="text-accent">{config.currency.symbol}{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5 text-[12px]">
            <span className="text-muted">Método de pago</span>
            <Badge variant={paymentVariants[paymentMethod]}>{paymentLabels[paymentMethod]}</Badge>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="gold-outline" onClick={() => setPreviewOpen(false)}>Volver</Button>
          <Button variant="gold" onClick={handleConfirmSale}>Confirmar y Emitir Comprobante</Button>
        </div>
      </Modal>

      {/* Comprobante emitido */}
      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Comprobante Emitido" size="md">
        {lastSale && (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 border-b border-border pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-dim">
                <FileText size={24} className="text-success-text" />
              </div>
              <div className="text-center">
                <h3 className="text-[15px] font-bold text-text">{config.storeName}</h3>
                <p className="text-[11px] text-muted">Comprobante #{lastSale.id.slice(-8).toUpperCase()}</p>
                <p className="text-[11px] text-muted">{new Date(lastSale.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
              </div>
            </div>

            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Producto</th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Cant.</th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">P. Unit.</th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {lastSale.items.map((item) => (
                  <tr key={item.productId} className="border-b border-border/50">
                    <td className="py-2.5 text-text">{item.productName}</td>
                    <td className="py-2.5 text-right text-muted-light">{item.quantity}</td>
                    <td className="py-2.5 text-right text-muted-light">{config.currency.symbol}{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-semibold text-text">{config.currency.symbol}{(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col items-end gap-1 border-t border-border pt-3">
              <div className="flex w-56 items-center justify-between text-[15px] font-bold">
                <span className="text-text">Total</span>
                <span className="text-accent">{config.currency.symbol}{lastSale.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5 text-[12px]">
              <span className="text-muted">Método de pago</span>
              <Badge variant={paymentVariants[lastSale.paymentMethod]}>{paymentLabels[lastSale.paymentMethod]}</Badge>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="gold-outline" onClick={() => setReceiptOpen(false)}>Cerrar</Button>
        </div>
      </Modal>

      {/* Confirmación de anulación */}
      <Modal open={voidConfirmOpen} onClose={() => { setVoidConfirmOpen(false); setSaleToVoid(null) }} title="Anular Venta" size="sm">
        {saleToVoid && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-danger-dim bg-danger-dim/30 p-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-text" />
              <div className="text-[12px] text-muted">
                <p className="font-semibold text-danger-text">¿Estás seguro de anular esta venta?</p>
                <p className="mt-1">Se restaurará el stock de todos los productos incluidos en la venta #{saleToVoid.id.slice(-6).toUpperCase()}.</p>
                <p className="mt-1">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-3 space-y-1.5">
              {saleToVoid.items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-[12px]">
                  <span className="text-text">{item.productName}</span>
                  <span className="text-muted-light">x{item.quantity} → se restaura stock</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button variant="gold-outline" onClick={() => { setVoidConfirmOpen(false); setSaleToVoid(null) }}>
                Cancelar
              </Button>
              <Button variant="surface" onClick={handleVoidSale}>
                <AlertCircle size={14} /> Confirmar Anulación
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
