import { useState, useMemo, useCallback, useRef } from 'react'
import { Plus, Pencil, Trash2, Search, Barcode, Image as ImageIcon, X, ChevronRight } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { useProductStore } from '../stores/useProductStore'
import { useCategoryStore } from '../stores/useCategoryStore'
import type { Product } from '../types'
import { config } from '../config'

interface ProductForm {
  name: string
  brand: string
  barcode: string
  categoryId: string
  price: string
  cost: string
  stock: string
  minStock: string
  description: string
  images: string[]
}

const emptyForm: ProductForm = {
  name: '', brand: '', barcode: '', categoryId: '',
  price: '', cost: '', stock: '', minStock: '', description: '', images: [],
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
    <img
      src={src}
      alt=""
      className={`rounded-lg object-cover ${className ?? 'h-10 w-10'}`}
      onError={() => setErrored(true)}
    />
  )
}

export function Products() {
  const [search, setSearch] = useState('')
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const barcodeRef = useRef<HTMLInputElement>(null)
  const barcodeSearchRef = useRef<HTMLInputElement>(null)

  const products = useProductStore((s) => s.products)
  const addProduct = useProductStore((s) => s.addProduct)
  const updateProduct = useProductStore((s) => s.updateProduct)
  const deleteProduct = useProductStore((s) => s.deleteProduct)
  const getProductById = useProductStore((s) => s.getProductById)
  const categories = useCategoryStore((s) => s.categories)

  const filtered = useMemo(() => {
    let result = products
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      )
    }
    if (barcodeSearch) result = result.filter((p) => p.barcode.includes(barcodeSearch))
    if (filterCat) result = result.filter((p) => p.categoryId === filterCat)
    return result
  }, [products, search, barcodeSearch, filterCat])

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm)
    setFormModalOpen(true)
    setTimeout(() => barcodeRef.current?.focus(), 100)
  }, [])

  const openEdit = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const p = getProductById(id)
    if (!p) return
    setEditingId(id)
    setForm({
      name: p.name, brand: p.brand, barcode: p.barcode, categoryId: p.categoryId,
      price: String(p.price), cost: String(p.cost), stock: String(p.stock),
      minStock: String(p.minStock), description: p.description, images: p.images ?? [],
    })
    setFormModalOpen(true)
    setTimeout(() => barcodeRef.current?.focus(), 100)
  }, [getProductById])

  const openDetail = useCallback((product: Product) => {
    setSelectedProduct(product)
    setDetailModalOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    const numeric = (v: string) => parseFloat(v) || 0
    const int = (v: string) => parseInt(v, 10) || 0
    const base = {
      name: form.name, brand: form.brand, barcode: form.barcode, categoryId: form.categoryId,
      price: numeric(form.price), cost: numeric(form.cost),
      stock: int(form.stock), minStock: int(form.minStock),
      description: form.description, images: form.images.filter(Boolean),
    }
    if (editingId) updateProduct(editingId, base)
    else addProduct(base)
    setFormModalOpen(false)
  }, [form, editingId, addProduct, updateProduct])

  const handleBarcodeSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (barcodeSearch) {
      const found = products.find((p) => p.barcode === barcodeSearch)
      if (found) { setSearch(found.name); setBarcodeSearch('') }
      barcodeSearchRef.current?.focus()
    }
  }, [barcodeSearch, products])

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteProduct(id)
  }, [deleteProduct])

  const addImageUrl = useCallback(() => setForm((prev) => ({ ...prev, images: [...prev.images, ''] })), [])
  const updateImageUrl = useCallback((index: number, value: string) => {
    setForm((prev) => { const images = [...prev.images]; images[index] = value; return { ...prev, images } })
  }, [])
  const removeImageUrl = useCallback((index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }, [])

  const categoryName = useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name ?? '-',
    [categories]
  )

  const columns = [
    {
      key: 'image', header: '',
      render: (p: Product) => <ProductThumb src={p.images?.[0]} className="h-10 w-10" />,
    },
    {
      key: 'name', header: 'Nombre',
      render: (p: Product) => <span className="font-semibold text-text">{p.name}</span>,
    },
    {
      key: 'brand', header: 'Marca',
      render: (p: Product) => <span className="text-muted-light">{p.brand}</span>,
    },
    {
      key: 'barcode', header: 'Código',
      render: (p: Product) => (
        <code className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted-light">
          {p.barcode}
        </code>
      ),
    },
    {
      key: 'category', header: 'Categoría',
      render: (p: Product) => <Badge variant="default">{categoryName(p.categoryId)}</Badge>,
    },
    {
      key: 'price', header: `Precio (${config.currency.code})`,
      render: (p: Product) => (
        <span className="font-semibold text-accent">{config.currency.symbol}{p.price.toFixed(2)}</span>
      ),
    },
    {
      key: 'stock', header: 'Stock',
      render: (p: Product) => (
        <span className={p.stock <= p.minStock ? 'font-bold text-danger-text' : 'text-text'}>
          {p.stock} uds.
        </span>
      ),
    },
    {
      key: 'actions', header: '',
      render: (p: Product) => (
        <div className="flex justify-end gap-1">
          <Button variant="surface" size="sm" onClick={(e) => openEdit(e, p.id)}>
            <Pencil size={14} className="text-muted-light" />
          </Button>
          <Button variant="surface" size="sm" onClick={(e) => handleDelete(e, p.id)}>
            <Trash2 size={14} className="text-danger-text" />
          </Button>
        </div>
      ),
    },
  ]

  const catOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  return (
    <>
      <Card
        title="Productos"
        subtitle={`${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`}
        actions={
          <Button variant="gold" size="sm" onClick={openCreate}>
            <Plus size={16} /> Nuevo
          </Button>
        }
      >
        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="Buscar por nombre, marca o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={15} className="text-muted" />}
            />
          </div>
          <form onSubmit={handleBarcodeSubmit} className="w-52">
            <Input
              ref={barcodeSearchRef}
              placeholder="Escanear código de barras..."
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
              icon={<Barcode size={15} className="text-muted" />}
            />
          </form>
          <div className="w-44">
            <Select
              options={catOptions}
              placeholder="Todas las categorías"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filtered}
          keyExtractor={(p) => p.id}
          emptyMessage="No se encontraron productos"
          onRowClick={openDetail}
          renderCard={(p) => (
            <div className="flex items-start gap-3">
              <ProductThumb src={p.images?.[0]} className="h-14 w-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-text">{p.name}</p>
                    <p className="text-[11px] text-muted">{p.brand}</p>
                  </div>
                  <ChevronRight size={16} className="mt-1 shrink-0 text-muted" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  <Badge variant="default">{categoryName(p.categoryId)}</Badge>
                  <span className="font-bold text-accent">{config.currency.symbol}{p.price.toFixed(2)}</span>
                  <span className={p.stock <= p.minStock ? 'font-bold text-danger-text' : 'text-muted-light'}>
                    {p.stock} uds.
                  </span>
                </div>
                <code className="mt-1 inline-block rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted">
                  {p.barcode}
                </code>
              </div>
            </div>
          )}
        />
      </Card>

      {/* Modal formulario */}
      <Modal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingId ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <Input label="Marca" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <Input
            ref={barcodeRef}
            label="Código de Barras"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            placeholder="Escanear o escribir..."
          />
          <Select label="Categoría" options={catOptions} placeholder="Seleccionar" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} />
          <Input label={`Precio (${config.currency.code})`} type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input label={`Costo (${config.currency.code})`} type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          <Input label="Stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <Input label="Stock Mínimo" type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />

          {/* Imágenes */}
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted">
                Imágenes (opcional)
              </span>
              <Button variant="gold-outline" size="sm" onClick={addImageUrl}>
                <Plus size={13} /> Agregar URL
              </Button>
            </div>
            {form.images.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input value={url} onChange={(e) => updateImageUrl(i, e.target.value)} placeholder="https://..." />
                </div>
                <ProductThumb src={url} className="h-9 w-9 shrink-0" />
                <Button variant="surface" size="sm" onClick={() => removeImageUrl(i)}>
                  <X size={13} className="text-danger-text" />
                </Button>
              </div>
            ))}
            {form.images.length === 0 && (
              <p className="text-[11px] text-muted">Sin imágenes. Podés agregar URLs más tarde.</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="gold-outline" onClick={() => setFormModalOpen(false)}>Cancelar</Button>
          <Button variant="gold" onClick={handleSave}>
            {editingId ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      </Modal>

      {/* Modal detalle */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detalle del Producto"
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-5">
            {selectedProduct.images && selectedProduct.images.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {selectedProduct.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="h-32 w-32 rounded-lg border border-border object-cover"
                  />
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
                {
                  label: 'Código de Barras',
                  val: <code className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted-light">{selectedProduct.barcode}</code>,
                },
                { label: 'Categoría', val: <Badge variant="default">{categoryName(selectedProduct.categoryId)}</Badge> },
                {
                  label: 'Precio',
                  val: <span className="font-bold text-accent">{config.currency.symbol}{selectedProduct.price.toFixed(2)}</span>,
                },
                {
                  label: 'Costo',
                  val: <span className="text-muted-light">{config.currency.symbol}{selectedProduct.cost.toFixed(2)}</span>,
                },
                {
                  label: 'Stock',
                  val: (
                    <span className={selectedProduct.stock <= selectedProduct.minStock ? 'font-bold text-danger-text' : 'font-semibold text-text'}>
                      {selectedProduct.stock} uds.
                    </span>
                  ),
                },
                { label: 'Stock Mínimo', val: <span className="text-muted-light">{selectedProduct.minStock} uds.</span> },
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
    </>
  )
}
