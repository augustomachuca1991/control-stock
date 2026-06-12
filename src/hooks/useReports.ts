import { useMemo } from 'react'
import { useSaleStore } from '../stores/useSaleStore'
import { useProductStore } from '../stores/useProductStore'
import { useCategoryStore } from '../stores/useCategoryStore'
import type { PaymentMethod } from '../types'

export interface SalesByPeriod {
  label: string
  total: number
  count: number
}

export interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

export interface PaymentDistribution {
  method: PaymentMethod
  total: number
  count: number
}

export interface CategoryStock {
  name: string
  count: number
  totalValue: number
}

export interface DailySalesPoint {
  date: string
  total: number
  count: number
}

export interface RevenueData {
  date: string
  income: number
  cost: number
  profit: number
}

export interface ReportData {
  todayRevenue: number
  todaySales: number
  monthRevenue: number
  monthSales: number
  prevMonthRevenue: number
  revenueChange: number
  totalProducts: number
  lowStockCount: number
  allTimeRevenue: number
  allTimeSales: number
}

export function useReports() {
  const sales = useSaleStore((s) => s.sales)
  const products = useProductStore((s) => s.products)
  const categories = useCategoryStore((s) => s.categories)

  const activeSales = useMemo(() => sales.filter((s) => s.status === 'active'), [sales])

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()

  const reportData: ReportData = useMemo(() => {
    const todaySales = activeSales.filter((s) => s.createdAt >= todayStart)
    const monthSales = activeSales.filter((s) => s.createdAt >= monthStart)
    const prevMonthSales = activeSales.filter((s) => s.createdAt >= prevMonthStart && s.createdAt < monthStart)

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0)
    const prevMonthRevenue = prevMonthSales.reduce((sum, s) => sum + s.total, 0)
    const revenueChange = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0

    return {
      todayRevenue,
      todaySales: todaySales.length,
      monthRevenue,
      monthSales: monthSales.length,
      prevMonthRevenue,
      revenueChange,
      totalProducts: products.length,
      lowStockCount: products.filter((p) => p.stock <= p.minStock).length,
      allTimeRevenue: activeSales.reduce((sum, s) => sum + s.total, 0),
      allTimeSales: activeSales.length,
    }
  }, [activeSales, products, todayStart, monthStart, prevMonthStart])

  const salesByPeriod = useMemo((): SalesByPeriod[] => {
    const days = 14
    const groups: Record<string, { total: number; count: number }> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      groups[key] = { total: 0, count: 0 }
    }
    activeSales.forEach((s) => {
      const d = new Date(s.createdAt)
      if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)) {
        const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        if (groups[key]) {
          groups[key].total += s.total
          groups[key].count++
        }
      }
    })
    return Object.entries(groups).map(([label, data]) => ({ label, ...data }))
  }, [activeSales, now])

  const topProducts = useMemo((): TopProduct[] => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>()
    activeSales.forEach((s) => {
      s.items.forEach((item) => {
        const existing = map.get(item.productId)
        if (existing) {
          existing.quantity += item.quantity
          existing.revenue += item.quantity * item.unitPrice
        } else {
          map.set(item.productId, {
            name: item.productName,
            quantity: item.quantity,
            revenue: item.quantity * item.unitPrice,
          })
        }
      })
    })
    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  }, [activeSales])

  const paymentDistribution = useMemo((): PaymentDistribution[] => {
    const map = new Map<PaymentMethod, { total: number; count: number }>()
    activeSales.forEach((s) => {
      const existing = map.get(s.paymentMethod) || { total: 0, count: 0 }
      existing.total += s.total
      existing.count++
      map.set(s.paymentMethod, existing)
    })
    return Array.from(map.entries()).map(([method, data]) => ({ method, ...data }))
  }, [activeSales])

  const categoryStock = useMemo((): CategoryStock[] => {
    const map = new Map<string, { count: number; totalValue: number }>()
    products.forEach((p) => {
      const catId = p.categoryId || 'sin-categoria'
      const existing = map.get(catId) || { count: 0, totalValue: 0 }
      existing.count++
      existing.totalValue += p.price * p.stock
      map.set(catId, existing)
    })
    return Array.from(map.entries()).map(([catId, data]) => ({
      name: categories.find((c) => c.id === catId)?.name || 'Sin categoría',
      ...data,
    }))
  }, [products, categories])

  const revenueData = useMemo((): RevenueData[] => {
    const days = 14
    const groups: Record<string, { income: number; cost: number }> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      groups[key] = { income: 0, cost: 0 }
    }
    activeSales.forEach((s) => {
      const d = new Date(s.createdAt)
      if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)) {
        const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        if (groups[key]) {
          groups[key].income += s.total
          s.items.forEach((item) => {
            const product = products.find((p) => p.id === item.productId)
            if (product) groups[key].cost += item.quantity * product.cost
          })
        }
      }
    })
    return Object.entries(groups).map(([date, data]) => ({
      date,
      ...data,
      profit: data.income - data.cost,
    }))
  }, [activeSales, products, now])

  return {
    reportData,
    salesByPeriod,
    topProducts,
    paymentDistribution,
    categoryStock,
    revenueData,
  }
}
