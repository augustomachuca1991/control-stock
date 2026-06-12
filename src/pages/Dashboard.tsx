import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingCart, DollarSign, AlertTriangle, CheckCircle, Plus, ChevronLeft, ChevronRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { SkeletonCard, SkeletonRow } from '../components/ui/Skeleton'
import { SearchSelect } from '../components/ui/SearchSelect'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useProductStore } from '../stores/useProductStore'
import { useSaleStore } from '../stores/useSaleStore'
import { useCategoryStore } from '../stores/useCategoryStore'
import { useProducts } from '../hooks/useProducts'
import { useSales } from '../hooks/useSales'
import { useCategories } from '../hooks/useCategories'
import type { Sale } from '../types'
import { config } from '../config'
import { toast } from 'sonner'

/* ── Colores de acento por KPI ── */
type AccentColor = 'primary' | 'accent' | 'success' | 'danger'

const accentMap: Record<AccentColor, { bar: string; icon: string; val: string }> = {
  primary: { bar: 'bg-primary', icon: 'bg-primary', val: 'text-text' },
  accent: { bar: 'bg-accent', icon: 'bg-accent', val: 'text-accent' },
  success: { bar: 'bg-success', icon: 'bg-success', val: 'text-text' },
  danger: { bar: 'bg-danger', icon: 'bg-danger', val: 'text-danger-text' },
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp = true,
  accent = 'primary',
}: {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  accent?: AccentColor
}) {
  const a = accentMap[accent]
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-border bg-card p-3">
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${a.bar}`} />
      <div className={`mb-2.5 flex h-7 w-7 items-center justify-center rounded-lg ${a.icon}`}>
        <Icon size={14} color="white" strokeWidth={2} />
      </div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">
        {label}
      </p>
      <p className={`text-[22px] font-bold leading-none ${a.val}`}>{value}</p>
      {trend && (
        <p className={`mt-1.5 text-[10px] ${trendUp ? 'text-success-text' : 'text-danger-text'}`}>
          {trendUp ? '▲' : '▼'} {trend}
        </p>
      )}
    </div>
  )
}

/* ── Barra de stock ── */
function StockBar({ current, min, max }: { current: number; min: number; max: number }) {
  const pct = Math.min(100, Math.round((current / Math.max(max, 1)) * 100))
  const color = current <= min ? 'bg-danger' : current <= min * 1.5 ? 'bg-warning' : 'bg-success'
  return (
    <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/5">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ── Dashboard ── */
export function Dashboard() {
  const { loading: loadingProducts } = useProducts()
  const { loading: loadingSales } = useSales()
  useCategories()
  const loading = loadingProducts || loadingSales

  const products = useProductStore((s) => s.products)
  const lowStock = useMemo(() => products.filter((p) => p.stock <= p.minStock), [products])
  const totalSales = useSaleStore((s) => s.getSalesCount())
  const revenue = useSaleStore((s) => s.getTotalRevenue())
  const sales = useSaleStore((s) => s.sales)
  const getCategoryById = useCategoryStore((s) => s.getCategoryById)
  const cart = useSaleStore((s) => s.cart)
  const addToCartStore = useSaleStore((s) => s.addToCart)
  const getProductById = useProductStore((s) => s.getProductById)

  const [selectedProductId, setSelectedProductId] = useState('')
  const [addQty, setAddQty] = useState('1')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const saleable = useMemo(() => products.filter(p => p.enabled && p.stock > 0), [products])

  const productOptions = useMemo(() =>
    saleable.map(p => ({
      value: p.id,
      label: `${p.name}${p.brand ? ` (${p.brand})` : ''} — ${config.currency.symbol}${p.price.toFixed(2)} · ${p.stock} uds.`,
    })), [saleable])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(saleable.length / itemsPerPage)), [saleable.length])

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return saleable.slice(start, start + itemsPerPage)
  }, [saleable, currentPage])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [totalPages, currentPage])

  const cartProductIds = useMemo(() => new Set(cart.map(c => c.productId)), [cart])

  const addToCart = useCallback((productId: string, qty: number = 1) => {
    const product = getProductById(productId)
    if (!product || qty <= 0) return
    if (product.stock <= 0) {
      toast.error(`${product.name} no tiene stock disponible`)
      return
    }
    const existing = cart.find(c => c.productId === productId)
    const currentCartQty = existing ? existing.quantity : 0
    const available = product.stock - currentCartQty
    if (available <= 0) {
      toast.error(`Stock insuficiente de ${product.name}`)
      return
    }
    const q = Math.min(qty, available)
    addToCartStore({
      productId: product.id,
      productName: product.name,
      quantity: existing ? existing.quantity + q : q,
      unitPrice: product.price,
      maxStock: product.stock,
    })
    toast.success(`${q} × ${product.name} agregado al carrito`)
  }, [getProductById, cart, addToCartStore])

  const handleQuickAdd = useCallback(() => {
    if (!selectedProductId) return
    addToCart(selectedProductId, parseInt(addQty, 10) || 1)
    setSelectedProductId('')
    setAddQty('1')
  }, [selectedProductId, addQty, addToCart])

  const stats = useMemo(() => ({
    totalProducts: products.length,
    totalSales,
    revenue,
    lowStockCount: lowStock.length,
  }), [products.length, totalSales, revenue, lowStock.length])

  const recentSales = useMemo(() => sales.slice(0, 5), [sales])

  const saleColumns = [
    {
      key: 'id',
      header: 'Venta',
      render: (s: Sale) => (
        <span className={`font-mono text-[11px] ${s.status === 'voided' ? 'line-through text-muted' : 'text-primary-light'}`}>#{s.id.slice(-4)}</span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (s: Sale) => (
        <span className={s.status === 'voided' ? 'line-through text-muted' : 'text-muted-light'}>{s.items.length} producto{s.items.length !== 1 ? 's' : ''}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (s: Sale) => (
        <span className={`font-bold ${s.status === 'voided' ? 'line-through text-muted' : 'text-accent'}`}>
          {config.currency.symbol}{s.total.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'payment',
      header: 'Método',
      render: (s: Sale) => {
        const map = {
          cash: { label: 'Efectivo', variant: 'success' as const },
          card: { label: 'Tarjeta', variant: 'info' as const },
          transfer: { label: 'Transferencia', variant: 'warning' as const },
        }
        const { label, variant } = map[s.paymentMethod]
        return <Badge variant={variant}>{label}</Badge>
      },
    },
    {
      key: 'date',
      header: 'Fecha',
      render: (s: Sale) => (
        <span className={`text-muted ${s.status === 'voided' ? 'line-through' : ''}`}>{new Date(s.createdAt).toLocaleDateString('es-ES')}</span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* ── Row 1: KPIs principales ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard icon={Package} label="Total productos" value={stats.totalProducts} accent="primary" />
            <StatCard icon={DollarSign} label="Ingresos totales" value={`${config.currency.symbol}${stats.revenue.toFixed(2)}`} accent="accent" />
            <StatCard icon={ShoppingCart} label="Ventas realizadas" value={stats.totalSales} accent="success" />
          </>
        )}
      </div>

      {/* ── Row 3: Alerta de stock bajo (full-width) ── */}
      {
        loading ? (
          <SkeletonCard />
        ) : stats.lowStockCount > 0 ? (
          <div className="flex items-center gap-3 rounded-[10px] border border-danger/30 bg-danger/5 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger">
              <AlertTriangle size={16} color="white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-danger-text">
                {stats.lowStockCount} producto{stats.lowStockCount !== 1 ? 's' : ''} con stock bajo
              </p>
              <p className="text-[11px] text-muted">Revisá la sección de Stock Crítico para reponer</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[10px] border border-success/30 bg-success/5 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success">
              <CheckCircle size={16} color="white" />
            </div>
            <p className="text-[13px] font-semibold text-success-text">Todo el stock está en orden</p>
          </div>
        )
      }

      {/* ── Row 4: Bento — Stock Crítico (2/3) + Últimas Ventas (1/3) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
        <Card
          title="Stock crítico"
          subtitle={lowStock.length > 0 ? `${lowStock.length} producto${lowStock.length !== 1 ? 's' : ''} bajo mínimo` : undefined}
          className="lg:col-span-2"
        >
          {loading ? (
            <div className="divide-y divide-border/50">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : lowStock.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted">
              No hay productos con stock bajo
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {lowStock.slice(0, 4).map((p) => {
                  const maxStock = p.minStock * 3
                  return (
                    <div key={p.id} className="rounded-lg border border-border bg-surface p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-text">{p.name}</p>
                          <p className="text-[10px] text-muted">{getCategoryById(p.categoryId)?.name || '—'}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[15px] font-bold text-danger-text">{p.stock} uds.</p>
                          <p className="text-[10px] text-muted">Mín: {p.minStock}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <StockBar current={p.stock} min={p.minStock} max={maxStock} />
                      </div>
                    </div>
                  )
                })}
              </div>
              {lowStock.length > 4 && (
                <Link
                  to="/purchases?tab=reorder"
                  className="mt-3 flex items-center justify-center gap-1 text-[11px] font-medium text-primary-light transition-colors hover:text-primary"
                >
                  Ver los {lowStock.length} productos <ArrowUpRight size={13} />
                </Link>
              )}
            </>
          )}
        </Card>

        <Card title="Últimas ventas" actions={
          <span className="text-[10px] text-primary-light cursor-pointer hover:text-primary transition-colors">
            Ver todas →
          </span>
        }>
          {loading ? (
            <div className="divide-y divide-border/50">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : (
            <Table
              columns={saleColumns}
              data={recentSales}
              keyExtractor={(s) => s.id}
              emptyMessage="No hay ventas registradas"
            />
          )}
        </Card>
      </div>
    </div >
  )
}
