import { create } from 'zustand'
import type { Purchase, PurchaseItem } from '../types'

interface PurchaseState {
  purchases: Purchase[]
  addPurchase: (data: { items: PurchaseItem[]; total: number; iva?: number; iibb?: number; date: string }) => void
}

export const usePurchaseStore = create<PurchaseState>((set) => ({
  purchases: [],
  addPurchase: (data) => {
    const purchase: Purchase = {
      id: `pch-${Date.now()}`,
      items: data.items,
      total: data.total,
      iva: data.iva ?? 0,
      iibb: data.iibb ?? 0,
      date: data.date,
      createdAt: Date.now(),
    }
    set((state) => ({ purchases: [purchase, ...state.purchases] }))
  },
}))
