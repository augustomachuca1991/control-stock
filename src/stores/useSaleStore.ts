import { create } from 'zustand'
import type { Sale, SaleItem, PaymentMethod } from '../types'

export interface CartItem {
  productId: string
  productName: string
  productDescription: string
  quantity: number
  unitPrice: number
  maxStock: number
}

interface CreateSalePayload {
  items: SaleItem[]
  paymentMethod: PaymentMethod
  discountPercent?: number
}

interface SaleState {
  sales: Sale[]
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  updateCartItem: (productId: string, delta: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  createSale: (payload: CreateSalePayload) => Sale | null
  voidSale: (id: string) => void
  getRecentSales: (limit?: number) => Sale[]
  getTotalRevenue: () => number
  getSalesCount: () => number
  getTodaySales: () => Sale[]
}

export const useSaleStore = create<SaleState>((set, get) => ({
  sales: [],
  cart: [],
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find((c) => c.productId === item.productId)
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.productId === item.productId ? item : c
          ),
        }
      }
      return { cart: [...state.cart, item] }
    }),
  updateCartItem: (productId, delta) =>
    set((state) => ({
      cart: state.cart
        .map((c) => {
          if (c.productId !== productId) return c
          const next = c.quantity + delta
          if (next <= 0) return null
          return { ...c, quantity: Math.min(next, c.maxStock) }
        })
        .filter(Boolean) as CartItem[],
    })),
  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((c) => c.productId !== productId),
    })),
  clearCart: () => set({ cart: [] }),
  createSale: (payload) => {
    if (payload.items.length === 0) return null
    const subtotal = payload.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const discountPct = payload.discountPercent ?? 0
    const total = subtotal - subtotal * discountPct / 100
    const sale: Sale = {
      id: `sale-${Date.now()}`,
      items: payload.items,
      total,
      discountPercent: discountPct || undefined,
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
