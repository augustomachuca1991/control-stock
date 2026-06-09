import { create } from 'zustand'
import type { Product } from '../types'

interface ProductState {
  products: Product[]
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => void
  deleteProduct: (id: string) => void
  getProductById: (id: string) => Product | undefined
  getLowStockProducts: () => Product[]
  getProductsByCategory: (categoryId: string) => Product[]
  reduceStock: (id: string, quantity: number) => void
  increaseStock: (id: string, quantity: number) => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  addProduct: (product) =>
    set((state) => ({
      products: [
        ...state.products,
        {
          ...product,
          id: `prod-${Date.now()}`,
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    })),
  updateProduct: (id, data) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p
      ),
    })),
  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
  getProductById: (id) => get().products.find((p) => p.id === id),
  getLowStockProducts: () =>
    get().products.filter((p) => p.stock <= p.minStock),
  getProductsByCategory: (categoryId) =>
    get().products.filter((p) => p.categoryId === categoryId),
  reduceStock: (id, quantity) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, stock: p.stock - quantity, updatedAt: Date.now() } : p
      ),
    })),
  increaseStock: (id, quantity) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, stock: p.stock + quantity, updatedAt: Date.now() } : p
      ),
    })),
}))
