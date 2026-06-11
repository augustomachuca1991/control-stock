import { useState, useCallback } from 'react'
import { Formik, Form } from 'formik'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { SkeletonCard } from '../components/ui/Skeleton'
import { Field } from '../components/ui/Field'
import { useCategoryStore } from '../stores/useCategoryStore'
import { useCategories } from '../hooks/useCategories'
import { categorySchema } from '../lib/validation'

export function Categories() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const categories = useCategoryStore((s) => s.categories)
  const { add: addCategory, update: updateCategory, delete: deleteCategory, loading } = useCategories()

  const openCreate = useCallback(() => {
    setEditingId(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((id: string) => {
    const cat = categories.find((c) => c.id === id)
    if (!cat) return
    setEditingId(id)
    setModalOpen(true)
  }, [categories])

  return (
    <>
      <Card
        title="Categorías"
        subtitle={`${categories.length} categoría${categories.length !== 1 ? 's' : ''}`}
        actions={<Button variant="gold" size="sm" onClick={openCreate}><Plus size={16} /> Nueva</Button>}
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : categories.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted">No hay categorías. Creá la primera.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat.id} className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="truncate text-[13px] font-semibold text-text">{cat.name}</h4>
                    {cat.description && <p className="mt-0.5 text-[11px] text-muted line-clamp-2">{cat.description}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                    <Button variant="surface" size="sm" onClick={() => openEdit(cat.id)}>
                      <Pencil size={13} />
                    </Button>
                    <Button variant="surface" size="sm" onClick={() => setDeleteConfirm({ id: cat.id, name: cat.name })}>
                      <Trash2 size={13} className="text-danger-text" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal formulario */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Categoría' : 'Nueva Categoría'}>
        <Formik
          initialValues={editingId ? (() => {
            const cat = categories.find((c) => c.id === editingId)
            return cat ? { name: cat.name, description: cat.description } : { name: '', description: '' }
          })() : { name: '', description: '' }}
          validationSchema={categorySchema}
          enableReinitialize
          onSubmit={async (values, { setSubmitting }) => {
            setSaving(true)
            if (editingId) await updateCategory(editingId, values)
            else await addCategory(values)
            setSaving(false)
            setSubmitting(false)
            setModalOpen(false)
          }}
        >
          {({ isSubmitting, resetForm }) => (
            <Form className="space-y-4">
              <Field name="name" label="Nombre" placeholder="Ej: Ficción" />
              <Field name="description" label="Descripción" placeholder="Descripción breve de la categoría" />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="gold-outline" size="md" type="button" onClick={() => { resetForm(); setModalOpen(false) }}>Cancelar</Button>
                <Button variant="gold" size="md" type="submit" disabled={isSubmitting || saving}>
                  {saving ? 'Guardando...' : (editingId ? 'Guardar' : 'Crear')}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Confirmar eliminación */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar Categoría" size="sm">
        <p className="text-[13px] text-muted-light">
          ¿Estás seguro de que querés eliminar <strong className="text-text">{deleteConfirm?.name}</strong>?
          Esta acción es <strong className="text-danger-text">permanente</strong>.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="gold-outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="surface" disabled={saving} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
            onClick={async () => { if (deleteConfirm) { setSaving(true); await deleteCategory(deleteConfirm.id); setSaving(false); setDeleteConfirm(null) } }}>
            {saving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
