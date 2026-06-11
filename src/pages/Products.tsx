import { useState, useMemo, useCallback, useRef } from 'react'
import { Formik, Form } from 'formik'
import { Plus, Pencil, Trash2, Search, Image as ImageIcon, X, ChevronRight, Upload, MessageCircle } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { SkeletonRow } from '../components/ui/Skeleton'
import { Img } from '../components/ui/Img'
import { Field } from '../components/ui/Field'
import { SelectField } from '../components/ui/SelectField'
import { useProductStore } from '../stores/useProductStore'
import { useProducts } from '../hooks/useProducts'
import { useCategoryStore } from '../stores/useCategoryStore'
import { useCategories } from '../hooks/useCategories'
import { productSchema } from '../lib/validation'
import type { Product } from '../types'
import { config } from '../config'
import { useAuth } from '../contexts/AuthContext'

interface ProductFormValues {
  name: string; brand: string; barcode: string; categoryId: string
  price: string; cost: string; stock: string; minStock: string
  description: string; images: string[]; enabled: boolean
}

const emptyForm: ProductFormValues = {
  name: '', brand: '', barcode: '', categoryId: '',
  price: '', cost: '', stock: '', minStock: '', description: '', images: [],
  enabled: true,
}

function ProductThumb({ src, className }: { src?: string; className?: string }) {
  const [errored, setErrored] = useState(false)
  if (!src || errored) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-border bg-surface ${className ?? 'h-10 w-10'}`}>
        <ImageIcon size={16} className="text-muted" />
      </div>
    )
  }
  return (
    <Img src={src} alt="" className={`rounded-lg object-cover ${className ?? 'h-10 w-10'}`} skeleton="rounded-lg" onError={() => setErrored(true)} />
  )
}

export function Products() {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)

  useCategories()
  const products = useProductStore((s) => s.products)
  const getProductById = useProductStore((s) => s.getProductById)
  const { uploadImage, add: addProduct, update: updateProduct, delete: deleteProduct, loading: productsLoading } = useProducts()
  const categories = useCategoryStore((s) => s.categories)

  const catOptions = useMemo(() => categories.map((c) => ({ value: c.id, label: c.name })), [categories])

  const filtered = useMemo(() => {
    let result = products
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.barcode.includes(q))
    }
    if (filterCat) result = result.filter((p) => p.categoryId === filterCat)
    return result
  }, [products, search, filterCat])

  const openCreate = useCallback(() => {
    setEditingId(null)
    setFormModalOpen(true)
    setTimeout(() => barcodeRef.current?.focus(), 100)
  }, [])

  const openEdit = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const p = getProductById(id)
    if (!p) return
    setEditingId(id)
    setFormModalOpen(true)
    setTimeout(() => barcodeRef.current?.focus(), 100)
  }, [getProductById])

  const openDetail = useCallback((product: Product) => {
    setSelectedProduct(product)
    setDetailModalOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    await deleteProduct(deleteConfirm.id)
    setDeleting(false)
    setDeleteConfirm(null)
  }, [deleteConfirm, deleteProduct])

  const categoryName = useCallback((id: string) => categories.find((c) => c.id === id)?.name ?? '-', [categories])

  const columns = [
    { key: 'image', header: '', render: (p: Product) => <ProductThumb src={p.images?.[0]} className={`h-10 w-10 ${p.stock === 0 ? 'opacity-50' : ''}`} /> },
    { key: 'name', header: 'Nombre', render: (p: Product) => <span className={`font-semibold ${p.stock === 0 ? 'line-through text-muted' : 'text-text'}`}>{p.name}</span> },
    { key: 'brand', header: 'Marca', render: (p: Product) => <span className={p.stock === 0 ? 'line-through text-muted' : 'text-muted-light'}>{p.brand}</span> },
    { key: 'enabled', header: 'Estado', render: (p: Product) => p.enabled ? <Badge variant="success">Activo</Badge> : <Badge variant="danger">Inactivo</Badge> },
    {
      key: 'category', header: 'Categoría',
      render: (p: Product) => <Badge variant="default">{categoryName(p.categoryId)}</Badge>,
    },
    {
      key: 'price', header: `Precio (${config.currency.code})`,
      render: (p: Product) => <span className={`font-semibold ${p.stock === 0 ? 'line-through text-muted' : 'text-accent'}`}>{config.currency.symbol}{p.price.toFixed(2)}</span>,
    },
    {
      key: 'stock', header: 'Stock',
      render: (p: Product) => (
        <span className={p.stock <= p.minStock && p.stock > 0 ? 'font-bold text-danger-text' : p.stock === 0 ? 'line-through text-muted' : 'text-text'}>{p.stock} uds.</span>
      ),
    },
    {
      key: 'actions', header: '',
      render: (p: Product) => (
        <div className="flex justify-end gap-1">
          <Button variant="surface" size="sm" onClick={(e) => openEdit(e, p.id)}>
            <Pencil size={14} className="text-muted-light" />
          </Button>
          {isAdmin && (
            <Button variant="surface" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p) }}>
              <Trash2 size={14} className="text-danger-text" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <Card
        title="Productos"
        subtitle={`${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`}
        actions={<div className="flex gap-2">
          <a href="https://t.me/marely_productos_bot" target="_blank" rel="noopener noreferrer">
            <Button variant="surface" size="sm"><MessageCircle size={16} /> Alta por IA</Button>
          </a>
          <Button variant="gold" size="sm" onClick={openCreate}><Plus size={16} /> Nuevo</Button>
        </div>}
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="Buscar por nombre, marca o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={15} className="text-muted" />}
            />
          </div>
          <div className="w-44">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="h-9 w-full appearance-none rounded-lg border border-border bg-surface px-3 text-[13px] text-text transition-colors focus:border-border-strong focus:outline-none"
            >
              <option value="">Todas las categorías</option>
              {catOptions.map((o) => <option key={o.value} value={o.value} className="bg-card text-text">{o.label}</option>)}
            </select>
          </div>
        </div>

        {productsLoading ? (
          <div className="divide-y divide-border/50 rounded-lg border border-border">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : (
        <Table
          columns={columns}
          data={filtered}
          keyExtractor={(p) => p.id}
          emptyMessage="No se encontraron productos"
          onRowClick={openDetail}
          renderCard={(p) => (
            <div className={`flex items-start gap-3 ${p.stock === 0 ? 'opacity-60' : ''}`}>
              <ProductThumb src={p.images?.[0]} className="h-14 w-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`font-semibold ${p.stock === 0 ? 'line-through text-muted' : 'text-text'}`}>{p.name}</p>
                    <p className={`text-[11px] ${p.stock === 0 ? 'line-through text-muted' : 'text-muted'}`}>{p.brand}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="surface" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(e, p.id) }}>
                      <Pencil size={13} className="text-muted-light" />
                    </Button>
                    {isAdmin && (
                      <Button variant="surface" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p) }}>
                        <Trash2 size={13} className="text-danger-text" />
                      </Button>
                    )}
                    <ChevronRight size={16} className="mt-0.5 text-muted" />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  {!p.enabled && <Badge variant="danger">Deshabilitado</Badge>}
                  <Badge variant="default">{categoryName(p.categoryId)}</Badge>
                  <span className={`font-bold ${p.stock === 0 ? 'line-through text-muted' : 'text-accent'}`}>{config.currency.symbol}{p.price.toFixed(2)}</span>
                  <span className={p.stock <= p.minStock && p.stock > 0 ? 'font-bold text-danger-text' : p.stock === 0 ? 'line-through text-muted' : 'text-muted-light'}>{p.stock} uds.</span>
                </div>
                <code className={`mt-1 inline-block rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] ${p.stock === 0 ? 'line-through text-muted' : 'text-muted'}`}>{p.barcode}</code>
              </div>
            </div>
          )}
        />
        )}
      </Card>

      {/* Modal formulario */}
      <Modal open={formModalOpen} onClose={() => setFormModalOpen(false)} title={editingId ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <Formik
          initialValues={editingId ? (() => {
            const p = getProductById(editingId)
            return p ? {
              name: p.name, brand: p.brand, barcode: p.barcode, categoryId: p.categoryId,
              price: String(p.price), cost: String(p.cost), stock: String(p.stock),
              minStock: String(p.minStock), description: p.description, images: p.images ?? [],
              enabled: p.enabled ?? true,
            } : emptyForm
          })() : emptyForm}
          validationSchema={productSchema}
          enableReinitialize
          onSubmit={async (values, { setSubmitting }) => {
            const numeric = (v: string) => parseFloat(v) || 0
            const int = (v: string) => parseInt(v, 10) || 0
            const base = {
              name: values.name, brand: values.brand, barcode: values.barcode, categoryId: values.categoryId,
              price: numeric(values.price), cost: numeric(values.cost),
              stock: int(values.stock), minStock: int(values.minStock),
              description: values.description, images: values.images.filter(Boolean),
              enabled: values.enabled,
            }
            if (editingId) await updateProduct(editingId, base)
            else await addProduct(base)
            setSubmitting(false)
            setFormModalOpen(false)
          }}
        >
          {({ values, setFieldValue, isSubmitting, resetForm }) => (
            <Form>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field name="name" label="Nombre" />
                </div>
                <Field name="brand" label="Marca" />
                <Field name="barcode" label="Código de Barras" placeholder="Escanear o escribir..." />
                <SelectField name="categoryId" label="Categoría" placeholder="Seleccionar" options={catOptions} />
                <Field name="price" label={`Precio (${config.currency.code})`} type="number" step="0.01" min="0" />
                <Field name="cost" label={`Costo (${config.currency.code})`} type="number" step="0.01" min="0" />
                <Field name="stock" label="Stock" type="number" min="0" />
                <Field name="minStock" label="Stock Mínimo" type="number" min="0" />

                {/* Imágenes */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted">Imágenes (opcional)</span>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const { url } = await uploadImage(file)
                            if (url) setFieldValue('images', [...values.images, url])
                            e.target.value = ''
                          }}
                          className="hidden"
                          id="product-image-upload"
                        />
                        <Button variant="gold-outline" size="sm" type="button" onClick={() => document.getElementById('product-image-upload')?.click()}>
                          <Upload size={13} /> Subir imagen
                        </Button>
                        <Button variant="surface" size="sm" type="button" onClick={() => setFieldValue('images', [...values.images, ''])}>
                          <Plus size={13} /> Agregar URL
                        </Button>
                      </div>
                    </div>
                    {values.images.map((url, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <input
                            value={url}
                            onChange={(e) => {
                              const imgs = [...values.images]; imgs[i] = e.target.value; setFieldValue('images', imgs)
                            }}
                            placeholder="https://..."
                            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] text-text placeholder:text-muted transition-colors focus:border-border-strong focus:outline-none"
                          />
                        </div>
                        <ProductThumb src={url} className="h-9 w-9 shrink-0" />
                        <button
                          type="button"
                          onClick={() => setFieldValue('images', values.images.filter((_, j) => j !== i))}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-danger-text transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    {values.images.length === 0 && <p className="text-[11px] text-muted">Sin imágenes. Podés subir o pegar URLs.</p>}
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setFieldValue('enabled', !values.enabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${values.enabled ? 'bg-success' : 'bg-border'}`}>
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${values.enabled ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className="text-[13px] text-text">{values.enabled ? 'Producto habilitado' : 'Producto deshabilitado'}</span>
                </div>

                <div className="sm:col-span-2">
                  <Field name="description" label="Descripción" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="gold-outline" onClick={() => { resetForm(); setFormModalOpen(false) }}>Cancelar</Button>
                <Button variant="gold" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Crear Producto')}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar Producto" size="sm">
        <p className="text-[13px] text-muted-light">
          ¿Estás seguro de que querés eliminar <strong className="text-text">{deleteConfirm?.name}</strong>?
          Esta acción es <strong className="text-danger-text">permanente</strong>.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="gold-outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="surface" disabled={deleting} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} onClick={confirmDelete}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </Modal>

      {/* Modal detalle */}
      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Detalle del Producto" size="lg">
        {selectedProduct && (
          <div className="space-y-5">
            {selectedProduct.images && selectedProduct.images.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {selectedProduct.images.map((img, i) => (
                  <button key={i} type="button" onClick={() => setPreviewImage(img)} className="cursor-pointer">
                    <Img src={img} alt="" className="h-32 w-32 rounded-lg border border-border object-cover" skeleton="rounded-lg" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-4 py-5">
                <ImageIcon size={28} className="text-muted" />
                <p className="text-[12px] text-muted">Este producto no tiene imágenes cargadas.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
              {[
                { label: 'Nombre', val: <span className="font-semibold text-text">{selectedProduct.name}</span> },
                { label: 'Marca', val: <span className="text-muted-light">{selectedProduct.brand}</span> },
                { label: 'Código de Barras', val: <code className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted-light">{selectedProduct.barcode}</code> },
                { label: 'Categoría', val: <Badge variant="default">{categoryName(selectedProduct.categoryId)}</Badge> },
                { label: 'Precio', val: <span className="font-bold text-accent">{config.currency.symbol}{selectedProduct.price.toFixed(2)}</span> },
                { label: 'Costo', val: <span className="text-muted-light">{config.currency.symbol}{selectedProduct.cost.toFixed(2)}</span> },
                { label: 'Stock', val: <span className={selectedProduct.stock <= selectedProduct.minStock ? 'font-bold text-danger-text' : 'font-semibold text-text'}>{selectedProduct.stock} uds.</span> },
                { label: 'Stock Mínimo', val: <span className="text-muted-light">{selectedProduct.minStock} uds.</span> },
                { label: 'Estado', val: selectedProduct.enabled ? <Badge variant="success">Activo</Badge> : <Badge variant="danger">Inactivo</Badge> },
              ].map(({ label, val }) => (
                <div key={label}>
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">{label}</span>
                  {val}
                </div>
              ))}
            </div>

            {selectedProduct.description && (
              <div>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Descripción</span>
                <p className="text-[13px] text-muted-light">{selectedProduct.description}</p>
              </div>
            )}

            <div className="flex gap-4 border-t border-border pt-3 text-[11px] text-muted">
              <span>Creado: {new Date(selectedProduct.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
              <span>Actualizado: {new Date(selectedProduct.updatedAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal imagen ampliada */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          >
            <X size={20} />
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
    </>
  )
}
