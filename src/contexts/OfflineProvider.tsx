import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isOnline, listenOnlineStatus } from '../lib/offline'
import { db } from '../lib/db'
import { supabase } from '../lib/supabaseClient'
import { useProductStore } from '../stores/useProductStore'
import { useSaleStore } from '../stores/useSaleStore'
import { usePurchaseStore } from '../stores/usePurchaseStore'
import { useCategoryStore } from '../stores/useCategoryStore'
import { useInvoiceStore } from '../stores/useInvoiceStore'
import type { Product, Sale, Purchase, Category, Invoice } from '../types'

interface OfflineContextValue {
  isOnline: boolean
}

const OfflineContext = createContext<OfflineContextValue>({ isOnline: true })

export function useOffline() {
  return useContext(OfflineContext)
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    barcode: row.barcode,
    categoryId: row.category_id,
    price: Number(row.price),
    cost: Number(row.cost),
    stock: row.stock,
    minStock: row.min_stock,
    description: row.description,
    images: row.images || [],
    enabled: row.enabled,
    userId: row.user_id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

function mapSale(row: any): Sale {
  return {
    id: row.id,
    items: row.items,
    total: Number(row.total),
    paymentMethod: row.payment_method,
    status: row.status,
    userId: row.user_id,
    createdAt: new Date(row.created_at).getTime(),
  }
}

function mapPurchase(row: any): Purchase {
  return {
    id: row.id,
    items: row.items,
    total: Number(row.total),
    iva: Number(row.iva || 0),
    iibb: Number(row.iibb || 0),
    date: row.date,
    userId: row.user_id,
    userEmail: row.user_email,
    createdAt: new Date(row.created_at).getTime(),
  }
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
  }
}

function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    fileName: row.file_name,
    fileHash: row.file_hash,
    date: row.date,
    total: Number(row.total),
    iva: Number(row.iva || 0),
    iibb: Number(row.iibb || 0),
    items: row.items,
    imageUrl: row.image_url,
    status: row.status,
    userId: row.user_id,
    userEmail: row.user_email,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(isOnline())

  useEffect(() => {
    const cleanup = listenOnlineStatus(setOnline)
    return cleanup
  }, [])

  useEffect(() => {
    if (!online) return

    async function syncAll() {
      try {
        const [
          { data: productsData },
          { data: salesData },
          { data: purchasesData },
          { data: categoriesData },
          { data: invoicesData },
        ] = await Promise.all([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('sales').select('*').order('created_at', { ascending: false }),
          supabase.from('purchases').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('created_at', { ascending: false }),
          supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        ])

        if (productsData) {
          const mapped = productsData.map(mapProduct)
          await db.products.clear()
          await db.products.bulkPut(mapped)
          useProductStore.setState({ products: mapped })
        }
        if (salesData) {
          const mapped = salesData.map(mapSale)
          await db.sales.clear()
          await db.sales.bulkPut(mapped)
          useSaleStore.setState({ sales: mapped })
        }
        if (purchasesData) {
          const mapped = purchasesData.map(mapPurchase)
          await db.purchases.clear()
          await db.purchases.bulkPut(mapped)
          usePurchaseStore.setState({ purchases: mapped })
        }
        if (categoriesData) {
          const mapped = categoriesData.map(mapCategory)
          await db.categories.clear()
          await db.categories.bulkPut(mapped)
          useCategoryStore.setState({ categories: mapped })
        }
        if (invoicesData) {
          const mapped = invoicesData.map(mapInvoice)
          await db.invoices.clear()
          await db.invoices.bulkPut(mapped)
          useInvoiceStore.setState({ invoices: mapped })
        }
      } catch (err) {
        console.error('Sync error:', err)
      }
    }

    syncAll()
  }, [online])

  return (
    <OfflineContext.Provider value={{ isOnline: online }}>
      {children}
    </OfflineContext.Provider>
  )
}
