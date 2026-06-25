import { create } from 'zustand'

export interface ProductFormValues {
  name: string; brand: string; barcode: string; categoryId: string
  price: string; cost: string; stock: string; minStock: string
  description: string; images: string[]; enabled: boolean
}

export const emptyForm: ProductFormValues = {
  name: '', brand: '', barcode: '', categoryId: '',
  price: '', cost: '', stock: '', minStock: '', description: '', images: [],
  enabled: true,
}

interface ProductFormState {
  draft: ProductFormValues | null
  setDraft: (draft: ProductFormValues) => void
  clearDraft: () => void
}

export const useProductFormStore = create<ProductFormState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}))
