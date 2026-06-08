import { create } from 'zustand'
import type { Sale, SaleItem, PaymentMethod } from '../types'
import { sales as initialSales } from '../data/mockData'

interface CreateSalePayload {
  items: SaleItem[]
  paymentMethod: PaymentMethod
}

interface SaleState {
  sales: Sale[]
  createSale: (payload: CreateSalePayload) => Sale | null
  getRecentSales: (limit?: number) => Sale[]
  getTotalRevenue: () => number
  getSalesCount: () => number
  getTodaySales: () => Sale[]
}

export const useSaleStore = create<SaleState>((set, get) => ({
  sales: initialSales,
  createSale: (payload) => {
    if (payload.items.length === 0) return null
    const total = payload.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const sale: Sale = {
      id: `sale-${Date.now()}`,
      items: payload.items,
      total,
      paymentMethod: payload.paymentMethod,
      createdAt: Date.now(),
    }
    set((state) => ({ sales: [sale, ...state.sales] }))
    return sale
  },
  getRecentSales: (limit = 5) => get().sales.slice(0, limit),
  getTotalRevenue: () =>
    get().sales.reduce((sum, s) => sum + s.total, 0),
  getSalesCount: () => get().sales.length,
  getTodaySales: () => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return get().sales.filter((s) => s.createdAt >= todayStart.getTime())
  },
}))
