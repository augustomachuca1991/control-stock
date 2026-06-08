import { useState, useMemo, useCallback } from 'react'
import { Trash2, Package, FileText, CheckCircle2, History, ShoppingCart } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { SearchSelect } from '../components/ui/SearchSelect'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { useProductStore } from '../stores/useProductStore'
import { useCategoryStore } from '../stores/useCategoryStore'
import { usePurchaseStore } from '../stores/usePurchaseStore'
import type { PurchaseItem as PurchaseItemType } from '../types'
import { config } from '../config'

interface Entry {
  tempId: string
  productId: string | null
  productName: string
  barcode: string
  brand: string
  categoryId: string
  cost: number
  quantity: number
  isNew: boolean
  description: string
}

export function Purchases() {
  const [tab, setTab] = useState<'new' | 'history'>('new')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [previewOpen, setPreviewOpen] = useState(false)

  // Cart
  const [entries, setEntries] = useState<Entry[]>([])

  // Current item being configured
  const [selectedProductId, setSelectedProductId] = useState('')
  const [currentCost, setCurrentCost] = useState('')
  const [currentQuantity, setCurrentQuantity] = useState('1')
  const [createNewMode, setCreateNewMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBarcode, setNewBarcode] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const products = useProductStore((s) => s.products)
  const addProduct = useProductStore((s) => s.addProduct)
  const increaseStock = useProductStore((s) => s.increaseStock)
  const updateProduct = useProductStore((s) => s.updateProduct)
  const categories = useCategoryStore((s) => s.categories)
  const purchases = usePurchaseStore((s) => s.purchases)
  const addPurchase = usePurchaseStore((s) => s.addPurchase)

  const catOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  const productOptions = useMemo(() =>
    products.map((p) => ({
      value: p.id,
      label: `${p.name} — ${p.barcode} · $${p.cost.toFixed(2)} · stock: ${p.stock}`,
    })),
    [products]
  )

  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId) ?? null
    : null

  const totalSpent = useMemo(() =>
    entries.reduce((sum, e) => sum + e.cost * e.quantity, 0),
    [entries]
  )

  const resetCurrent = useCallback(() => {
    setSelectedProductId('')
    setCurrentCost('')
    setCurrentQuantity('1')
    setCreateNewMode(false)
    setNewName('')
    setNewBarcode('')
    setNewBrand('')
    setNewCategoryId('')
    setNewDescription('')
  }, [])

  const addEntry = useCallback(() => {
    const qty = parseInt(currentQuantity, 10) || 0
    const cost = parseFloat(currentCost) || 0
    if (qty <= 0) return

    if (createNewMode) {
      if (!newName.trim()) return
      setEntries((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          productId: null,
          productName: newName.trim(),
          barcode: newBarcode.trim(),
          brand: newBrand.trim(),
          categoryId: newCategoryId,
          cost,
          quantity: qty,
          isNew: true,
          description: newDescription.trim(),
        },
      ])
    } else if (selectedProduct) {
      setEntries((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          barcode: selectedProduct.barcode,
          brand: selectedProduct.brand,
          categoryId: selectedProduct.categoryId,
          cost,
          quantity: qty,
          isNew: false,
          description: selectedProduct.description,
        },
      ])
    } else {
      return
    }

    resetCurrent()
  }, [currentQuantity, currentCost, createNewMode, newName, newBarcode, newBrand, newCategoryId, newDescription, selectedProduct, resetCurrent])

  const removeEntry = useCallback((tempId: string) => {
    setEntries((prev) => prev.filter((e) => e.tempId !== tempId))
  }, [])

  const handleSave = useCallback(() => {
    const purchaseItems: PurchaseItemType[] = []

    for (const entry of entries) {
      if (entry.isNew) {
        addProduct({
          name: entry.productName,
          brand: entry.brand || 'Genérico',
          barcode: entry.barcode || `manual-${Date.now()}-${entry.tempId.slice(0, 6)}`,
          categoryId: entry.categoryId || categories[0]?.id || 'cat-1',
          price: entry.cost * 1.3,
          cost: entry.cost,
          stock: entry.quantity,
          minStock: 5,
          description: entry.description,
        })
      } else if (entry.productId) {
        increaseStock(entry.productId, entry.quantity)
        updateProduct(entry.productId, { cost: entry.cost })
      }

      purchaseItems.push({
        productId: entry.productId || `new-${Date.now()}`,
        productName: entry.productName,
        barcode: entry.barcode || '-',
        quantity: entry.quantity,
        cost: entry.cost,
      })
    }

    if (purchaseItems.length > 0) {
      const total = purchaseItems.reduce((sum, pi) => sum + pi.quantity * pi.cost, 0)
      addPurchase({ items: purchaseItems, total, date: invoiceDate })
    }

    setEntries([])
    resetCurrent()
    setInvoiceDate(new Date().toISOString().split('T')[0])
  }, [entries, categories, addProduct, increaseStock, updateProduct, addPurchase, invoiceDate, resetCurrent])

  const canPreview = entries.length > 0

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 w-fit">
        <button
          onClick={() => setTab('new')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
            tab === 'new'
              ? 'bg-primary-dim text-primary-light'
              : 'text-muted hover:text-muted-light'
          }`}
        >
          <Package size={14} /> Nuevo Ingreso
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
            tab === 'history'
              ? 'bg-primary-dim text-primary-light'
              : 'text-muted hover:text-muted-light'
          }`}
        >
          <History size={14} /> Historial ({purchases.length})
        </button>
      </div>

      {tab === 'new' ? (
        <Card
          title="Ingreso de Stock"
          subtitle="Buscá productos existentes o creá nuevos y agregalos a la lista"
          actions={
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <Package size={14} className="text-primary" />
              <span className="font-semibold text-accent">{config.currency.symbol}{totalSpent.toFixed(2)}</span>
            </div>
          }
        >
          {/* Fecha */}
          <div className="mb-6">
            <Input
              label="Fecha del Comprobante"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full sm:w-56"
            />
          </div>

          {/* Buscador único */}
          <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
              <div className="flex-1 min-w-0">
                {!createNewMode ? (
                  <SearchSelect
                    label="Buscar producto existente"
                    options={productOptions}
                    value={selectedProductId}
                    onChange={(val) => { setSelectedProductId(val); setCreateNewMode(false) }}
                    placeholder="Nombre o código de barras..."
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="warning">Nuevo producto — se creará al guardar</Badge>
                      <button
                        onClick={() => setCreateNewMode(false)}
                        className="text-[11px] text-muted hover:text-danger-text transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        label="Nombre *"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ej: Lapicera Bic Azul"
                      />
                      <Input
                        label="Código de barras"
                        value={newBarcode}
                        onChange={(e) => setNewBarcode(e.target.value)}
                        placeholder="Opcional"
                      />
                      <Input
                        label="Marca"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        placeholder="Ej: Bic"
                      />
                      <Select
                        label="Categoría"
                        options={catOptions}
                        placeholder="Seleccionar"
                        value={newCategoryId}
                        onChange={(e) => setNewCategoryId(e.target.value)}
                      />
                      <Input
                        label="Descripción"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                )}
              </div>
              {!createNewMode && (
                <button
                  onClick={() => { setCreateNewMode(true); setSelectedProductId('') }}
                  className="text-left sm:text-right text-[11px] text-primary-light hover:underline whitespace-nowrap shrink-0"
                >
                  ¿No existe? Crear nuevo
                </button>
              )}
            </div>

            {/* Producto seleccionado / nuevo: costo + cantidad + agregar */}
            {(selectedProduct || createNewMode) && (
              <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                {selectedProduct && (
                  <div>
                    <p className="text-[13px] font-semibold text-text">{selectedProduct.name}</p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <code className="font-mono text-[10px] text-muted">{selectedProduct.barcode}</code>
                      <Badge variant="success">Stock actual: {selectedProduct.stock} uds.</Badge>
                      <Badge variant="default">Costo actual: {config.currency.symbol}{selectedProduct.cost.toFixed(2)}</Badge>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <Input
                    label="Costo x unidad"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentCost}
                    onChange={(e) => setCurrentCost(e.target.value)}
                    placeholder={selectedProduct ? String(selectedProduct.cost) : '0.00'}
                  />
                  <Input
                    label="Cantidad"
                    type="number"
                    min="1"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                  />
                  <Button
                    onClick={addEntry}
                    disabled={
                      !(parseFloat(currentCost) > 0 && parseInt(currentQuantity, 10) > 0) ||
                      (createNewMode && !newName.trim())
                    }
                  >
                    <CheckCircle2 size={15} /> Agregar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Lista / Carrito */}
          {entries.length > 0 && (
            <div className="mt-6 rounded-lg border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={14} className="text-muted" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted">
                    Artículos a ingresar ({entries.length})
                  </span>
                </div>
              </div>
              {entries.map((entry) => (
                <div key={entry.tempId} className="flex items-center justify-between border-b border-border/50 px-4 py-2.5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-text truncate">{entry.productName}</p>
                      {entry.isNew && <Badge variant="warning">Nuevo</Badge>}
                    </div>
                    <p className="text-[11px] text-muted">
                      {config.currency.symbol}{entry.cost.toFixed(2)} x {entry.quantity} ud. = {config.currency.symbol}{(entry.cost * entry.quantity).toFixed(2)}
                      {entry.barcode && ` · ${entry.barcode}`}
                    </p>
                  </div>
                  <Button variant="surface" size="sm" onClick={() => removeEntry(entry.tempId)}>
                    <Trash2 size={13} className="text-danger-text" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-[13px] font-semibold text-text">Total</span>
                <span className="text-[18px] font-bold text-accent">{config.currency.symbol}{totalSpent.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Acciones pie */}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="gold" onClick={() => setPreviewOpen(true)} disabled={!canPreview}>
              <FileText size={15} /> Previsualizar ({config.currency.symbol}{totalSpent.toFixed(2)})
            </Button>
          </div>
        </Card>
      ) : (
        <Card title="Historial de Compras" subtitle={`${purchases.length} compra${purchases.length !== 1 ? 's' : ''} registradas`}>
          {purchases.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted">
              <Package size={36} className="opacity-40" />
              <p className="text-[13px]">No hay compras registradas todavía</p>
              <button
                onClick={() => setTab('new')}
                className="text-[12px] text-primary-light hover:underline"
              >
                Ir a nuevo ingreso
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((pch) => (
                <div key={pch.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[13px] font-semibold text-text">Compra #{pch.id.slice(-6).toUpperCase()}</p>
                      <p className="text-[11px] text-muted">
                        {new Date(pch.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                        {pch.date && ` · Comp. ${new Date(pch.date).toLocaleDateString('es-ES')}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-bold text-accent">{config.currency.symbol}{pch.total.toFixed(2)}</p>
                      <p className="text-[11px] text-muted">{pch.items.length} artículo(s)</p>
                    </div>
                  </div>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-1.5 text-[9px] font-semibold uppercase tracking-[0.6px] text-muted">Producto</th>
                        <th className="pb-1.5 text-right text-[9px] font-semibold uppercase tracking-[0.6px] text-muted">Costo x ud.</th>
                        <th className="pb-1.5 text-right text-[9px] font-semibold uppercase tracking-[0.6px] text-muted">Cant.</th>
                        <th className="pb-1.5 text-right text-[9px] font-semibold uppercase tracking-[0.6px] text-muted">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pch.items.map((pi, idx) => (
                        <tr key={idx} className="border-b border-border/30">
                          <td className="py-1.5 pr-3 text-text">{pi.productName}</td>
                          <td className="py-1.5 pr-3 text-right text-muted-light">{config.currency.symbol}{pi.cost.toFixed(2)}</td>
                          <td className="py-1.5 pr-3 text-right text-muted-light">{pi.quantity}</td>
                          <td className="py-1.5 text-right font-semibold text-text">{config.currency.symbol}{(pi.quantity * pi.cost).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modal previsualización */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Previsualizar Ingreso" size="lg">
        <div className="space-y-5">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-[15px] font-bold text-text">{config.storeName}</h3>
              <p className="text-[12px] text-muted">Ingreso de Stock</p>
            </div>
            <div className="text-right text-[12px] text-muted-light">
              <p>
                <span className="text-muted">Fecha: </span>
                {new Date(invoiceDate).toLocaleDateString('es-ES', { dateStyle: 'long' })}
              </p>
              <p className="text-[11px] text-muted">Comprobante #{Date.now().toString().slice(-6)}</p>
            </div>
          </div>

          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Artículo</th>
                <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Tipo</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Costo x ud.</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Cant.</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.tempId} className="border-b border-border/50">
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold text-text">{entry.productName}</span>
                    {entry.barcode && (
                      <code className="ml-2 rounded border border-border bg-surface px-1 py-0.5 font-mono text-[10px] text-muted">
                        {entry.barcode}
                      </code>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    {entry.isNew
                      ? <Badge variant="warning">Nuevo</Badge>
                      : <Badge variant="success">Reposición</Badge>
                    }
                  </td>
                  <td className="py-2.5 pr-4 text-right text-muted-light">
                    {config.currency.symbol}{entry.cost.toFixed(2)}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-muted-light">{entry.quantity}</td>
                  <td className="py-2.5 text-right font-semibold text-text">
                    {config.currency.symbol}{(entry.cost * entry.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="pt-3 text-right text-[12px] font-semibold text-muted">Total</td>
                <td className="pt-3 text-right text-[18px] font-bold text-accent">
                  {config.currency.symbol}{totalSpent.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-surface px-3 py-2.5 text-[11px] text-muted">
            <span>{entries.length} artículo(s)</span>
            <span>{entries.filter((e) => e.isNew).length} nuevo(s)</span>
            <span>{entries.filter((e) => !e.isNew).length} reposición/es</span>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="gold-outline" onClick={() => setPreviewOpen(false)}>Volver</Button>
            <Button variant="gold" onClick={() => { handleSave(); setPreviewOpen(false) }}>
              Confirmar y Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
