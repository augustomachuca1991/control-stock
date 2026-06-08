import { useState, useMemo, useCallback } from 'react'
import { Plus, Trash2, Barcode, Package, FileText, Search } from 'lucide-react'
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
    isNew: true,
    description: '',
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

  const handleBarcodeSearch = useCallback((tempId: string, barcode: string) => {
    const found = products.find((p) => p.barcode === barcode)
    if (found) {
      updateItem(tempId, {
        productId: found.id, productName: found.name, barcode: found.barcode,
        brand: found.brand, categoryId: found.categoryId, cost: String(found.cost),
        isNew: false, description: found.description,
      })
    } else {
      updateItem(tempId, { productId: null, barcode, isNew: true })
    }
  }, [products, updateItem])

  const handleProductSelect = useCallback((tempId: string, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      updateItem(tempId, {
        productId: product.id, productName: product.name, barcode: product.barcode,
        brand: product.brand, categoryId: product.categoryId, cost: String(product.cost),
        isNew: false, description: product.description,
      })
    }
  }, [products, updateItem])

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

  const productOptions = useMemo(() =>
    products.map((p) => ({ value: p.id, label: `${p.name} (${p.barcode})` })),
    [products]
  )

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
            return (
              <div key={item.tempId} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted">
                    Artículo #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <Button variant="surface" size="sm" onClick={() => removeItem(item.tempId)}>
                      <Trash2 size={13} className="text-danger-text" />
                    </Button>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Input
                      label=""
                      placeholder="Escanear código de barras..."
                      value={item.barcode}
                      onChange={(e) => {
                        const val = e.target.value
                        updateItem(item.tempId, { barcode: val })
                        if (val.length >= 4) handleBarcodeSearch(item.tempId, val)
                      }}
                      icon={<Barcode size={14} className="text-muted" />}
                    />
                  </div>
                  <div>
                    <Select
                      label=""
                      placeholder="O seleccionar existente"
                      options={productOptions}
                      value={item.productId ?? ''}
                      onChange={(e) => handleProductSelect(item.tempId, e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Costo x unidad"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.cost}
                      onChange={(e) => updateItem(item.tempId, { cost: e.target.value })}
                    />
                  </div>
                  <div>
                    <Input
                      label="Cantidad"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.tempId, { quantity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  {item.isNew ? (
                    <div className="grid grid-cols-1 gap-3 rounded-lg border border-dashed border-border-strong bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="sm:col-span-2 lg:col-span-1">
                        <Input
                          label="Nombre del nuevo artículo *"
                          value={item.productName}
                          onChange={(e) => updateItem(item.tempId, { productName: e.target.value })}
                          placeholder="Ej: Lapicera Bic Azul"
                        />
                      </div>
                      <div>
                        <Input
                          label="Marca"
                          value={item.brand}
                          onChange={(e) => updateItem(item.tempId, { brand: e.target.value })}
                          placeholder="Ej: Bic"
                        />
                      </div>
                      <div>
                        <Select
                          label="Categoría"
                          options={catOptions}
                          placeholder="Seleccionar"
                          value={item.categoryId}
                          onChange={(e) => updateItem(item.tempId, { categoryId: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-1">
                        <Input
                          label="Descripción"
                          value={item.description}
                          onChange={(e) => updateItem(item.tempId, { description: e.target.value })}
                          placeholder="Opcional"
                        />
                      </div>
                      <div className="col-span-full">
                        <Badge variant="warning">Nuevo producto — se creará al guardar</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                      <Search size={13} className="text-muted" />
                      <span className="text-[13px] font-semibold text-text">{foundProduct?.name}</span>
                      <code className="font-mono text-[10px] text-muted">{foundProduct?.barcode}</code>
                      <Badge variant="success">
                        Stock: {foundProduct?.stock} → {(foundProduct?.stock ?? 0) + (parseInt(item.quantity, 10) || 0)}
                      </Badge>
                    </div>
                  )}
                </div>
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