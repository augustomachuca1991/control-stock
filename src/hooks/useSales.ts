import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'
import { isOnline } from '../lib/offline'
import { db } from '../lib/db'
import { useSaleStore } from '../stores/useSaleStore'
import type { Sale, SaleItem, PaymentMethod } from '../types'

export function useSales() {
  const store = useSaleStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    if (!isOnline()) {
      const cached = await db.sales.toArray()
      if (cached.length > 0) {
        useSaleStore.setState({ sales: cached })
        setLoading(false)
        return
      }
    }
    const { data, error: err } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
    } else if (data) {
      const mapped = data.map((s) => ({
        id: s.id,
        items: s.items as SaleItem[],
        total: Number(s.total),
        paymentMethod: s.payment_method as PaymentMethod,
        status: s.status as 'active' | 'voided',
        userId: s.user_id ?? undefined,
        createdAt: new Date(s.created_at).getTime(),
      }))
      useSaleStore.setState({ sales: mapped })
      if (isOnline()) {
        await db.sales.clear()
        await db.sales.bulkPut(mapped)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (input: { items: SaleItem[]; paymentMethod: PaymentMethod }) => {
    const total = input.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

    const { data, error: err } = await supabase
      .from('sales')
      .insert({
        items: input.items as unknown as Record<string, unknown>,
        total,
        payment_method: input.paymentMethod,
        status: 'active',
      })
      .select()
      .single()
    if (err) {
      toast.error(err.message)
      return { error: err.message }
    }
    if (data) {
      const sale: Sale = {
        id: data.id,
        items: data.items as unknown as SaleItem[],
        total: Number(data.total),
        paymentMethod: data.payment_method as PaymentMethod,
        status: 'active',
        createdAt: new Date(data.created_at).getTime(),
      }
      useSaleStore.setState((state) => ({
        sales: [sale, ...state.sales],
      }))
      return { data: sale }
    }
    return {}
  }, [])

  const voidSale = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('sales')
      .update({ status: 'voided' })
      .eq('id', id)
    if (err) {
      toast.error(err.message)
      return { error: err.message }
    }
    useSaleStore.getState().voidSale(id)
    return {}
  }, [])

  return {
    sales: store.sales,
    loading,
    error,
    reload: load,
    create,
    voidSale,
  }
}
