import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useCategoryStore } from '../stores/useCategoryStore'
import { useCategories } from '../hooks/useCategories'

interface CategoryForm {
  name: string
  description: string
}

const emptyForm: CategoryForm = { name: '', description: '' }

export function Categories() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const categories = useCategoryStore((s) => s.categories)
  const { add: addCategory, update: updateCategory, delete: deleteCategory } = useCategories()

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((id: string) => {
    const cat = categories.find((c) => c.id === id)
    if (!cat) return
    setEditingId(id)
    setForm({ name: cat.name, description: cat.description })
    setModalOpen(true)
  }, [categories])

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (editingId) {
      await updateCategory(editingId, form)
    } else {
      await addCategory(form)
    }
    setSaving(false)
    setModalOpen(false)
  }, [form, editingId, addCategory, updateCategory])

  return (
    <>
      <Card
        title="Categorías"
        subtitle={`${categories.length} categoría${categories.length !== 1 ? 's' : ''}`}
        actions={
          <Button variant="gold" size="sm" onClick={openCreate}>
            <Plus size={16} /> Nueva
          </Button>
        }
      >
        {categories.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted">
            No hay categorías. Creá la primera.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="truncate text-[13px] font-semibold text-text">{cat.name}</h4>
                    {cat.description && (
                      <p className="mt-0.5 text-[11px] text-muted line-clamp-2">{cat.description}</p>
                    )}
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

      {/* Confirmar eliminación */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar Categoría"
        size="sm"
      >
        <p className="text-[13px] text-muted-light">
          ¿Estás seguro de que querés eliminar <strong className="text-text">{deleteConfirm?.name}</strong>?
          Esta acción es <strong className="text-danger-text">permanente</strong>.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="gold-outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="surface" disabled={saving} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} onClick={async () => { if (deleteConfirm) { setSaving(true); await deleteCategory(deleteConfirm.id); setSaving(false); setDeleteConfirm(null) } }}>
            {saving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Ficción"
          />
          <Input
            label="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descripción breve de la categoría"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="gold-outline" size="md" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="gold" size="md" onClick={handleSave} disabled={!form.name.trim() || saving}>
            {saving ? 'Guardando...' : (editingId ? 'Guardar' : 'Crear')}
          </Button>
        </div>
      </Modal>
    </>
  )
}