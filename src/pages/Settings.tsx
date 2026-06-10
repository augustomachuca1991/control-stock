import { useState, useEffect, useRef, useCallback } from 'react'
import { Database, Download, Trash2, Upload, AlertTriangle, Loader2, FileText } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useBackups } from '../hooks/useBackups'
import { toast } from 'sonner'

type Tab = 'profile' | 'backup'

export function Settings() {
  const { backups, loading: backupsLoading, creating, TABLES, STORAGE_BUCKETS, create: createBackup, remove, downloadBackup, restore } = useBackups()

  const [activeTab, setActiveTab] = useState<Tab>('backup')
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(true)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null)
  const restoreInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectAll) setSelectedTables([])
  }, [selectAll])

  const toggleTable = (t: string) => {
    setSelectedTables((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
    if (selectAll) setSelectAll(false)
  }

  const handleSelectRestoreFile = useCallback((file: File | null) => {
    if (!file) return
    if (!file.name.endsWith('.json')) {
      toast.error('Solo se permiten archivos .json')
      return
    }
    setSelectedRestoreFile(file)
  }, [])

  const handleConfirmRestore = useCallback(async () => {
    if (!selectedRestoreFile) return
    setRestoring(true)
    await restore(selectedRestoreFile)
    setRestoring(false)
    setSelectedRestoreFile(null)
    setRestoreModalOpen(false)
  }, [selectedRestoreFile, restore])

  const handleCancelRestore = useCallback(() => {
    setSelectedRestoreFile(null)
    setRestoreModalOpen(false)
  }, [])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms} ms`
    return `${(ms / 1000).toFixed(1)} s`
  }

  const lastBackup = backups[0]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
        {/*  <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium transition-colors ${
            activeTab === 'profile' ? 'bg-primary-dim text-primary-light' : 'text-muted hover:text-text'
          }`}
        >
          <User size={15} /> Perfil
        </button> */}
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium transition-colors ${activeTab === 'backup' ? 'bg-primary-dim text-primary-light' : 'text-muted hover:text-text'
            }`}
        >
          <Database size={15} /> Respaldo y Restauración
        </button>
      </div>

      {/* Profile Tab */}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <>
          {/* Estado del Respaldo */}
          <Card title="Estado del Respaldo">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Último Respaldo</p>
                <p className="mt-1 text-[13px] font-medium text-text">
                  {lastBackup ? new Date(lastBackup.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' }) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Tamaño del Respaldo</p>
                <p className="mt-1 text-[13px] font-medium text-text">
                  {lastBackup ? formatSize(lastBackup.sizeBytes) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Próximo Programado</p>
                <p className="mt-1 text-[13px] font-medium text-text">—</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">Total de backups</p>
                <p className="mt-1 text-[13px] font-medium text-text">{backups.length}</p>
              </div>
            </div>
          </Card>

          {/* Categoría de Respaldo */}
          <Card title="Categoría de Respaldo" subtitle="Seleccioná las tablas y archivos a incluir">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={() => setSelectAll(!selectAll)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-[13px] font-medium text-text">Todas las tablas</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TABLES.map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAll || selectedTables.includes(t)}
                      onChange={() => toggleTable(t)}
                      disabled={selectAll}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-[12px] text-muted-light capitalize">{t}</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted mt-3">Archivos (Storage)</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STORAGE_BUCKETS.map((b) => (
                  <label key={b} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAll || selectedTables.includes(b)}
                      onChange={() => toggleTable(b)}
                      disabled={selectAll}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-[12px] text-muted-light">{b}</span>
                  </label>
                ))}
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={() => createBackup(selectedTables)}
                disabled={creating}
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {creating ? 'Creando respaldo...' : 'Crear Respaldo'}
              </Button>
            </div>
          </Card>

          {/* Historial de Respaldos */}
          <Card title="Historial de Respaldos">
            {backupsLoading ? (
              <p className="py-4 text-center text-[13px] text-muted">Cargando...</p>
            ) : backups.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-muted">No hay respaldos todavía</p>
            ) : (
              <div className="space-y-2">
                {backups.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-[7px] w-[7px] rounded-full ${b.status === 'completed' ? 'bg-success' : 'bg-danger-text'}`} title={b.status === 'completed' ? 'Completado' : 'Fallido'} />
                        <p className="text-[12px] font-medium text-text truncate">{b.fileName}</p>
                      </div>
                      <p className="text-[10px] text-muted">
                        {new Date(b.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                        {' · '}{formatSize(b.sizeBytes)}
                        {' · '}{formatDuration(b.durationMs)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => downloadBackup(b)}
                        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-primary-dim hover:text-primary-light"
                        title="Descargar"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => remove(b)}
                        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger-dim hover:text-danger-text"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Restauración */}
          <Card title="Restauración">
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-warning-dim bg-warning-dim/30 p-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning-text" />
                <div className="text-[12px] text-muted">
                  <p className="font-semibold text-warning-text">Advertencia de Restauración</p>
                  <p className="mt-1">
                    Restaurar desde una copia de seguridad reemplazará todos los datos actuales
                    con los del respaldo. Esta acción no se puede deshacer. Creá siempre un
                    respaldo manual antes de restaurar.
                  </p>
                </div>
              </div>
              <Button variant="surface" size="sm" onClick={() => setRestoreModalOpen(true)}>
                <Upload size={14} /> Restaurar desde backup
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Modal Restaurar */}
      <Modal open={restoreModalOpen} onClose={() => { if (!restoring) { setSelectedRestoreFile(null); setRestoreModalOpen(false) } }} size="sm">
        <div className="space-y-5">
          {/* Header */}
          <div className="border-b border-border pb-3">
            <h2 className="text-[18px] font-bold text-text tracking-tight">Restaurar desde backup</h2>
            <p className="mt-1 text-[12px] text-muted">
              Esta acción sobreescribirá los datos existentes con los del archivo seleccionado.
            </p>
          </div>

          {/* Banner de riesgo */}
          <div className="flex items-start gap-3 rounded-lg border border-danger-dim bg-danger-dim/20 p-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger-text" />
            <div className="text-[12px] leading-relaxed text-muted">
              <p className="font-semibold text-danger-text">Atención</p>
              <p className="mt-0.5">
                Los registros existentes serán sobreescritos con los datos del backup. Esta acción{' '}
                <span className="font-semibold text-danger-text">no se puede deshacer</span>.
              </p>
            </div>
          </div>

          {!selectedRestoreFile ? (
            /* File selector */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleSelectRestoreFile(e.dataTransfer.files[0] ?? null) }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 px-6 transition-colors ${dragOver ? 'border-primary bg-primary-dim' : 'border-border hover:border-border-strong'}`}
              onClick={() => restoreInputRef.current?.click()}
            >
              <FileText size={36} className="text-muted-light" />
              <p className="mt-3 text-[14px] font-medium text-text">Seleccioná un archivo <span className="font-mono text-primary-light">.json</span></p>
              <p className="mt-1 text-[11px] text-muted">o arrastralo aquí</p>
              <input
                ref={restoreInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => handleSelectRestoreFile(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            /* File selected — review before restoring */
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-dim">
                    <FileText size={20} className="text-primary-light" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-text truncate">{selectedRestoreFile.name}</p>
                    <p className="text-[11px] text-muted">{formatSize(selectedRestoreFile.size)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRestoreFile(null)}
                  className="text-[11px] text-muted underline transition-colors hover:text-muted-light"
                >
                  Elegir otro archivo
                </button>
                <div className="flex gap-2">
                  <Button variant="surface" onClick={handleCancelRestore} disabled={restoring}>
                    Cancelar
                  </Button>
                  <Button variant="gold" onClick={handleConfirmRestore} disabled={restoring}>
                    {restoring ? (
                      <><Loader2 size={14} className="animate-spin" /> Restaurando...</>
                    ) : (
                      <><Upload size={14} /> Restaurar</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
