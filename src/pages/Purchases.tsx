import { useState, useMemo, useCallback, useEffect } from 'react'

import { useSearchParams } from 'react-router-dom'
import { Formik, Form } from 'formik'
import { Trash2, Package, FileText, Check, History, ShoppingCart, AlertTriangle, ChevronLeft, ChevronRight, Download, Mail } from 'lucide-react'

import { Pagination } from '../components/ui/Pagination'
import { exportToXLSX, type ExportColumn } from '../lib/export'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { SearchSelect } from '../components/ui/SearchSelect'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Field } from '../components/ui/Field'
import { SelectField } from '../components/ui/SelectField'
import { SkeletonRow } from '../components/ui/Skeleton'
import { useProductStore } from '../stores/useProductStore'
import { useCategoryStore } from '../stores/useCategoryStore'
import { usePurchaseStore } from '../stores/usePurchaseStore'
import { useProducts } from '../hooks/useProducts'
import { usePurchases } from '../hooks/usePurchases'
import { purchaseEntrySchema } from '../lib/validation'
import type { PurchaseItem as PurchaseItemType } from '../types'
import { config } from '../config'
import { toast } from 'sonner'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTab = searchParams.get('tab') as 'new' | 'history' | 'reorder' | null
  const [tab, setTab] = useState<'new' | 'history' | 'reorder'>(urlTab || 'history')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [previewOpen, setPreviewOpen] = useState(false)

  // Cart
  const [entries, setEntries] = useState<Entry[]>([])

  // Current item being configured
  const [selectedProductId, setSelectedProductId] = useState('')
  const [saving, setSaving] = useState(false)

  // Reorder pagination
  const [reorderPage, setReorderPage] = useState(1)
  const reorderPerPage = 10

  useEffect(() => {
    if (urlTab && urlTab !== tab) setTab(urlTab)
  }, [urlTab])

  const products = useProductStore((s) => s.products)
  const categories = useCategoryStore((s) => s.categories)
  const purchases = usePurchaseStore((s) => s.purchases)
  const getCategoryById = useCategoryStore((s) => s.getCategoryById)
  const { add: addProduct, increaseStock, update: updateProduct } = useProducts()
  const { add: addPurchase, loading: purchasesLoading } = usePurchases()
  const { loading: productsLoading } = useProducts()
  const loading = purchasesLoading || productsLoading

  const [historyPage, setHistoryPage] = useState(1)
  const historyPerPage = 15

  useEffect(() => {
    const maxPages = Math.max(1, Math.ceil(purchases.length / historyPerPage))
    if (historyPage > maxPages) setHistoryPage(maxPages)
  }, [purchases.length, historyPage])

  const paginatedPurchases = useMemo(() => {
    const start = (historyPage - 1) * historyPerPage
    return purchases.slice(start, start + historyPerPage)
  }, [purchases, historyPage])

  const purchaseExportColumns: ExportColumn<import('../types').Purchase>[] = [
    { key: (p) => `#${p.id.slice(-6).toUpperCase()}`, header: 'ID' },
    { key: (p) => p.items.length, header: 'Artículos' },
    { key: 'total', header: 'Total', format: (v) => `${config.currency.symbol}${Number(v).toFixed(2)}` },
    { key: (p) => new Date(p.createdAt).toLocaleDateString('es-ES'), header: 'Fecha' },
  ]

  const lowStockProducts = useMemo(() =>
    products.filter((p) => p.enabled && p.stock <= p.minStock),
    [products]
  )

  const reorderTotalPages = useMemo(() =>
    Math.max(1, Math.ceil(lowStockProducts.length / reorderPerPage)),
    [lowStockProducts.length]
  )

  const paginatedReorder = useMemo(() => {
    const start = (reorderPage - 1) * reorderPerPage
    return lowStockProducts.slice(start, start + reorderPerPage)
  }, [lowStockProducts, reorderPage])

  useEffect(() => {
    if (reorderPage > reorderTotalPages) setReorderPage(reorderTotalPages)
  }, [reorderTotalPages, reorderPage])

  const catOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  const productOptions = useMemo(() =>
    products
      .filter((p) => p.enabled !== false)
      .map((p) => ({
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

  const handleAddEntry = useCallback((
    values: typeof purchaseEntryInitialValues,
    resetForm: () => void,
  ) => {
    const qty = parseInt(values.quantity, 10) || 0
    const cost = parseFloat(values.cost) || 0

    if (values.createNewMode) {
      setEntries((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          productId: null,
          productName: values.newName.trim(),
          barcode: values.newBarcode.trim(),
          brand: values.newBrand.trim(),
          categoryId: values.newCategoryId,
          cost,
          quantity: qty,
          isNew: true,
          description: values.newDescription.trim(),
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
    }

    setSelectedProductId('')
    resetForm()
  }, [selectedProduct])

  const purchaseEntryInitialValues = {
    cost: '',
    quantity: '1',
    createNewMode: false as boolean,
    newName: '',
    newBarcode: '',
    newBrand: '',
    newCategoryId: '',
    newDescription: '',
  }

  const removeEntry = useCallback((tempId: string) => {
    setEntries((prev) => prev.filter((e) => e.tempId !== tempId))
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    const purchaseItems: PurchaseItemType[] = []

    for (const entry of entries) {
      if (entry.isNew) {
        await addProduct({
          name: entry.productName,
          brand: entry.brand || 'Genérico',
          barcode: entry.barcode || `manual-${Date.now()}-${entry.tempId.slice(0, 6)}`,
          categoryId: entry.categoryId || categories[0]?.id || 'cat-1',
          price: entry.cost * 1.3,
          cost: entry.cost,
          stock: entry.quantity,
          minStock: 5,
          description: entry.description,
          enabled: true,
        })
      } else if (entry.productId) {
        await increaseStock(entry.productId, entry.quantity)
        await updateProduct(entry.productId, { cost: entry.cost })
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
      await addPurchase({ items: purchaseItems, total, date: invoiceDate })
    }

    setSaving(false)
    setEntries([])
    setSelectedProductId('')
    setInvoiceDate(new Date().toISOString().split('T')[0])
  }, [entries, categories, addProduct, increaseStock, updateProduct, addPurchase, invoiceDate])

  const canPreview = entries.length > 0

  const handleTabChange = useCallback((t: 'new' | 'history' | 'reorder') => {
    setTab(t)
    setSearchParams(t === 'history' ? {} : { tab: t })
  }, [setSearchParams])

  const handleDownloadCSV = useCallback(() => {
    if (lowStockProducts.length === 0) return
    const sep = ';'
    const rows = [
      ['Producto', 'Marca', 'Stock', 'Mínimo', 'Déficit', 'Categoría'].join(sep),
      ...lowStockProducts.map(p =>
        [
          `"${p.name}"`,
          `"${p.brand || ''}"`,
          p.stock,
          p.minStock,
          Math.max(0, p.minStock - p.stock),
          `"${getCategoryById(p.categoryId)?.name || ''}"`,
        ].join(sep)
      ),
    ].join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `productos_por_reponer_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV descargado')
  }, [lowStockProducts, getCategoryById])

  const handleSendMail = useCallback(() => {
    if (lowStockProducts.length === 0) return
    const lines = lowStockProducts.map((p, i) => {
      const deficit = Math.max(0, p.minStock - p.stock)
      return `${i + 1}. ${p.name}${p.brand ? ` (${p.brand})` : ''} — Stock: ${p.stock} uds. — Mín: ${p.minStock} uds. — Déficit: ${deficit} uds.`
    })
    const subject = encodeURIComponent('Lista de productos por reponer')
    const body = encodeURIComponent(
      `Productos con stock bajo al ${new Date().toLocaleDateString('es-AR')}:\n\n${lines.join('\n')}\n\n---\nGenerado por Control de Stock`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
  }, [lowStockProducts])

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 w-fit">
        <button
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${tab === 'history'
            ? 'bg-primary-dim text-primary-light'
            : 'text-muted hover:text-muted-light'
            }`}
        >
          <History size={14} /> Historial ({purchases.length})
        </button>
        <button
          onClick={() => handleTabChange('reorder')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${tab === 'reorder'
            ? 'bg-primary-dim text-primary-light'
            : 'text-muted hover:text-muted-light'
            }`}
        >
          <AlertTriangle size={14} /> Por Reponer ({lowStockProducts.length})
        </button>
        <button
          onClick={() => handleTabChange('new')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${tab === 'new'
            ? 'bg-primary-dim text-primary-light'
            : 'text-muted hover:text-muted-light'
            }`}
        >
          <Package size={14} /> Nuevo Ingreso
        </button>
      </div>

      {tab === 'reorder' && (
        <Card
          title="Productos por Reponer"
          subtitle={`${lowStockProducts.length} producto${lowStockProducts.length !== 1 ? 's' : ''} con stock bajo`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="surface" size="sm" onClick={handleDownloadCSV} disabled={lowStockProducts.length === 0}>
                <Download size={13} /> CSV
              </Button>
              <Button variant="surface" size="sm" onClick={handleSendMail} disabled={lowStockProducts.length === 0}>
                <Mail size={13} /> Enviar por correo
              </Button>
            </div>
          }
        >
          {lowStockProducts.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted">No hay productos con stock bajo</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">
                      <th className="pb-2 pr-2">Producto</th>
                      <th className="pb-2 pr-2">Stock</th>
                      <th className="pb-2 pr-2">Mínimo</th>
                      <th className="pb-2 pr-2">Déficit</th>
                      <th className="pb-2 pr-2">Categoría</th>
                      <th className="pb-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReorder.map((p) => {
                      const deficit = Math.max(0, p.minStock - p.stock)
                      return (
                        <tr key={p.id} className="border-b border-border/50">
                          <td className="py-2 pr-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-text">{p.name}</p>
                              {p.brand && <p className="text-[10px] text-muted">{p.brand}</p>}
                            </div>
                          </td>
                          <td className="py-2 pr-2 text-muted-light">{p.stock} uds.</td>
                          <td className="py-2 pr-2 text-muted-light">{p.minStock} uds.</td>
                          <td className="py-2 pr-2">
                            <span className="font-semibold text-danger-text">-{deficit} uds.</span>
                          </td>
                          <td className="py-2 pr-2 text-muted">{getCategoryById(p.categoryId)?.name || '—'}</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="surface"
                              size="sm"
                              onClick={() => handleTabChange('new')}
                            >
                              Reponer
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-2 md:hidden">
                {paginatedReorder.map((p) => {
                  const deficit = Math.max(0, p.minStock - p.stock)
                  return (
                    <div key={p.id} className="rounded-lg border border-border bg-surface p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-text">{p.name}</p>
                          {p.brand && <p className="text-[10px] text-muted">{p.brand}</p>}
                        </div>
                        <span className="shrink-0 font-semibold text-danger-text">-{deficit} uds.</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] text-muted">
                          Stock: {p.stock} uds. · Mín: {p.minStock} uds. · {getCategoryById(p.categoryId)?.name || '—'}
                        </span>
                        <Button variant="surface" size="sm" onClick={() => handleTabChange('new')}>
                          Reponer
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {reorderTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setReorderPage(p => Math.max(1, p - 1))}
                    disabled={reorderPage === 1}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted transition-colors hover:bg-primary-dim hover:text-primary-light disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft size={13} /> Anterior
                  </button>
                  {Array.from({ length: reorderTotalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setReorderPage(page)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-medium transition-colors ${
                        page === reorderPage
                          ? 'bg-primary-dim text-primary-light'
                          : 'text-muted hover:bg-primary-dim/50 hover:text-muted-light'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setReorderPage(p => Math.min(reorderTotalPages, p + 1))}
                    disabled={reorderPage === reorderTotalPages}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted transition-colors hover:bg-primary-dim hover:text-primary-light disabled:pointer-events-none disabled:opacity-30"
                  >
                    Siguiente <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </>
          )}
        </Card>
      )}

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
          <Formik
            initialValues={purchaseEntryInitialValues}
            validationSchema={purchaseEntrySchema}
            onSubmit={(values, { resetForm }) => {
              handleAddEntry(values, resetForm)
            }}
          >
            {({ values, setFieldValue }) => (
              <Form>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex-1 min-w-0">
                      {!values.createNewMode ? (
                        <SearchSelect
                          label="Buscar producto existente"
                          options={productOptions}
                          value={selectedProductId}
                          onChange={(val) => { setSelectedProductId(val); setFieldValue('createNewMode', false) }}
                          placeholder="Nombre o código de barras..."
                        />
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="warning">Nuevo producto — se creará al guardar</Badge>
                            <button
                              type="button"
                              onClick={() => setFieldValue('createNewMode', false)}
                              className="text-[11px] text-muted hover:text-danger-text transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field name="newName" label="Nombre *" placeholder="Ej: Lapicera Bic Azul" />
                            <Field name="newBarcode" label="Código de barras" placeholder="Opcional" />
                            <Field name="newBrand" label="Marca" placeholder="Ej: Bic" />
                            <SelectField name="newCategoryId" label="Categoría" placeholder="Seleccionar" options={catOptions} />
                            <Field name="newDescription" label="Descripción" placeholder="Opcional" />
                          </div>
                        </div>
                      )}
                    </div>
                    {!values.createNewMode && (
                      <button
                        type="button"
                        onClick={() => { setFieldValue('createNewMode', true); setSelectedProductId('') }}
                        className="text-left sm:text-right text-[11px] text-primary-light hover:underline whitespace-nowrap shrink-0"
                      >
                        ¿No existe? Crear nuevo
                      </button>
                    )}
                  </div>

                  {/* Producto seleccionado / nuevo: costo + cantidad + agregar */}
                  {(selectedProduct || values.createNewMode) && (
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
                      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:gap-3">
                        <Field
                          name="cost"
                          label="Costo x unidad"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={selectedProduct ? String(selectedProduct.cost) : '0.00'}
                        />
                        <Field
                          name="quantity"
                          label="Cantidad"
                          type="number"
                          min="1"
                        />
                        <Button type="submit" size="sm" className="w-full sm:w-auto sm:mb-[28px]">
                          <Check size={15} /> Agregar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Form>
            )}
          </Formik>

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
      ) : tab === 'history' ? (
        <Card
          title="Historial de Compras"
          subtitle={`${purchases.length} compra${purchases.length !== 1 ? 's' : ''} registradas`}
          actions={
            <div className="flex gap-2">
              <Button variant="surface" size="sm" onClick={() => exportToXLSX(purchases, purchaseExportColumns, 'compras')}>
                <Download size={13} /> XLSX
              </Button>
            </div>
          }
        >
          {loading ? (
            <div className="divide-y divide-border/50 rounded-lg border border-border">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted">
              <Package size={36} className="opacity-40" />
              <p className="text-[13px]">No hay compras registradas todavía</p>
              <button
                onClick={() => handleTabChange('new')}
                className="text-[12px] text-primary-light hover:underline"
              >
                Ir a nuevo ingreso
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedPurchases.map((pch) => (
                <div key={pch.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[13px] font-semibold text-text">Compra #{pch.id.slice(-6).toUpperCase()}</p>
                      <p className="text-[11px] text-muted">
                        {new Date(pch.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                        {pch.date && ` · Comp. ${new Date(+pch.date.slice(0, 4), +pch.date.slice(5, 7) - 1, +pch.date.slice(8, 10)).toLocaleDateString('es-ES')}`}
                      </p>
                      {pch.userEmail && (
                        <p className="text-[10px] text-muted mt-0.5">Registró: {pch.userEmail}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-bold text-accent">{config.currency.symbol}{pch.total.toFixed(2)}</p>
                      {pch.iva > 0 && <p className="text-[10px] text-muted">IVA {config.currency.symbol}{pch.iva.toFixed(2)}</p>}
                      {pch.iibb > 0 && <p className="text-[10px] text-muted">IIBB {config.currency.symbol}{pch.iibb.toFixed(2)}</p>}
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
          <Pagination page={historyPage} totalPages={Math.max(1, Math.ceil(purchases.length / historyPerPage))} onChange={setHistoryPage} totalItems={purchases.length} />
        </Card>
      ) : null}

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
                {new Date(+invoiceDate.slice(0, 4), +invoiceDate.slice(5, 7) - 1, +invoiceDate.slice(8, 10)).toLocaleDateString('es-ES', { dateStyle: 'long' })}
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
            <Button variant="gold" onClick={() => { handleSave(); setPreviewOpen(false) }} disabled={saving}>
              {saving ? 'Guardando...' : 'Confirmar y Guardar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
