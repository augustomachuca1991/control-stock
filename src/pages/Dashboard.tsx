import { useMemo } from 'react'
import { Package, ShoppingCart, DollarSign, AlertTriangle, type LucideIcon } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { useProductStore } from '../stores/useProductStore'
import { useSaleStore } from '../stores/useSaleStore'
import { useCategoryStore } from '../stores/useCategoryStore'
import { useProducts } from '../hooks/useProducts'
import { useSales } from '../hooks/useSales'
import { useCategories } from '../hooks/useCategories'
import type { Sale } from '../types'
import { config } from '../config'

/* ── Colores de acento por KPI ── */
type AccentColor = 'primary' | 'accent' | 'success' | 'danger'

const accentMap: Record<AccentColor, { bar: string; icon: string; val: string }> = {
  primary: { bar: 'bg-primary',  icon: 'bg-primary',  val: 'text-text'        },
  accent:  { bar: 'bg-accent',   icon: 'bg-accent',   val: 'text-accent'      },
  success: { bar: 'bg-success',  icon: 'bg-success',  val: 'text-text'        },
  danger:  { bar: 'bg-danger',   icon: 'bg-danger',   val: 'text-danger-text' },
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
      {/* Barra inferior de color */}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${a.bar}`} />

      {/* Ícono */}
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
  useProducts()
  useSales()
  useCategories()

  const products        = useProductStore((s) => s.products)
  const lowStock        = useMemo(() => products.filter((p) => p.stock <= p.minStock), [products])
  const totalSales      = useSaleStore((s) => s.getSalesCount())
  const revenue         = useSaleStore((s) => s.getTotalRevenue())
  const sales           = useSaleStore((s) => s.sales)
  const getCategoryById = useCategoryStore((s) => s.getCategoryById)

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
        <span className="font-mono text-[11px] text-primary-light">#{s.id.slice(-4)}</span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (s: Sale) => (
        <span className="text-muted-light">{s.items.length} producto{s.items.length !== 1 ? 's' : ''}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (s: Sale) => (
        <span className="font-bold text-accent">
          {config.currency.symbol}{s.total.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'payment',
      header: 'Método',
      render: (s: Sale) => {
        const map = {
          cash:     { label: 'Efectivo',     variant: 'success' as const },
          card:     { label: 'Tarjeta',       variant: 'info'    as const },
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
        <span className="text-muted">{new Date(s.createdAt).toLocaleDateString('es-ES')}</span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Package}
          label="Total productos"
          value={stats.totalProducts}
          trend="+2 nuevos"
          accent="primary"
        />
        <StatCard
          icon={DollarSign}
          label="Ingresos totales"
          value={`${config.currency.symbol}${stats.revenue.toFixed(2)}`}
          trend="+15,3%"
          accent="accent"
        />
        <StatCard
          icon={ShoppingCart}
          label="Ventas realizadas"
          value={stats.totalSales}
          trend="+11,8%"
          accent="success"
        />
        <StatCard
          icon={AlertTriangle}
          label="Stock bajo"
          value={stats.lowStockCount}
          trend="Requiere atención"
          trendUp={false}
          accent="danger"
        />
      </div>

      {/* Tablas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Últimas ventas" actions={
          <span className="text-[10px] text-primary-light cursor-pointer hover:text-primary transition-colors">
            Ver todas →
          </span>
        }>
          <Table
            columns={saleColumns}
            data={recentSales}
            keyExtractor={(s) => s.id}
            emptyMessage="No hay ventas registradas"
          />
        </Card>

        <Card
          title="Stock crítico"
          subtitle={lowStock.length > 0 ? `${lowStock.length} producto${lowStock.length !== 1 ? 's' : ''} bajo mínimo` : undefined}
        >
          {lowStock.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted">
              Todo el stock está en orden ✓
            </p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((p) => {
                const maxStock = p.minStock * 3
                return (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[12px] font-medium text-text">{p.name}</p>
                        <p className="text-[10px] text-muted">{getCategoryById(p.categoryId)?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-danger-text">{p.stock} uds.</p>
                        <p className="text-[10px] text-muted">Mín: {p.minStock}</p>
                      </div>
                    </div>
                    <StockBar current={p.stock} min={p.minStock} max={maxStock} />
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}