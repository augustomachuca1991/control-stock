import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'
import { useProductStore } from '../stores/useProductStore'
import type { Product } from '../types'

const BUCKET = 'product-images'

export function useProducts() {
  const store = useProductStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('products')
      .select('*')
      .order('created_at')
    if (err) {
      setError(err.message)
    } else if (data) {
      const mapped = data.map((p) => ({
        ...p,
        categoryId: p.category_id,
        minStock: p.min_stock,
        enabled: p.enabled ?? true,
        userId: p.user_id ?? undefined,
      })) as unknown as Product[]
      useProductStore.setState({ products: mapped })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error: err } = await supabase
      .from('products')
      .insert({
        name: input.name,
        brand: input.brand,
        barcode: input.barcode,
        category_id: input.categoryId,
        price: input.price,
        cost: input.cost,
        stock: input.stock,
        min_stock: input.minStock,
        description: input.description,
        images: input.images ?? [],
        enabled: input.enabled ?? true,
      })
      .select()
      .single()
    if (err) {
      toast.error(err.message)
      return { error: err.message }
    }
    if (data) {
      useProductStore.setState((state) => ({
        products: [...state.products, data as unknown as Product],
      }))
    }
    return { data }
  }, [])

  const update = useCallback(async (id: string, input: Partial<Omit<Product, 'id' | 'createdAt'>>) => {
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined) payload.name = input.name
    if (input.brand !== undefined) payload.brand = input.brand
    if (input.barcode !== undefined) payload.barcode = input.barcode
    if (input.categoryId !== undefined) payload.category_id = input.categoryId
    if (input.price !== undefined) payload.price = input.price
    if (input.cost !== undefined) payload.cost = input.cost
    if (input.stock !== undefined) payload.stock = input.stock
    if (input.minStock !== undefined) payload.min_stock = input.minStock
    if (input.description !== undefined) payload.description = input.description
    if (input.images !== undefined) payload.images = input.images
    if (input.enabled !== undefined) payload.enabled = input.enabled

    const { error: err } = await supabase.from('products').update(payload).eq('id', id)
    if (err) {
      toast.error(err.message)
      return { error: err.message }
    }
    useProductStore.getState().updateProduct(id, input)
    return {}
  }, [])

  const remove = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('products').delete().eq('id', id)
    if (err) {
      toast.error(err.message)
      return { error: err.message }
    }
    useProductStore.getState().deleteProduct(id)
    return {}
  }, [])

  const uploadImage = useCallback(async (file: File): Promise<{ url?: string; error?: string }> => {
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file)

    if (uploadErr) {
      toast.error(uploadErr.message)
      return { error: uploadErr.message }
    }

    const { data: publicUrl } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path)

    return { url: publicUrl.publicUrl }
  }, [])

  const reduceStock = useCallback(async (id: string, quantity: number) => {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', id)
      .single()
    if (!product) {
      toast.error('Producto no encontrado')
      return { error: 'Product not found' }
    }

    const newStock = product.stock - quantity
    const { error: err } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', id)
    if (err) {
      toast.error(err.message)
      return { error: err.message }
    }
    useProductStore.getState().reduceStock(id, quantity)
    return {}
  }, [])

  const increaseStock = useCallback(async (id: string, quantity: number) => {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', id)
      .single()
    if (!product) {
      toast.error('Producto no encontrado')
      return { error: 'Product not found' }
    }

    const newStock = product.stock + quantity
    const { error: err } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', id)
    if (err) {
      toast.error(err.message)
      return { error: err.message }
    }
    useProductStore.getState().increaseStock(id, quantity)
    return {}
  }, [])

  return {
    products: store.products,
    loading,
    error,
    reload: load,
    add,
    update,
    delete: remove,
    reduceStock,
    increaseStock,
    uploadImage,
  }
}
