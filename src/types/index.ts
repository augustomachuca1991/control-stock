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
  enabled: boolean
  userId?: string
  createdAt: number
  updatedAt: number
}

export interface SaleItem {
  productId: string
  productName: string
  productDescription?: string
  quantity: number
  unitPrice: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  total: number
  paymentMethod: PaymentMethod
  status: SaleStatus
  userId?: string
  createdAt: number
}

export type PaymentMethod = 'cash' | 'card' | 'transfer'

export type SaleStatus = 'active' | 'voided'

export interface InvoiceItem {
  productName: string
  barcode: string
  quantity: number
  unitCost: number
  isNew: boolean
}

export interface Invoice {
  id: string
  fileName: string
  fileHash: string
  date: string
  total: number
  iva: number
  iibb: number
  items: InvoiceItem[]
  imageUrl?: string
  status: 'processed' | 'failed'
  userId?: string
  userEmail?: string
  createdAt: number
}

export interface Profile {
  id: string
  full_name: string
  phone: string
  avatar_url: string
}

export interface PurchaseItem {
  productId: string
  productName: string
  barcode: string
  quantity: number
  cost: number
}

export interface Purchase {
  id: string
  items: PurchaseItem[]
  total: number
  iva: number
  iibb: number
  date: string
  userId?: string
  userEmail?: string
  createdAt: number
}

export interface Backup {
  id: string
  fileName: string
  filePath: string
  sizeBytes: number
  durationMs: number
  tables: string[]
  status: 'completed' | 'failed'
  userId?: string
  userEmail?: string
  createdAt: number
}

export interface UserItem {
  id: string
  email: string
  fullName: string
  phone: string
  avatarUrl: string
  role: string
  roleId: string
  createdAt: string
  lastSignIn: string | null
  isBlocked: boolean
}
