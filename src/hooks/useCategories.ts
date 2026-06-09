import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCategoryStore } from '../stores/useCategoryStore'
import type { Category } from '../types'

export function useCategories() {
  const store = useCategoryStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('categories')
      .select('*')
      .order('created_at')
    if (err) {
      setError(err.message)
    } else if (data) {
      useCategoryStore.setState({ categories: data })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (input: Omit<Category, 'id'>) => {
    const { data, error: err } = await supabase
      .from('categories')
      .insert({ name: input.name, description: input.description })
      .select()
      .single()
    if (err) return { error: err.message }
    if (data) {
      useCategoryStore.setState((state) => ({
        categories: [...state.categories, data],
      }))
    }
    return { data }
  }, [])

  const update = useCallback(async (id: string, input: Partial<Omit<Category, 'id'>>) => {
    const { error: err } = await supabase
      .from('categories')
      .update(input)
      .eq('id', id)
    if (err) return { error: err.message }
    useCategoryStore.getState().updateCategory(id, input)
    return {}
  }, [])

  const remove = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    if (err) return { error: err.message }
    useCategoryStore.getState().deleteCategory(id)
    return {}
  }, [])

  return {
    categories: store.categories,
    loading,
    error,
    reload: load,
    add,
    update,
    delete: remove,
  }
}
