import { describe, it, expect, beforeEach } from 'vitest'
import { useSaleStore } from './useSaleStore'
import type { CartItem, Sale } from '../types'

// Helper to build a CartItem
function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'p1',
    productName: 'Product 1',
    productDescription: 'Desc 1',
    quantity: 2,
    unitPrice: 100,
    maxStock: 99,
    ...overrides,
  }
}

// Reset store before each test
beforeEach(() => {
  useSaleStore.setState({ sales: [], cart: [] })
})

describe('addToCart', () => {
  it('adds a new item to the cart', () => {
    useSaleStore.getState().addToCart(cartItem())
    const { cart } = useSaleStore.getState()
    expect(cart).toHaveLength(1)
    expect(cart[0].productId).toBe('p1')
  })

  it('replaces existing item with same productId', () => {
    useSaleStore.getState().addToCart(cartItem())
    useSaleStore.getState().addToCart(cartItem({ quantity: 5 }))
    const { cart } = useSaleStore.getState()
    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(5)
  })

  it('keeps different productIds separate', () => {
    useSaleStore.getState().addToCart(cartItem())
    useSaleStore.getState().addToCart(cartItem({ productId: 'p2', productName: 'Product 2' }))
    const { cart } = useSaleStore.getState()
    expect(cart).toHaveLength(2)
  })
})

describe('updateCartItem', () => {
  it('increments quantity', () => {
    useSaleStore.getState().addToCart(cartItem())
    useSaleStore.getState().updateCartItem('p1', 1)
    expect(useSaleStore.getState().cart[0].quantity).toBe(3)
  })

  it('decrements quantity', () => {
    useSaleStore.getState().addToCart(cartItem())
    useSaleStore.getState().updateCartItem('p1', -1)
    expect(useSaleStore.getState().cart[0].quantity).toBe(1)
  })

  it('removes item when quantity reaches 0', () => {
    useSaleStore.getState().addToCart(cartItem({ quantity: 1 }))
    useSaleStore.getState().updateCartItem('p1', -1)
    expect(useSaleStore.getState().cart).toHaveLength(0)
  })

  it('does not exceed maxStock', () => {
    useSaleStore.getState().addToCart(cartItem({ maxStock: 3 }))
    useSaleStore.getState().updateCartItem('p1', 5)
    expect(useSaleStore.getState().cart[0].quantity).toBe(3)
  })

  it('does nothing for unknown productId', () => {
    useSaleStore.getState().addToCart(cartItem())
    useSaleStore.getState().updateCartItem('unknown', 1)
    expect(useSaleStore.getState().cart).toHaveLength(1)
    expect(useSaleStore.getState().cart[0].quantity).toBe(2)
  })
})

describe('removeFromCart', () => {
  it('removes item by productId', () => {
    useSaleStore.getState().addToCart(cartItem())
    useSaleStore.getState().addToCart(cartItem({ productId: 'p2' }))
    useSaleStore.getState().removeFromCart('p1')
    const { cart } = useSaleStore.getState()
    expect(cart).toHaveLength(1)
    expect(cart[0].productId).toBe('p2')
  })
})

describe('clearCart', () => {
  it('empties the cart', () => {
    useSaleStore.getState().addToCart(cartItem())
    useSaleStore.getState().clearCart()
    expect(useSaleStore.getState().cart).toEqual([])
  })
})

describe('createSale', () => {
  it('creates a sale with correct total', () => {
    useSaleStore.getState().addToCart(cartItem())
    useSaleStore.getState().addToCart(cartItem({ productId: 'p2', unitPrice: 50, quantity: 3 }))

    const sale = useSaleStore.getState().createSale({
      items: useSaleStore.getState().cart.map((c) => ({
        productId: c.productId,
        productName: c.productName,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
      })),
      paymentMethod: 'cash',
    })

    expect(sale).not.toBeNull()
    expect(sale!.total).toBe(350) // 2*100 + 3*50
    expect(sale!.status).toBe('active')
    expect(sale!.paymentMethod).toBe('cash')
    expect(sale!.items).toHaveLength(2)
    expect(sale!.id).toMatch(/^sale-/)
    expect(typeof sale!.createdAt).toBe('number')
  })

  it('returns null when items array is empty', () => {
    const sale = useSaleStore.getState().createSale({ items: [], paymentMethod: 'cash' })
    expect(sale).toBeNull()
  })

  it('adds the sale to the sales array', () => {
    useSaleStore.getState().addToCart(cartItem())
    const items = useSaleStore.getState().cart.map((c) => ({
      productId: c.productId,
      productName: c.productName,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
    }))
    useSaleStore.getState().createSale({ items, paymentMethod: 'card' })
    expect(useSaleStore.getState().sales).toHaveLength(1)
    expect(useSaleStore.getState().sales[0].status).toBe('active')
    expect(useSaleStore.getState().sales[0].paymentMethod).toBe('card')
  })
})

describe('voidSale', () => {
  it('marks a sale as voided', () => {
    const sale = useSaleStore.getState().createSale({
      items: [{ productId: 'p1', productName: 'Test', quantity: 1, unitPrice: 100 }],
      paymentMethod: 'cash',
    })
    useSaleStore.getState().voidSale(sale!.id)
    expect(useSaleStore.getState().sales[0].status).toBe('voided')
  })

  it('does nothing for unknown id', () => {
    useSaleStore.getState().createSale({
      items: [{ productId: 'p1', productName: 'Test', quantity: 1, unitPrice: 100 }],
      paymentMethod: 'cash',
    })
    useSaleStore.getState().voidSale('unknown-id')
    expect(useSaleStore.getState().sales[0].status).toBe('active')
  })
})

describe('getRecentSales', () => {
  it('returns only active sales, limited', () => {
    for (let i = 0; i < 5; i++) {
      useSaleStore.setState((s) => ({
        sales: [
          ...s.sales,
          {
            id: `sale-${i}`,
            items: [],
            total: 100,
            paymentMethod: 'cash' as const,
            status: i === 3 ? ('voided' as const) : ('active' as const),
            createdAt: Date.now() + i,
          } as Sale,
        ],
      }))
    }
    const recent = useSaleStore.getState().getRecentSales(3)
    expect(recent).toHaveLength(3)
    expect(recent.every((s) => s.status === 'active')).toBe(true)
  })
})

describe('getTotalRevenue', () => {
  it('sums only active sales', () => {
    useSaleStore.setState({
      sales: [
        { id: '1', items: [], total: 100, paymentMethod: 'cash', status: 'active', createdAt: 1 } as Sale,
        { id: '2', items: [], total: 200, paymentMethod: 'card', status: 'active', createdAt: 2 } as Sale,
        { id: '3', items: [], total: 300, paymentMethod: 'cash', status: 'voided', createdAt: 3 } as Sale,
      ],
    })
    expect(useSaleStore.getState().getTotalRevenue()).toBe(300)
  })

  it('returns 0 when no sales', () => {
    expect(useSaleStore.getState().getTotalRevenue()).toBe(0)
  })
})

describe('getSalesCount', () => {
  it('counts only active sales', () => {
    useSaleStore.setState({
      sales: [
        { id: '1', items: [], total: 100, paymentMethod: 'cash', status: 'active', createdAt: 1 } as Sale,
        { id: '2', items: [], total: 100, paymentMethod: 'cash', status: 'voided', createdAt: 2 } as Sale,
      ],
    })
    expect(useSaleStore.getState().getSalesCount()).toBe(1)
  })
})

describe('getTodaySales', () => {
  it('returns only sales created today', () => {
    const now = Date.now()
    const yesterday = now - 86400000
    useSaleStore.setState({
      sales: [
        { id: '1', items: [], total: 100, paymentMethod: 'cash', status: 'active', createdAt: now } as Sale,
        { id: '2', items: [], total: 100, paymentMethod: 'cash', status: 'voided', createdAt: yesterday } as Sale,
      ],
    })
    const today = useSaleStore.getState().getTodaySales()
    expect(today).toHaveLength(1)
    expect(today[0].id).toBe('1')
  })
})
