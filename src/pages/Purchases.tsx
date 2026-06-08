import { useState, useMemo, useCallback } from 'react'
import { Plus, Trash2, Package, FileText, CheckCircle2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { useProductStore } from '../stores/useProductStore'
import { useCategoryStore } from '../stores/useCategoryStore'
import { config } from '../config'

interface PurchaseItem {
  tempId: string
  productId: string | null
  productName: string
  barcode: string
  brand: string
  categoryId: string
  cost: string
  quantity: string
  isNew: boolean
  description: string
  searchQuery: string
}

function createEmptyItem(): PurchaseItem {
  return {
    tempId: crypto.randomUUID(),
    productId: null,
    productName: '',
    barcode: '',
    brand: '',
    categoryId: '',
    cost: '',
    quantity: '1',
    isNew: false,
    description: '',
    searchQuery: '',
  }
}

export function Purchases() {
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<PurchaseItem[]>([createEmptyItem()])
  const [previewOpen, setPreviewOpen] = useState(false)

  const products = useProductStore((s) => s.products)
  const addProduct = useProductStore((s) => s.addProduct)
  const increaseStock = useProductStore((s) => s.increaseStock)
  const updateProduct = useProductStore((s) => s.updateProduct)
  const categories = useCategoryStore((s) => s.categories)

  const catOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  const totalSpent = useMemo(() =>
    items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0) * (parseInt(item.quantity, 10) || 0), 0),
    [items]
  )

  const addItem = useCallback(() => setItems((prev) => [...prev, createEmptyItem()]), [])

  const removeItem = useCallback((tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId))
  }, [])

  const updateItem = useCallback((tempId: string, data: Partial<PurchaseItem>) => {
    setItems((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, ...data } : i)))
  }, [])

  const handleSearch = useCallback((tempId: string, query: string) => {
    updateItem(tempId, { searchQuery: query })

    if (!query.trim()) {
      updateItem(tempId, {
        searchQuery: query,
        productId: null, productName: '', barcode: '', brand: '',
        categoryId: '', cost: '', isNew: false, description: '',
      })
      return
    }

    const q = query.toLowerCase()
    const found = products.find(
      (p) => p.barcode === query || p.name.toLowerCase().includes(q)
    )

    if (found) {
      updateItem(tempId, {
        searchQuery: query,
        productId: found.id, productName: found.name, barcode: found.barcode,
        brand: found.brand, categoryId: found.categoryId, cost: String(found.cost),
        isNew: false, description: found.description,
      })
    } else {
      updateItem(tempId, {
        searchQuery: query,
        productId: null, productName: query, barcode: '', brand: '',
        categoryId: '', cost: '', isNew: true, description: '',
      })
    }
  }, [products, updateItem])

  const clearItem = useCallback((tempId: string) => {
    updateItem(tempId, {
      productId: null, productName: '', barcode: '', brand: '',
      categoryId: '', cost: '', isNew: false, description: '', searchQuery: '',
    })
  }, [updateItem])

  const handleSave = useCallback(() => {
    for (const item of items) {
      const qty = parseInt(item.quantity, 10) || 0
      const cost = parseFloat(item.cost) || 0
      if (qty <= 0 || !item.productName.trim()) continue
      if (item.isNew) {
        addProduct({
          name: item.productName.trim(),
          brand: item.brand.trim() || 'Genérico',
          barcode: item.barcode.trim() || `manual-${Date.now()}`,
          categoryId: item.categoryId || categories[0]?.id || 'cat-1',
          price: cost * 1.3,
          cost,
          stock: qty,
          minStock: 5,
          description: item.description.trim(),
        })
      } else if (item.productId) {
        increaseStock(item.productId, qty)
        updateProduct(item.productId, { cost })
      }
    }
    setInvoiceDate(new Date().toISOString().split('T')[0])
    setItems([createEmptyItem()])
  }, [items, categories, addProduct, increaseStock, updateProduct])

  const canPreview = items.some((i) => i.productName.trim() && parseInt(i.quantity, 10) > 0)

  return (
    <div className="space-y-6">
      <Card
        title="Ingreso de Stock"
        subtitle="Cargá facturas o comprobantes para reponer stock o registrar nuevos artículos"
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

        {/* Items */}
        <div className="space-y-4">
          {items.map((item, index) => {
            const foundProduct = item.productId ? products.find((p) => p.id === item.productId) : null
            const hasMatch = !!item.productId
            const isTyping = item.searchQuery.trim().length > 0 && !hasMatch && !item.isNew
            const showNewForm = item.isNew
            const showExistingForm = hasMatch

            return (
              <div key={item.tempId} className="rounded-lg border border-border bg-surface p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted">
                    Artículo #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <Button variant="surface" size="sm" onClick={() => removeItem(item.tempId)}>
                      <Trash2 size={13} className="text-danger-text" />
                    </Button>
                  )}
                </div>

                {/* Campo de búsqueda único */}
                <Input
                  label="Buscar producto"
                  placeholder="Nombre o código de barras..."
                  value={item.searchQuery}
                  onChange={(e) => handleSearch(item.tempId, e.target.value)}
                  icon={
                    hasMatch
                      ? <CheckCircle2 size={14} className="text-success-text" />
                      : <Package size={14} className="text-muted" />
                  }
                />

                {/* Producto existente encontrado */}
                {showExistingForm && (
                  <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-text">{foundProduct?.name}</p>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <code className="font-mono text-[10px] text-muted">{foundProduct?.barcode}</code>
                          <Badge variant="success">Stock actual: {foundProduct?.stock} uds.</Badge>
                          <Badge variant="default">Costo actual: {config.currency.symbol}{foundProduct?.cost.toFixed(2)}</Badge>
                        </div>
                      </div>
                      <button
                        onClick={() => clearItem(item.tempId)}
                        className="text-[11px] text-muted hover:text-danger-text transition-colors shrink-0 ml-2"
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Nuevo costo x unidad"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.cost}
                        onChange={(e) => updateItem(item.tempId, { cost: e.target.value })}
                        placeholder={foundProduct?.cost.toFixed(2)}
                      />
                      <Input
                        label="Cantidad a ingresar"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.tempId, { quantity: e.target.value })}
                      />
                    </div>
                    {item.cost && item.quantity && (
                      <p className="text-[11px] text-muted">
                        Stock nuevo: <span className="font-semibold text-success-text">
                          {(foundProduct?.stock ?? 0) + (parseInt(item.quantity, 10) || 0)} uds.
                        </span>
                        {' · '}Subtotal: <span className="font-semibold text-accent">
                          {config.currency.symbol}{((parseFloat(item.cost) || 0) * (parseInt(item.quantity, 10) || 0)).toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* Nuevo producto */}
                {showNewForm && (
                  <div className="rounded-lg border border-dashed border-border-strong bg-card p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="warning">Nuevo producto — se creará al guardar</Badge>
                      <button
                        onClick={() => clearItem(item.tempId)}
                        className="text-[11px] text-muted hover:text-danger-text transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        label="Nombre *"
                        value={item.productName}
                        onChange={(e) => updateItem(item.tempId, { productName: e.target.value })}
                        placeholder="Ej: Lapicera Bic Azul"
                      />
                      <Input
                        label="Código de barras"
                        value={item.barcode}
                        onChange={(e) => updateItem(item.tempId, { barcode: e.target.value })}
                        placeholder="Opcional"
                      />
                      <Input
                        label="Marca"
                        value={item.brand}
                        onChange={(e) => updateItem(item.tempId, { brand: e.target.value })}
                        placeholder="Ej: Bic"
                      />
                      <Select
                        label="Categoría"
                        options={catOptions}
                        placeholder="Seleccionar"
                        value={item.categoryId}
                        onChange={(e) => updateItem(item.tempId, { categoryId: e.target.value })}
                      />
                      <Input
                        label="Costo x unidad"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.cost}
                        onChange={(e) => updateItem(item.tempId, { cost: e.target.value })}
                      />
                      <Input
                        label="Cantidad"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.tempId, { quantity: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Hint cuando está escribiendo sin match */}
                {isTyping && (
                  <p className="text-[11px] text-muted">
                    No se encontró el producto. Seguí escribiendo para crear uno nuevo.
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Acciones pie */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="gold-outline" size="sm" onClick={addItem}>
            <Plus size={15} /> Agregar otro artículo
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-muted">
              Total: <span className="font-bold text-accent">{config.currency.symbol}{totalSpent.toFixed(2)}</span>
            </span>
            <Button variant="gold" onClick={() => setPreviewOpen(true)} disabled={!canPreview}>
              <FileText size={15} /> Previsualizar
            </Button>
          </div>
        </div>
      </Card>

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
              {items
                .filter((i) => i.productName.trim() && parseInt(i.quantity, 10) > 0)
                .map((item) => {
                  const qty = parseInt(item.quantity, 10) || 0
                  const cost = parseFloat(item.cost) || 0
                  return (
                    <tr key={item.tempId} className="border-b border-border/50">
                      <td className="py-2.5 pr-4">
                        <span className="font-semibold text-text">{item.productName}</span>
                        {item.barcode && (
                          <code className="ml-2 rounded border border-border bg-surface px-1 py-0.5 font-mono text-[10px] text-muted">
                            {item.barcode}
                          </code>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        {item.isNew
                          ? <Badge variant="warning">Nuevo</Badge>
                          : <Badge variant="success">Reposición</Badge>
                        }
                      </td>
                      <td className="py-2.5 pr-4 text-right text-muted-light">
                        {config.currency.symbol}{cost.toFixed(2)}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-muted-light">{qty}</td>
                      <td className="py-2.5 text-right font-semibold text-text">
                        {config.currency.symbol}{(cost * qty).toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
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
            <span>{items.filter((i) => i.productName.trim()).length} artículo(s)</span>
            <span>{items.filter((i) => i.isNew && i.productName.trim()).length} nuevo(s)</span>
            <span>{items.filter((i) => !i.isNew && i.productName.trim()).length} reposición/es</span>
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