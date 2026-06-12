import { useState, useEffect, useRef, useCallback } from 'react'
import { Database, Download, Trash2, Upload, AlertTriangle, Loader2, FileText, Users, Shield, ShieldOff, Ban, CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useBackups } from '../hooks/useBackups'
import { useUsers } from '../hooks/useUsers'
import { Img } from '../components/ui/Img'
import { Select } from '../components/ui/Select'
import { toast } from 'sonner'

type Tab = 'users' | 'backup'

export function Settings() {
  const { backups, loading: backupsLoading, creating, TABLES, STORAGE_BUCKETS, create: createBackup, remove, downloadBackup, restore } = useBackups()
  const { users, roles, loading: usersLoading, updateRole, toggleBlock } = useUsers()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: Tab = (searchParams.get('tab') as Tab) || 'users'
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(true)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null)
  const restoreInputRef = useRef<HTMLInputElement>(null)
  const [editRoleUser, setEditRoleUser] = useState<{ id: string; fullName: string; roleId: string } | null>(null)
  const [blockConfirm, setBlockConfirm] = useState<{ id: string; fullName: string; isBlocked: boolean } | null>(null)
  const [updating, setUpdating] = useState(false)

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

  const getNextBackup = () => {
    const now = new Date()
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 3, 0, 0, 0))
    if (now >= next) next.setUTCDate(next.getUTCDate() + 1)
    return next.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    })
  }

  const lastBackup = backups[0]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 w-fit">
        <button
          onClick={() => setSearchParams({ tab: 'users' })}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${activeTab === 'users' ? 'bg-primary-dim text-primary-light' : 'text-muted hover:text-muted-light'
            }`}
        >
          <Users size={14} /> Usuarios
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'backup' })}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${activeTab === 'backup' ? 'bg-primary-dim text-primary-light' : 'text-muted hover:text-muted-light'
            }`}
        >
          <Database size={14} /> Respaldo y Restauración
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          <Card title="Usuarios del Sistema" subtitle={`${users.length} usuario${users.length !== 1 ? 's' : ''}`}>
            {usersLoading ? (
              <p className="py-4 text-center text-[13px] text-muted">Cargando...</p>
            ) : users.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-muted">No hay usuarios</p>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">
                        <th className="pb-2 pr-2">Usuario</th>
                        <th className="pb-2 pr-2">Email</th>
                        <th className="pb-2 pr-2">Teléfono</th>
                        <th className="pb-2 pr-2">Rol</th>
                        <th className="pb-2 pr-2">Estado</th>
                        <th className="pb-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-border/50">
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              {u.avatarUrl ? (
                                <Img src={u.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" skeleton="rounded-full" />
                              ) : (
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-dim text-[10px] font-bold text-primary-light">
                                  {u.fullName.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                                </span>
                              )}
                              <span className="font-medium text-text">{u.fullName || '—'}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-2 text-muted">{u.email}</td>
                          <td className="py-2 pr-2 text-muted">{u.phone || '—'}</td>
                          <td className="py-2 pr-2">
                            <Badge variant={u.role === 'admin' ? 'info' : 'default'}>{u.role}</Badge>
                          </td>
                          <td className="py-2 pr-2">
                            {u.isBlocked ? (
                              <span className="flex items-center gap-1 text-[11px] text-danger-text">
                                <Ban size={12} /> Bloqueado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] text-success">
                                <CheckCircle2 size={12} /> Activo
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="surface" size="sm" onClick={() => setEditRoleUser({
                                id: u.id,
                                fullName: u.fullName || u.email,
                                roleId: u.roleId,
                              })} title="Cambiar rol">
                                <Shield size={13} className="text-muted-light" />
                              </Button>
                              <Button variant="surface" size="sm" onClick={() => setBlockConfirm({
                                id: u.id,
                                fullName: u.fullName || u.email,
                                isBlocked: u.isBlocked,
                              })} title={u.isBlocked ? 'Desbloquear' : 'Bloquear'}>
                                {u.isBlocked ? (
                                  <ShieldOff size={13} className="text-success" />
                                ) : (
                                  <Ban size={13} className="text-danger-text" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="space-y-2 md:hidden">
                  {users.map((u) => (
                    <div key={u.id} className="rounded-lg border border-border bg-surface p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {u.avatarUrl ? (
                            <Img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" skeleton="rounded-full" />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-dim text-[11px] font-bold text-primary-light">
                              {u.fullName.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-text">{u.fullName || '—'}</p>
                            <p className="truncate text-[11px] text-muted">{u.email}</p>
                          </div>
                        </div>
                        <Badge variant={u.role === 'admin' ? 'info' : 'default'}>{u.role}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
                        <span>{u.phone || '—'}</span>
                        {u.isBlocked && (
                          <span className="flex items-center gap-1 text-danger-text">
                            <Ban size={11} /> Bloqueado
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex gap-1">
                        <Button variant="surface" size="sm" onClick={() => setEditRoleUser({
                          id: u.id,
                          fullName: u.fullName || u.email,
                          roleId: u.roleId,
                        })}>
                          <Shield size={12} className="text-muted-light" /> Rol
                        </Button>
                        <Button variant="surface" size="sm" onClick={() => setBlockConfirm({
                          id: u.id,
                          fullName: u.fullName || u.email,
                          isBlocked: u.isBlocked,
                        })}>
                          {u.isBlocked ? (
                            <><ShieldOff size={12} className="text-success" /> Desbloquear</>
                          ) : (
                            <><Ban size={12} className="text-danger-text" /> Bloquear</>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Modal cambiar rol */}
          <Modal open={!!editRoleUser} onClose={() => setEditRoleUser(null)} title="Cambiar Rol" size="sm">
            {editRoleUser && (
              <div className="space-y-4">
                <p className="text-[13px] text-muted-light">
                  Cambiar rol de <strong className="text-text">{editRoleUser.fullName}</strong>
                </p>
                <Select
                  value={editRoleUser.roleId}
                  onChange={(e) => setEditRoleUser({ ...editRoleUser, roleId: e.target.value })}
                  options={roles.map((r) => ({ value: r.id, label: r.name }))}
                  placeholder="Seleccionar rol"
                />
                <div className="flex justify-end gap-3">
                  <Button variant="gold-outline" onClick={() => setEditRoleUser(null)}>Cancelar</Button>
                  <Button variant="gold" disabled={updating} onClick={async () => {
                    setUpdating(true)
                    const ok = await updateRole(editRoleUser.id, editRoleUser.roleId)
                    setUpdating(false)
                    if (ok) toast.success('Rol actualizado')
                    else toast.error('Error al actualizar rol')
                    setEditRoleUser(null)
                  }}>
                    {updating ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Modal confirmar bloqueo */}
          <Modal open={!!blockConfirm} onClose={() => setBlockConfirm(null)} title={blockConfirm?.isBlocked ? 'Desbloquear Usuario' : 'Bloquear Usuario'} size="sm">
            {blockConfirm && (
              <div className="space-y-4">
                <p className="text-[13px] text-muted-light">
                  {blockConfirm.isBlocked
                    ? `¿Desbloquear a ${blockConfirm.fullName}?`
                    : `¿Bloquear a ${blockConfirm.fullName}? No podrá iniciar sesión.`}
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="gold-outline" onClick={() => setBlockConfirm(null)}>Cancelar</Button>
                  <Button variant="surface" disabled={updating}
                    style={blockConfirm.isBlocked ? {} : { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                    onClick={async () => {
                      setUpdating(true)
                      const ok = await toggleBlock(blockConfirm.id)
                      setUpdating(false)
                      if (ok) toast.success(blockConfirm.isBlocked ? 'Usuario desbloqueado' : 'Usuario bloqueado')
                      else toast.error('Error al cambiar estado')
                      setBlockConfirm(null)
                    }}>
                    {updating ? 'Procesando...' : (blockConfirm.isBlocked ? 'Desbloquear' : 'Bloquear')}
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </>
      )}

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
                <p className="mt-1 text-[13px] font-medium text-text">{getNextBackup()}</p>
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
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-[12px] font-medium text-text truncate">{b.fileName}</p>
                          {b.userEmail === 'system@automated-backup' ? (
                            <Badge variant="info">Automático</Badge>
                          ) : (
                            <Badge variant="default">Manual</Badge>
                          )}
                        </div>
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
