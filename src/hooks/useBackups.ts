import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'
import { useBackupStore } from '../stores/useBackupStore'
import type { Backup } from '../types'

const BUCKET = 'backups'

async function listBucketRecursive(bucket: string, prefix: string): Promise<unknown[]> {
  const all: unknown[] = []
  const { data: entries, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 })
  if (error || !entries) return all

  const files = entries.filter((e) => e.id)
  for (const f of files) {
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(prefix ? `${prefix}/${f.name}` : f.name)
    all.push({
      name: prefix ? `${prefix}/${f.name}` : f.name,
      size: f.metadata?.size ?? 0,
      mimetype: f.metadata?.mimetype ?? '',
      created_at: f.created_at,
      updated_at: f.updated_at,
      public_url: urlData.publicUrl,
    })
  }

  const folders = entries.filter((e) => !e.id)
  for (const folder of folders) {
    const subPrefix = prefix ? `${prefix}/${folder.name}` : folder.name
    const children = await listBucketRecursive(bucket, subPrefix)
    all.push(...children)
  }

  return all
}

type BackupRow = {
  id: string
  file_name: string
  file_path: string
  size_bytes: number
  duration_ms: number
  tables: unknown
  status: string
  user_id: string | null
  user_email: string | null
  created_at: string
}

const mapRow = (row: BackupRow): Backup => ({
  id: row.id,
  fileName: row.file_name,
  filePath: row.file_path,
  sizeBytes: row.size_bytes,
  durationMs: row.duration_ms,
  tables: row.tables as string[],
  status: row.status as 'completed' | 'failed',
  userId: row.user_id ?? undefined,
  userEmail: row.user_email ?? undefined,
  createdAt: new Date(row.created_at).getTime(),
})

const TABLES = ['products', 'categories', 'sales', 'purchases', 'invoices', 'profiles', 'roles', 'user_roles', 'bot_sessions'] as const

const STORAGE_BUCKETS = ['product-images', 'avatars', 'invoice-files', 'backups'] as const

// Orden correcto para respetar FK: categories -> profiles -> products -> sales/purchases/invoices
const RESTORE_ORDER = ['categories', 'profiles', 'products', 'sales', 'purchases', 'invoices']

export function useBackups() {
  const store = useBackupStore()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) {
      toast.error(err.message)
    } else if (data) {
      const mapped = (data as unknown as BackupRow[]).map(mapRow)
      useBackupStore.setState({ backups: mapped })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (selected: string[]) => {
    setCreating(true)
    const start = Date.now()

    try {
      const allSelected = selected.length === 0 ? [...TABLES, ...STORAGE_BUCKETS] : selected
      const tableNames = allSelected.filter((t) => !(STORAGE_BUCKETS as readonly string[]).includes(t))
      const bucketNames = allSelected.filter((t) => (STORAGE_BUCKETS as readonly string[]).includes(t))
      const dump: Record<string, unknown[]> = {}

      for (const table of tableNames) {
        const { data } = await supabase.from(table).select('*')
        dump[table] = data ?? []
      }

      for (const bucket of bucketNames) {
        const entries = await listBucketRecursive(bucket, '')
        dump[`_storage:${bucket}`] = entries
      }

      const { data: user } = await supabase.auth.getUser()
      const userEmail = user?.user?.email ?? ''
      const json = JSON.stringify(dump, null, 2)
      const bytes = new TextEncoder().encode(json).length
      const fileName = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`
      const filePath = `${crypto.randomUUID()}.json`

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, new Blob([json], { type: 'application/json' }))

      if (uploadErr) throw new Error(uploadErr.message)

      const duration = Date.now() - start

      const { error: insertErr } = await supabase.from('backups').insert({
        file_name: fileName,
        file_path: filePath,
        size_bytes: bytes,
        duration_ms: duration,
        tables: allSelected,
        status: 'completed',
        user_email: userEmail,
      })

      if (insertErr) throw new Error(insertErr.message)

      await load()
      toast.success('Respaldo creado correctamente')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear respaldo')
    } finally {
      setCreating(false)
    }
  }, [load])

  const remove = useCallback(async (backup: Backup) => {
    try {
      const { error: storageErr } = await supabase.storage
        .from(BUCKET)
        .remove([backup.filePath])
      if (storageErr) throw new Error(storageErr.message)

      const { error: dbErr } = await supabase
        .from('backups')
        .delete()
        .eq('id', backup.id)
      if (dbErr) throw new Error(dbErr.message)

      useBackupStore.getState().deleteBackup(backup.id)
      toast.success('Respaldo eliminado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar respaldo')
    }
  }, [])

  const downloadBackup = useCallback(async (backup: Backup) => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .download(backup.filePath)
      if (error) throw new Error(error.message)

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Descarga iniciada')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al descargar')
    }
  }, [])

  const restore = useCallback(async (file: File) => {
    try {
      const text = await file.text()
      const dump = JSON.parse(text) as Record<string, unknown[]>

      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      // Restaurar en orden que respeta FK: categories antes que products
      for (const table of RESTORE_ORDER) {
        const allRows = dump[table] as Record<string, unknown>[] | undefined
        if (!allRows || allRows.length === 0) continue

        let rowsToRestore = allRows
        // Perfiles: solo restaurar el del usuario actual para evitar FK conflict con auth.users
        if (table === 'profiles') {
          if (!currentUserId) continue
          rowsToRestore = allRows.filter((r) => r.id === currentUserId)
          if (rowsToRestore.length === 0) continue
        } else {
          // user_id apunta a auth.users — lo removemos para que Supabase use auth.uid()
          rowsToRestore = allRows.map((r) => {
            const { user_id, ...rest } = r
            return rest
          })
        }

        const { error } = await supabase.from(table).upsert(rowsToRestore, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        if (error) throw new Error(`Error al restaurar ${table}: ${error.message}`)
      }

      toast.success('Restauración completada. Recargando datos...')
      // Recargar la página para que todos los hooks refresquen desde Supabase
      setTimeout(() => window.location.reload(), 1500)
      return {}
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al restaurar'
      toast.error(msg)
      return { error: msg }
    }
  }, [])

  return {
    backups: store.backups,
    loading,
    creating,
    TABLES: [...TABLES],
    STORAGE_BUCKETS: [...STORAGE_BUCKETS],
    create,
    remove,
    downloadBackup,
    restore,
    reload: load,
  }
}
