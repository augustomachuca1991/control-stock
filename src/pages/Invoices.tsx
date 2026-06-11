import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, Package, ScanLine } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Img } from '../components/ui/Img'
import { Modal } from '../components/ui/Modal'
import { SkeletonRow } from '../components/ui/Skeleton'
import { config } from '../config'
import { toast } from 'sonner'
import { Select } from '../components/ui/Select'
import { useProducts } from '../hooks/useProducts'
import { usePurchases } from '../hooks/usePurchases'
import { useInvoices } from '../hooks/useInvoices'
import { useCategoryStore } from '../stores/useCategoryStore'
import { supabase } from '../lib/supabaseClient'
import { computeFileHash } from '../lib/hash'
import type { PurchaseItem, InvoiceItem } from '../types'

interface DetectedItem {
  productName: string
  brand: string
  barcode: string
  quantity: number
  unitCost: number
  isNew: boolean
}

interface AnalysisResult {
  date: string
  total: number
  iva: number
  iibb: number
  items: DetectedItem[]
}

// ─── Stepper ────────────────────────────────────────────────────────────────

type StepStatus = 'done' | 'active' | 'pending'

function StepNode({ status, index }: { status: StepStatus; index: number }) {
  const base = 'flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-medium'
  const styles: Record<StepStatus, string> = {
    done: 'bg-accent text-white',
    active: 'border border-accent bg-accent/10 text-accent',
    pending: 'border border-border bg-surface text-muted',
  }
  return (
    <div className={`${base} ${styles[status]}`}>
      {status === 'done' ? <CheckCircle2 size={13} /> : index}
    </div>
  )
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['Subir', 'Revisar', 'Confirmar']
  const getStatus = (i: number): StepStatus => {
    if (i + 1 < step) return 'done'
    if (i + 1 === step) return 'active'
    return 'pending'
  }
  return (
    <div className="mb-5 flex items-start">
      {steps.map((label, i) => (
        <div key={label} className="flex flex-1 items-start">
          <div className="flex flex-1 flex-col items-center gap-1">
            <StepNode status={getStatus(i)} index={i + 1} />
            <span className="text-[10px] text-muted">{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mt-[13px] h-px flex-1 transition-colors ${i + 1 < step ? 'bg-accent' : 'bg-border'
                }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function Invoices() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [editItems, setEditItems] = useState<DetectedItem[]>([])
  const [editDate, setEditDate] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [defaultCategoryId, setDefaultCategoryId] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [fileHash, setFileHash] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const { products, add: addProduct, update: updateProduct, increaseStock } = useProducts()
  const { add: addPurchase } = usePurchases()
  const { invoices, add: addInvoice, loading: invoicesLoading } = useInvoices()
  const categories = useCategoryStore((s) => s.categories)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // Derive stepper step
  const step: 1 | 2 | 3 = saved ? 3 : result ? 2 : 1

  useEffect(() => {
    if (result) {
      setEditItems(result.items.map((i) => ({ ...i })))
      setEditDate(result.date || new Date().toISOString().split('T')[0])
    }
  }, [result])

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') return
    setFile(f)
    setResult(null)
    setSaved(false)
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  const handleAnalyze = useCallback(async () => {
    if (!file) return
    setAnalyzing(true)
    setResult(null)
    setFileHash('')

    try {
      const hash = await computeFileHash(file)
      const { data: existing } = await supabase
        .from('invoices')
        .select('file_name, created_at')
        .eq('file_hash', hash)
        .maybeSingle()

      if (existing) {
        const fecha = new Date(existing.created_at).toLocaleDateString('es-ES')
        toast.error(`Esta factura ya fue procesada como "${existing.file_name}" el ${fecha}`)
        setAnalyzing(false)
        return
      }

      setFileHash(hash)

      const formData = new FormData()
      formData.append('file', file)

      if (config.invoiceWebhookUrl) {
        const res = await fetch(config.invoiceWebhookUrl, { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Error en el análisis')
        setResult(await res.json())
      } else if (config.invoiceAiUrl) {
        const res = await fetch(config.invoiceAiUrl, { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Error al analizar la factura')
        }
        const data: AnalysisResult = await res.json()
        if (!data.date) data.date = new Date().toISOString().split('T')[0]
        setResult(data)
      } else {
        await new Promise((r) => setTimeout(r, 1500))
        setResult({
          date: new Date().toISOString().split('T')[0],
          total: 12580.5,
          iva: 2310.0,
          iibb: 500.0,
          items: [
            { productName: 'Lapicera Bic Azul', brand: 'Bic', barcode: '7791234567890', quantity: 50, unitCost: 120.5, isNew: false },
            { productName: 'Cuaderno Rivadavia A4', brand: 'Rivadavia', barcode: '7790987654321', quantity: 30, unitCost: 210.0, isNew: false },
            { productName: 'Resaltador Stabilo', brand: 'Stabilo', barcode: '7791122334455', quantity: 20, unitCost: 95.0, isNew: true },
          ],
        })
      }
    } catch {
      toast.error('Error al analizar la factura')
    } finally {
      setAnalyzing(false)
    }
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
      let imageUrl = ''
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `${crypto.randomUUID()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('invoice-files').upload(path, file)
        if (uploadErr) { toast.error('Error al guardar el archivo'); setSaving(false); return }
        const { data: pub } = supabase.storage.from('invoice-files').getPublicUrl(path)
        imageUrl = pub.publicUrl
      }

      for (let i = 0; i < editItems.length; i++) {
        const item = editItems[i]
        const key = item.barcode || `__idx_${i}`
        const existing = item.barcode ? products.find((p) => p.barcode === item.barcode) : undefined

        if (existing) {
          const { error: stockErr } = await increaseStock(existing.id, item.quantity)
          if (stockErr) throw new Error(`Error al actualizar stock de ${item.productName}: ${stockErr}`)
          if (existing.cost !== item.unitCost) {
            const { error: costErr } = await updateProduct(existing.id, { cost: item.unitCost })
            if (costErr) throw new Error(`Error al actualizar costo de ${item.productName}: ${costErr}`)
          }
          productIds.set(key, existing.id)
        } else {
          const { data, error } = await addProduct({
            name: item.productName,
            brand: item.brand || 'N/A',
            barcode: item.barcode,
            categoryId: defaultCategoryId,
            price: 0,
            cost: item.unitCost,
            stock: item.quantity,
            minStock: 0,
            description: item.productName,
            images: [],
            enabled: false,
          })
          if (error) throw new Error(`Error al crear producto ${item.productName}: ${error}`)
          if (data) productIds.set(key, (data as { id: string }).id)
        }
      }

      const purchaseItems: PurchaseItem[] = editItems.map((item, i) => ({
        productId: productIds.get(item.barcode || `__idx_${i}`) ?? '',
        productName: item.productName,
        barcode: item.barcode,
        quantity: item.quantity,
        cost: item.unitCost,
      }))

      const { error: purchaseErr } = await addPurchase({
        items: purchaseItems,
        total: result.total,
        iva: result.iva,
        iibb: result.iibb,
        date: editDate,
      })
      if (purchaseErr) throw new Error(`Error al registrar la compra: ${purchaseErr}`)

      const { error: invoiceErr } = await addInvoice({
        fileName: file?.name ?? 'factura',
        fileHash,
        date: editDate,
        total: result.total,
        iva: result.iva,
        iibb: result.iibb,
        items: editItems as InvoiceItem[],
        imageUrl,
        status: 'processed',
      })
      if (invoiceErr) throw new Error(`Error al guardar el historial: ${invoiceErr}`)

      toast.success('Factura procesada correctamente')
      setSaved(true)
      setConfirmOpen(false)
    } catch (e) {
      console.error('handleConfirm error:', e)
      toast.error(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }, [result, editItems, editDate, file, products, defaultCategoryId, addProduct, increaseStock, updateProduct, addPurchase, addInvoice, fileHash, categories.length])

  const reset = useCallback(() => {
    if (file?.type.startsWith('image/') && preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setResult(null)
    setSaved(false)
    setCategoryError('')
    setFileHash('')
  }, [file, preview])

  const formatDate = (iso: string) =>
    iso
      ? new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)).toLocaleDateString('es-ES', {
        dateStyle: 'long',
      })
      : '—'

  return (
    <div className="space-y-4">
      {/* ─── Card principal ─── */}
      <Card
        title="Factura"
        subtitle="Subí una foto o PDF de la factura para analizarla automáticamente"
      >
        {/* Stepper siempre visible */}
        <Stepper step={step} />

        {/* ── PASO 1: Selección de archivo ── */}
        {!result && !saved && (
          <div className="space-y-3">
            {/* Dropzone */}
            {!file && (
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-3 rounded-[10px] border-2 border-dashed border-border bg-surface-dim p-8 transition-colors hover:border-accent/60 hover:bg-accent/5"
              >
                <Upload size={30} className="text-muted" />
                <div className="text-center">
                  <p className="text-[13px] font-medium text-text">Arrastrá o hacé clic para subir</p>
                  <p className="mt-0.5 text-[11px] text-muted">JPG · PNG · PDF</p>
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

            {/* Archivo seleccionado */}
            {file && (
              <div className="flex items-center gap-3 rounded-[10px] border border-border bg-surface-dim p-3">
                {preview ? (
                  <Img src={preview} alt="Preview" className="h-11 w-11 rounded-lg object-cover" skeleton="rounded-lg" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <FileText size={20} className="text-accent" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text">{file.name}</p>
                  <p className="text-[11px] text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button variant="gold" size="sm" onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing
                    ? <Loader2 size={14} className="animate-spin" />
                    : <ScanLine size={14} />
                  }
                  <span className="hidden sm:inline">{analyzing ? 'Analizando...' : 'Analizar'}</span>
                </Button>
                <Button variant="surface" size="sm" onClick={reset} disabled={analyzing}>
                  <X size={14} />
                </Button>
              </div>
            )}

            {/* Analizando */}
            {analyzing && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-dim px-4 py-3">
                <Loader2 size={16} className="animate-spin text-accent" />
                <div>
                  <p className="text-[12px] font-medium text-text">Analizando factura...</p>
                  <p className="text-[10px] text-muted">Extrayendo productos, cantidades y precios</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 2: Revisión del resultado ── */}
        {result && !saved && (
          <div className="space-y-4">
            {/* Banner de éxito del análisis */}
            <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/8 px-3.5 py-2.5">
              <CheckCircle2 size={15} className="shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-text">{file?.name}</p>
                <p className="text-[10px] text-muted">
                  {result.items.length} producto{result.items.length !== 1 ? 's' : ''} detectado{result.items.length !== 1 ? 's' : ''} · {formatDate(editDate)}
                </p>
              </div>
            </div>

            {/* Meta cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Fecha', value: formatDate(editDate) },
                { label: 'Productos', value: String(result.items.length) },
                { label: 'Total', value: `${config.currency.symbol}${result.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, accent: true },
              ].map(({ label, value, accent }) => (
                <div key={label} className="rounded-lg border border-border bg-surface-dim px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">{label}</p>
                  <p className={`mt-0.5 text-[14px] font-medium ${accent ? 'text-accent' : 'text-text'}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Tabla de productos */}
            <div className="overflow-hidden rounded-lg border border-border">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 border-b border-border bg-surface-dim px-4 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Producto</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted text-right">Cant.</span>
                <span className="hidden text-[10px] font-semibold uppercase tracking-[0.6px] text-muted text-right sm:block">Costo unit.</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted text-right">Subtotal</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted text-center">Tipo</span>
              </div>
              {/* Rows */}
              <div className="divide-y divide-border/50">
                {result.items.map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-text">{item.productName}</p>
                      <p className="text-[10px] text-muted">{item.brand || 'N/A'} · {item.barcode}</p>
                    </div>
                    <span className="text-[12px] text-muted text-right">{item.quantity}</span>
                    <span className="hidden text-[12px] text-muted text-right sm:block">
                      {config.currency.symbol}{item.unitCost.toFixed(2)}
                    </span>
                    <span className="text-[12px] font-medium text-text text-right">
                      {config.currency.symbol}{(item.unitCost * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </span>
                    <div className="flex justify-center">
                      <Badge variant={item.isNew ? 'warning' : 'success'}>
                        {item.isNew ? 'Nuevo' : 'Repos.'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="space-y-1 border-t border-border pt-3">
              {result.iva > 0 && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted">IVA</span>
                  <span className="text-muted">{config.currency.symbol}{result.iva.toFixed(2)}</span>
                </div>
              )}
              {result.iibb > 0 && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted">IIBB</span>
                  <span className="text-muted">{config.currency.symbol}{result.iibb.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-[13px] font-medium text-text">Total factura</span>
                <span className="text-[20px] font-medium text-accent">
                  {config.currency.symbol}{result.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="surface" size="sm" onClick={reset}>
                <X size={13} /> Descartar
              </Button>
              <Button variant="gold" onClick={() => setConfirmOpen(true)}>
                <Package size={14} /> Confirmar y guardar
              </Button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Guardado exitoso ── */}
        {saved && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-dim">
              <CheckCircle2 size={28} className="text-success-text" />
            </div>
            <p className="text-[14px] font-medium text-text">Factura procesada correctamente</p>
            <p className="text-[12px] text-muted">Stock y compras actualizados</p>
            <Button variant="gold-outline" size="sm" onClick={reset}>
              <Upload size={14} /> Analizar otra
            </Button>
          </div>
        )}
      </Card>

      {/* ─── Modal de confirmación ─── */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar factura" size="lg">
        {result && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-dim p-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-accent" />
              <div className="text-[12px] text-muted">
                <p className="font-medium text-text">¿Guardar esta factura?</p>
                <p className="mt-0.5">Podés corregir la fecha y el tipo de cada producto antes de confirmar.</p>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">
                  Fecha de la factura
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-accent"
                />
              </div>
              <div className="self-end text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Total</p>
                <p className="text-[22px] font-medium text-accent">
                  {config.currency.symbol}{result.total.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Lista editable con toggle isNew */}
            <div className="divide-y divide-border/50 rounded-lg border border-border">
              {editItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-text">{item.productName}</p>
                    <p className="text-[10px] text-muted">{item.brand || 'N/A'} · {item.barcode}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden whitespace-nowrap text-[12px] text-muted sm:inline">
                      {config.currency.symbol}{item.unitCost.toFixed(2)} × {item.quantity}
                    </span>
                    {/* Toggle isNew */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium ${item.isNew ? 'text-warning-text' : 'text-muted'}`}>
                        {item.isNew ? 'Nuevo' : 'Repos.'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditItems((prev) =>
                            prev.map((it, idx) => (idx === i ? { ...it, isNew: !it.isNew } : it)),
                          )
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${item.isNew
                            ? 'border-accent/40 bg-accent/20'
                            : 'border-border bg-surface-dim'
                          }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-text transition-transform ${item.isNew ? 'translate-x-[18px]' : 'translate-x-[2px]'
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales del modal */}
            <div className="space-y-1 border-t border-border pt-3">
              {result.iva > 0 && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted">IVA</span>
                  <span className="text-muted">{config.currency.symbol}{result.iva.toFixed(2)}</span>
                </div>
              )}
              {result.iibb > 0 && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted">IIBB</span>
                  <span className="text-muted">{config.currency.symbol}{result.iibb.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-[13px] font-medium text-text">Total factura</span>
                <span className="text-[20px] font-medium text-accent">
                  {config.currency.symbol}{result.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="gold-outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button variant="gold" onClick={handleConfirm} disabled={saving}>
                {saving ? 'Guardando...' : 'Confirmar y guardar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Card historial ─── */}
      <Card title="Historial" subtitle="Facturas procesadas">
        {invoicesLoading ? (
          <div className="divide-y divide-border/50 rounded-lg border border-border">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : invoices.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted">Todavía no se procesaron facturas</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface-dim p-3"
              >
                {/* Thumb */}
                {inv.imageUrl ? (
                  <button type="button" onClick={() => setPreviewImage(inv.imageUrl!)} className="shrink-0">
                    <Img
                      src={inv.imageUrl}
                      alt=""
                      className="h-14 w-14 rounded-lg border border-border object-cover"
                      skeleton="rounded-lg"
                    />
                  </button>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <FileText size={20} className="text-accent" />
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text">{inv.fileName}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {new Date(inv.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {inv.items.length} artículo{inv.items.length !== 1 ? 's' : ''}
                  </p>
                  {inv.userEmail && (
                    <p className="mt-0.5 text-[10px] text-muted">Registró: {inv.userEmail}</p>
                  )}
                </div>

                {/* Totales */}
                <div className="shrink-0 text-right">
                  <p className="text-[15px] font-medium text-accent">
                    {config.currency.symbol}{inv.total.toFixed(2)}
                  </p>
                  {inv.iva > 0 && (
                    <p className="text-[10px] text-muted">IVA {config.currency.symbol}{inv.iva.toFixed(2)}</p>
                  )}
                  {inv.iibb > 0 && (
                    <p className="text-[10px] text-muted">IIBB {config.currency.symbol}{inv.iibb.toFixed(2)}</p>
                  )}
                  <Badge variant="success">Procesada</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── Modal imagen ampliada ─── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          >
            <X size={18} />
          </button>
          <Img
            src={previewImage}
            alt=""
            className="relative max-h-[90vh] max-w-full rounded-lg object-contain"
            skeleton="rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}