export interface Category {
  id: string
  name: string
  description: string
}

export interface Product {
  id: string
  name: string
  brand: string
  barcode: string
  categoryId: string
  price: number
  cost: number
  stock: number
  minStock: number
  description: string
  images?: string[]
  createdAt: number
  updatedAt: number
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  total: number
  paymentMethod: PaymentMethod
  createdAt: number
}

export type PaymentMethod = 'cash' | 'card' | 'transfer'
