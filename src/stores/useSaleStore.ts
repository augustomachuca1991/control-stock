import { create } from 'zustand'
import type { Sale, SaleItem, PaymentMethod } from '../types'

interface CreateSalePayload {
  items: SaleItem[]
  paymentMethod: PaymentMethod
}

interface SaleState {
  sales: Sale[]
  createSale: (payload: CreateSalePayload) => Sale | null
  voidSale: (id: string) => void
  getRecentSales: (limit?: number) => Sale[]
  getTotalRevenue: () => number
  getSalesCount: () => number
  getTodaySales: () => Sale[]
}

export const useSaleStore = create<SaleState>((set, get) => ({
  sales: [],
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
      status: 'active',
      createdAt: Date.now(),
    }
    set((state) => ({ sales: [sale, ...state.sales] }))
    return sale
  },
  voidSale: (id) =>
    set((state) => ({
      sales: state.sales.map((s) =>
        s.id === id ? { ...s, status: 'voided' as const } : s
      ),
    })),
  getRecentSales: (limit = 5) =>
    get().sales.filter((s) => s.status === 'active').slice(0, limit),
  getTotalRevenue: () =>
    get().sales
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + s.total, 0),
  getSalesCount: () =>
    get().sales.filter((s) => s.status === 'active').length,
  getTodaySales: () => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return get().sales
      .filter((s) => s.status === 'active' && s.createdAt >= todayStart.getTime())
  },
}))
