import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'
import { usePurchaseStore } from '../stores/usePurchaseStore'
import type { PurchaseItem } from '../types'

type PurchaseRow = {
  id: string
  items: unknown
  total: number
  iva: number
  iibb: number
  date: string
  user_id: string | null
  user_email: string | null
  created_at: string
}

export function usePurchases() {
  const store = usePurchaseStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
    } else if (data) {
      const mapped = (data as unknown as PurchaseRow[]).map((p) => ({
        id: p.id,
        items: p.items as PurchaseItem[],
        total: Number(p.total),
        iva: Number(p.iva),
        iibb: Number(p.iibb),
        date: p.date,
        userId: p.user_id ?? undefined,
        userEmail: p.user_email ?? undefined,
        createdAt: new Date(p.created_at).getTime(),
      }))
      usePurchaseStore.setState({ purchases: mapped })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (input: { items: PurchaseItem[]; total: number; iva?: number; iibb?: number; date: string }) => {
    const { data: user } = await supabase.auth.getUser()
    const userEmail = user?.user?.email ?? ''

    const { data, error: err } = await supabase
      .from('purchases')
      .insert({
        items: input.items as unknown as Record<string, unknown>,
        total: input.total,
        iva: input.iva ?? 0,
        iibb: input.iibb ?? 0,
        date: input.date,
        user_email: userEmail,
      })
      .select()
      .single()
    if (err) {
      toast.error(err.message)
      return { error: err.message }
    }
    if (data) {
      const row = data as unknown as PurchaseRow
      usePurchaseStore.setState((state) => ({
        purchases: [
          {
            id: row.id,
            items: row.items as PurchaseItem[],
            total: Number(row.total),
            iva: Number(row.iva),
            iibb: Number(row.iibb),
            date: row.date,
            userId: row.user_id ?? undefined,
            userEmail: row.user_email ?? undefined,
            createdAt: new Date(row.created_at).getTime(),
          },
          ...state.purchases,
        ],
      }))
      return { data }
    }
    return {}
  }, [])

  return {
    purchases: store.purchases,
    loading,
    error,
    reload: load,
    add,
  }
}
