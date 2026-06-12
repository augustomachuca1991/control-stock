import Dexie, { type Table } from 'dexie'
import type { Product, Sale, Purchase, Category, Invoice, Profile } from '../types'

export class MarelyDB extends Dexie {
  products!: Table<Product, string>
  sales!: Table<Sale, string>
  purchases!: Table<Purchase, string>
  categories!: Table<Category, string>
  invoices!: Table<Invoice, string>
  profiles!: Table<Profile, string>

  constructor() {
    super('marely')
    this.version(1).stores({
      products: 'id, name, barcode, categoryId, enabled',
      sales: 'id, createdAt',
      purchases: 'id, createdAt',
      categories: 'id, name',
      invoices: 'id, createdAt',
      profiles: 'id',
    })
  }
}

export const db = new MarelyDB()
