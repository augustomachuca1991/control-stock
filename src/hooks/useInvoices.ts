import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'
import { useInvoiceStore } from '../stores/useInvoiceStore'
import type { Invoice, InvoiceItem } from '../types'

type InvoiceRow = {
  id: string
  file_name: string
  date: string
  total: number
  items: unknown
  image_url: string | null
  status: string
  user_id: string | null
  created_at: string
}

const mapRow = (row: InvoiceRow): Invoice => ({
  id: row.id,
  fileName: row.file_name,
  date: row.date,
  total: Number(row.total),
  items: row.items as InvoiceItem[],
  imageUrl: row.image_url ?? undefined,
  status: row.status as 'processed' | 'failed',
  userId: row.user_id ?? undefined,
  createdAt: new Date(row.created_at).getTime(),
})

export function useInvoices() {
  const store = useInvoiceStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
    } else if (data) {
      const mapped = (data as unknown as InvoiceRow[]).map(mapRow)
      useInvoiceStore.setState({ invoices: mapped })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (input: {
    fileName: string
    date: string
    total: number
    items: InvoiceItem[]
    imageUrl?: string
    status?: 'processed' | 'failed'
  }) => {
    const { data, error: err } = await supabase
      .from('invoices')
      .insert({
        file_name: input.fileName,
        date: input.date,
        total: input.total,
        items: input.items as unknown as Record<string, unknown>,
        image_url: input.imageUrl ?? '',
        status: input.status ?? 'processed',
      })
      .select()
      .single()
    if (err) {
      toast.error(err.message)
      return { error: err.message }
    }
    if (data) {
      const invoice = mapRow(data as unknown as InvoiceRow)
      useInvoiceStore.getState().addInvoice(invoice)
      return { data: invoice }
    }
    return {}
  }, [])

  return {
    invoices: store.invoices,
    loading,
    error,
    reload: load,
    add,
  }
}
