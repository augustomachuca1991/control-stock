import { describe, it, expect, beforeEach } from 'vitest'
import { useProductStore } from './useProductStore'
import type { Product } from '../types'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: `prod-${Date.now()}`,
    name: 'Test Product',
    brand: 'Test Brand',
    barcode: '123456789',
    categoryId: '',
    price: 100,
    cost: 50,
    stock: 10,
    minStock: 2,
    description: 'A test product',
    images: [],
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

beforeEach(() => {
  useProductStore.setState({ products: [] })
})

describe('addProduct', () => {
  it('adds a product with id and timestamps', () => {
    useProductStore.getState().addProduct({
      name: 'New',
      brand: 'B',
      barcode: '123',
      categoryId: 'cat1',
      price: 50,
      cost: 25,
      stock: 5,
      minStock: 1,
      description: 'Desc',
      images: [],
      enabled: true,
    })
    const { products } = useProductStore.getState()
    expect(products).toHaveLength(1)
    expect(products[0].name).toBe('New')
    expect(products[0].id).toMatch(/^prod-/)
    expect(typeof products[0].createdAt).toBe('number')
    expect(typeof products[0].updatedAt).toBe('number')
  })
})

describe('updateProduct', () => {
  it('updates fields and updatedAt', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1', name: 'Old Name' })] })
    useProductStore.getState().updateProduct('p1', { name: 'New Name', price: 999 })
    const p = useProductStore.getState().products[0]
    expect(p.name).toBe('New Name')
    expect(p.price).toBe(999)
    expect(p.updatedAt).toBeGreaterThanOrEqual(p.createdAt)
  })

  it('does nothing for unknown id', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1' })] })
    useProductStore.getState().updateProduct('unknown', { name: 'X' })
    expect(useProductStore.getState().products[0].name).not.toBe('X')
  })
})

describe('deleteProduct', () => {
  it('removes product by id', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1' }), makeProduct({ id: 'p2' })] })
    useProductStore.getState().deleteProduct('p1')
    const { products } = useProductStore.getState()
    expect(products).toHaveLength(1)
    expect(products[0].id).toBe('p2')
  })
})

describe('getProductById', () => {
  it('finds product by id', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1', name: 'Target' })] })
    const p = useProductStore.getState().getProductById('p1')
    expect(p).toBeDefined()
    expect(p!.name).toBe('Target')
  })

  it('returns undefined for missing id', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1' })] })
    expect(useProductStore.getState().getProductById('unknown')).toBeUndefined()
  })
})

describe('getLowStockProducts', () => {
  it('returns products where stock <= minStock', () => {
    useProductStore.setState({
      products: [
        makeProduct({ id: 'p1', stock: 1, minStock: 2 }),
        makeProduct({ id: 'p2', stock: 5, minStock: 2 }),
        makeProduct({ id: 'p3', stock: 2, minStock: 2 }),
      ],
    })
    const low = useProductStore.getState().getLowStockProducts()
    expect(low).toHaveLength(2)
    expect(low.map((p) => p.id)).toEqual(['p1', 'p3'])
  })
})

describe('getProductsByCategory', () => {
  it('filters by categoryId', () => {
    useProductStore.setState({
      products: [
        makeProduct({ id: 'p1', categoryId: 'cat-a' }),
        makeProduct({ id: 'p2', categoryId: 'cat-b' }),
        makeProduct({ id: 'p3', categoryId: 'cat-a' }),
      ],
    })
    const filtered = useProductStore.getState().getProductsByCategory('cat-a')
    expect(filtered).toHaveLength(2)
    expect(filtered.map((p) => p.id)).toEqual(['p1', 'p3'])
  })
})

describe('reduceStock', () => {
  it('reduces stock', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1', stock: 10 })] })
    useProductStore.getState().reduceStock('p1', 3)
    expect(useProductStore.getState().products[0].stock).toBe(7)
  })

  it('clamps to 0', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1', stock: 2 })] })
    useProductStore.getState().reduceStock('p1', 10)
    expect(useProductStore.getState().products[0].stock).toBe(0)
  })

  it('disables product when stock reaches 0', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1', stock: 1 })] })
    useProductStore.getState().reduceStock('p1', 1, true)
    expect(useProductStore.getState().products[0].enabled).toBe(false)
  })

  it('does not disable when stock > 0', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1', stock: 5 })] })
    useProductStore.getState().reduceStock('p1', 3)
    expect(useProductStore.getState().products[0].enabled).toBe(true)
  })
})

describe('increaseStock', () => {
  it('increases stock', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1', stock: 5 })] })
    useProductStore.getState().increaseStock('p1', 3)
    expect(useProductStore.getState().products[0].stock).toBe(8)
  })

  it('enables product when going from 0 to >0', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1', stock: 0, enabled: false })] })
    useProductStore.getState().increaseStock('p1', 1, true)
    expect(useProductStore.getState().products[0].enabled).toBe(true)
  })

  it('does not enable when stock was already >0', () => {
    useProductStore.setState({ products: [makeProduct({ id: 'p1', stock: 5, enabled: true })] })
    useProductStore.getState().increaseStock('p1', 1)
    expect(useProductStore.getState().products[0].enabled).toBe(true)
  })
})
