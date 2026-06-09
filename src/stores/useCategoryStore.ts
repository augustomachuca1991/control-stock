import { create } from 'zustand'
import type { Category } from '../types'

interface CategoryState {
  categories: Category[]
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => void
  deleteCategory: (id: string) => void
  getCategoryById: (id: string) => Category | undefined
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, { ...category, id: `cat-${Date.now()}` }],
    })),
  updateCategory: (id, data) =>
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
  getCategoryById: (id) => get().categories.find((c) => c.id === id),
}))
