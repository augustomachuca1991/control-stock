import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, Package } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { config } from '../config'
import { toast } from 'sonner'
import { Select } from '../components/ui/Select'
import { useProducts } from '../hooks/useProducts'
import { usePurchases } from '../hooks/usePurchases'
import { useInvoices } from '../hooks/useInvoices'
import { useCategoryStore } from '../stores/useCategoryStore'
import type { PurchaseItem, InvoiceItem } from '../types'

interface DetectedItem {
  productName: string
  barcode: string
  quantity: number
  unitCost: number
  isNew: boolean
}

interface AnalysisResult {
  date: string
  total: number
  items: DetectedItem[]
}

export function Invoices() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [defaultCategoryId, setDefaultCategoryId] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const { products, add: addProduct, update: updateProduct, increaseStock } = useProducts()
  const { add: addPurchase } = usePurchases()
  const { invoices, add: addInvoice } = useInvoices()
  const categories = useCategoryStore((s) => s.categories)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') return
    setFile(f)
    setResult(null)
    setSaved(false)
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!file) return
    setAnalyzing(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      if (config.invoiceWebhookUrl) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch(config.invoiceWebhookUrl, { method: 'POST', body: formData })
        const data: AnalysisResult = await res.json()
        setResult(data)
      } else {
        // Mock mientras no hay webhook configurado
        await new Promise((r) => setTimeout(r, 1500))
        setResult({
          date: new Date().toISOString().split('T')[0],
          total: 12580.50,
          items: [
            { productName: 'Lapicera Bic Azul', barcode: '7791234567890', quantity: 50, unitCost: 120.50, isNew: false },
            { productName: 'Cuaderno Rivadavia A4', barcode: '7790987654321', quantity: 30, unitCost: 210.00, isNew: false },
            { productName: 'Resaltador Stabilo', barcode: '7791122334455', quantity: 20, unitCost: 95.00, isNew: true },
          ],
        })
      }
    } catch {
      toast.error('Error al analizar la factura')
      setAnalyzing(false)
      return
    }
    setAnalyzing(false)
  }, [file])

  const handleConfirm = useCallback(async () => {
    if (!result) return

    if (categories.length > 0 && !defaultCategoryId) {
      setCategoryError('Seleccioná una categoría para los productos nuevos')
      return
    }
    setCategoryError('')

    setSaving(true)

    const productIds = new Map<string, string>()

    try {
      for (const item of result.items) {
        const existing = products.find((p) => p.barcode === item.barcode)

        if (existing) {
          const { error: stockErr } = await increaseStock(existing.id, item.quantity)
          if (stockErr) throw new Error(`Error al actualizar stock de ${item.productName}: ${stockErr}`)
          if (existing.cost !== item.unitCost) {
            const { error: costErr } = await updateProduct(existing.id, { cost: item.unitCost })
            if (costErr) throw new Error(`Error al actualizar costo de ${item.productName}: ${costErr}`)
          }
          productIds.set(item.barcode, existing.id)
        } else {
          const { data, error } = await addProduct({
            name: item.productName,
            brand: '',
            barcode: item.barcode,
            categoryId: defaultCategoryId || null,
            price: 0,
            cost: item.unitCost,
            stock: item.quantity,
            minStock: 0,
            description: '',
            images: [],
            enabled: false,
          })
          if (error) throw new Error(`Error al crear producto ${item.productName}: ${error}`)
          if (data) {
            const created = data as { id: string }
            productIds.set(item.barcode, created.id)
          }
        }
      }

      const purchaseItems: PurchaseItem[] = result.items.map((item) => ({
        productId: productIds.get(item.barcode) ?? '',
        productName: item.productName,
        barcode: item.barcode,
        quantity: item.quantity,
        cost: item.unitCost,
      }))

      const { error: purchaseErr } = await addPurchase({
        items: purchaseItems,
        total: result.total,
        date: result.date,
      })
      if (purchaseErr) throw new Error(`Error al registrar la compra: ${purchaseErr}`)

      const { error: invoiceErr } = await addInvoice({
        fileName: file?.name ?? 'factura',
        date: result.date,
        total: result.total,
        items: result.items as InvoiceItem[],
        status: 'processed',
      })
      if (invoiceErr) throw new Error(`Error al guardar el historial: ${invoiceErr}`)

      toast.success('Factura procesada correctamente')
      setSaved(true)
      setConfirmOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }, [result, products, defaultCategoryId, addProduct, increaseStock, updateProduct, addPurchase])

  const reset = useCallback(() => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setSaved(false)
    setCategoryError('')
    if (file?.type.startsWith('image/') && preview) URL.revokeObjectURL(preview)
  }, [file, preview])

  return (
    <div className="space-y-4">
      <Card title="Factura" subtitle="Subí una foto o PDF de la factura para analizarla automáticamente">
        {!result && !saved && (
          <div className="space-y-4">
            {/* Dropzone */}
            {!file && (
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => inputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border bg-surface p-8 transition-colors hover:border-border-strong hover:bg-primary-dim/20"
              >
                <Upload size={36} className="text-muted" />
                <div className="text-center">
                  <p className="text-[13px] font-medium text-text">Hacé clic o arrastrá una imagen / PDF</p>
                  <p className="mt-1 text-[11px] text-muted">JPG, PNG, PDF</p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
                  className="hidden"
                />
              </div>
            )}

            {/* Preview del archivo seleccionado */}
            {file && (
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-lg border border-border bg-surface p-4">
                  {preview ? (
                    <img src={preview} alt="Preview" className="h-28 w-28 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-primary-dim">
                      <FileText size={32} className="text-primary-light" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-text truncate">{file.name}</p>
                    <p className="text-[11px] text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="gold" size="sm" onClick={handleAnalyze} disabled={analyzing}>
                        {analyzing ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                        {analyzing ? 'Analizando...' : 'Analizar Factura'}
                      </Button>
                      <Button variant="surface" size="sm" onClick={reset} disabled={analyzing}>
                        <X size={14} /> Cambiar archivo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estado de análisis */}
            {analyzing && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                <Loader2 size={18} className="animate-spin text-primary-light" />
                <div>
                  <p className="text-[12px] font-medium text-text">Analizando factura...</p>
                  <p className="text-[10px] text-muted">Extrayendo productos, cantidades y precios</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resultado del análisis */}
        {result && !saved && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-success-dim/50 bg-success-dim/20 px-4 py-3">
              <CheckCircle2 size={16} className="text-success-text" />
              <p className="text-[12px] text-text">Factura analizada correctamente</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[12px]">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Fecha</span>
                <p className="mt-0.5 text-text">{new Date(result.date).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Total</span>
                <p className="mt-0.5 text-[18px] font-bold text-accent">{config.currency.symbol}{result.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">
                Productos detectados ({result.items.length})
              </div>
              <div className="divide-y divide-border/50">
                {result.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-text truncate">{item.productName}</p>
                        {item.isNew && <Badge variant="warning">Nuevo</Badge>}
                      </div>
                      <code className="text-[10px] text-muted">{item.barcode}</code>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-[12px] text-text">{config.currency.symbol}{item.unitCost.toFixed(2)} x {item.quantity}</p>
                      <p className="text-[11px] text-muted-light">Subtotal: {config.currency.symbol}{(item.unitCost * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="surface" size="sm" onClick={reset}>
                <X size={14} /> Descartar
              </Button>
              <Button variant="gold" onClick={() => setConfirmOpen(true)}>
                <Package size={15} /> Confirmar y Guardar
              </Button>
            </div>
          </div>
        )}

        {/* Guardado exitoso */}
        {saved && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-dim">
              <CheckCircle2 size={28} className="text-success-text" />
            </div>
            <p className="text-[15px] font-semibold text-text">Factura procesada correctamente</p>
            <p className="text-[12px] text-muted">Stock y compras actualizados</p>
            <Button variant="gold-outline" size="sm" onClick={reset}>
              <Upload size={14} /> Analizar otra factura
            </Button>
          </div>
        )}
      </Card>

      {/* Modal confirmación */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar Factura" size="lg">
        {result && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-primary-light" />
              <div className="text-[12px] text-muted">
                <p className="font-semibold text-text">¿Guardar esta factura?</p>
                <p className="mt-1">Se crearán los productos nuevos, se actualizará el stock de los existentes y se registrará la compra en el historial.</p>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="w-full sm:w-72">
                <Select
                  label="Categoría para productos nuevos"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  value={defaultCategoryId}
                  onChange={(e) => { setDefaultCategoryId(e.target.value); setCategoryError('') }}
                  placeholder="Seleccionar categoría..."
                  error={categoryError}
                />
              </div>
            )}

            <div className="rounded-lg border border-border divide-y divide-border/50">
              {result.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-[12px]">
                  <span className="text-text">{item.productName}</span>
                  <span className="text-muted-light">
                    {item.isNew ? '🆕 Nuevo' : '📦 Reposición'} — {config.currency.symbol}{item.unitCost.toFixed(2)} x {item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-[13px] font-semibold text-text">Total factura</span>
              <span className="text-[18px] font-bold text-accent">{config.currency.symbol}{result.total.toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="gold-outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button variant="gold" onClick={handleConfirm} disabled={saving}>
                {saving ? 'Guardando...' : 'Confirmar y Guardar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Historial */}
      <Card title="Historial" subtitle="Facturas procesadas">
        {invoices.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted">Todavía no se procesaron facturas</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-text truncate">{inv.fileName}</p>
                    <p className="text-[11px] text-muted">
                      {new Date(inv.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                    </p>
                    <p className="text-[10px] text-muted mt-1">
                      {inv.items.length} artículo{inv.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[15px] font-bold text-accent">{config.currency.symbol}{inv.total.toFixed(2)}</p>
                    <Badge variant="success">Procesada</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
