import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, BarChart3, Download } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useReports } from '../hooks/useReports'
import { useProducts } from '../hooks/useProducts'
import { useSales } from '../hooks/useSales'
import { usePurchases } from '../hooks/usePurchases'
import { useCategories } from '../hooks/useCategories'
import { useThemeStore } from '../stores/useThemeStore'
import { config } from '../config'
import { applyChartTheme, CHART_COLORS, getPalette } from '../lib/chartConfig'
import { exportToXLSX, type ExportColumn } from '../lib/export'

function KpiCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel,
  accent = 'primary',
}: {
  icon: typeof DollarSign
  label: string
  value: string
  change?: number
  changeLabel?: string
  accent?: 'primary' | 'accent' | 'success' | 'danger'
}) {
  const barMap = { primary: 'bg-primary', accent: 'bg-accent', success: 'bg-success', danger: 'bg-danger' }
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-border bg-card p-3">
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${barMap[accent]}`} />
      <div className={`mb-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-${accent}`}>
        <Icon size={14} color="white" strokeWidth={2} />
      </div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">{label}</p>
      <p className="text-[22px] font-bold leading-none text-text">{value}</p>
      {change !== undefined && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px]">
          {change >= 0 ? (
            <TrendingUp size={12} className="text-success-text" />
          ) : (
            <TrendingDown size={12} className="text-danger-text" />
          )}
          <span className={change >= 0 ? 'text-success-text' : 'text-danger-text'}>
            {Math.abs(change).toFixed(1)}% {changeLabel || 'vs mes anterior'}
          </span>
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card title={title} subtitle={subtitle}>
      {children}
    </Card>
  )
}

export function Reports() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { loading: productsLoading } = useProducts()
  const { loading: salesLoading } = useSales()
  const { loading: purchasesLoading } = usePurchases()
  useCategories()
  const loading = productsLoading || salesLoading || purchasesLoading

  const {
    reportData,
    salesByPeriod,
    topProducts,
    paymentDistribution,
    categoryStock,
    revenueData,
  } = useReports()

  const barRef = useRef<HTMLCanvasElement>(null)
  const barInstance = useRef<Chart | null>(null)
  const doughnutRef = useRef<HTMLCanvasElement>(null)
  const doughnutInstance = useRef<Chart | null>(null)
  const topBarRef = useRef<HTMLCanvasElement>(null)
  const topBarInstance = useRef<Chart | null>(null)
  const revenueRef = useRef<HTMLCanvasElement>(null)
  const revenueInstance = useRef<Chart | null>(null)
  const stockRef = useRef<HTMLCanvasElement>(null)
  const stockInstance = useRef<Chart | null>(null)

  useEffect(() => { applyChartTheme(isDark) }, [isDark])

  useEffect(() => {
    barInstance.current?.destroy()
    if (!salesByPeriod.length) return
    const ctx = barRef.current?.getContext('2d')
    if (!ctx) return
    barInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: salesByPeriod.map((d) => d.label),
        datasets: [{
          label: 'Ingresos',
          data: salesByPeriod.map((d) => d.total),
          backgroundColor: CHART_COLORS.primary,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, datalabels: { display: false } },
      },
    })
    return () => { barInstance.current?.destroy(); barInstance.current = null }
  }, [salesByPeriod])

  useEffect(() => {
    doughnutInstance.current?.destroy()
    if (!paymentDistribution.length) return
    const ctx = doughnutRef.current?.getContext('2d')
    if (!ctx) return
    const labels: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }
    const palette = [CHART_COLORS.success, CHART_COLORS.primary, CHART_COLORS.accent]
    const colors = paymentDistribution.map((_, i) => palette[i % palette.length])
    doughnutInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: paymentDistribution.map((d) => labels[d.method]),
        datasets: [{
          data: paymentDistribution.map((d) => d.total),
          backgroundColor: colors,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            color: isDark ? '#fff' : '#222',
            font: { weight: 'bold', size: 11 },
            formatter: (v: number, ctx2: any) => {
              const total = ctx2.dataset.data.reduce((a: number, b: number) => a + b, 0)
              return `${((v / total) * 100).toFixed(0)}%`
            },
          },
        },
      },
    })
    return () => { doughnutInstance.current?.destroy(); doughnutInstance.current = null }
  }, [paymentDistribution, isDark])

  useEffect(() => {
    topBarInstance.current?.destroy()
    if (!topProducts.length) return
    const ctx = topBarRef.current?.getContext('2d')
    if (!ctx) return
    topBarInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topProducts.map((p) => p.name.length > 18 ? p.name.slice(0, 16) + '...' : p.name),
        datasets: [{
          label: 'Cantidad vendida',
          data: topProducts.map((p) => p.quantity),
          backgroundColor: getPalette(topProducts.length),
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, datalabels: { display: false } },
      },
    })
    return () => { topBarInstance.current?.destroy(); topBarInstance.current = null }
  }, [topProducts])

  useEffect(() => {
    revenueInstance.current?.destroy()
    if (!revenueData.length) return
    const ctx = revenueRef.current?.getContext('2d')
    if (!ctx) return
    revenueInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: revenueData.map((d) => d.date),
        datasets: [
          {
            label: 'Ingresos',
            data: revenueData.map((d) => d.income),
            borderColor: CHART_COLORS.primary,
            backgroundColor: CHART_COLORS.primary + '20',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
          },
          {
            label: 'Costo estimado',
            data: revenueData.map((d) => d.cost),
            borderColor: CHART_COLORS.danger,
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.3,
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: { display: false },
          legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } },
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, beginAtZero: true },
        },
      },
    })
    return () => { revenueInstance.current?.destroy(); revenueInstance.current = null }
  }, [revenueData, isDark])

  useEffect(() => {
    stockInstance.current?.destroy()
    if (!categoryStock.length) return
    const ctx = stockRef.current?.getContext('2d')
    if (!ctx) return
    stockInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categoryStock.map((c) => c.name.length > 18 ? c.name.slice(0, 16) + '...' : c.name),
        datasets: [{
          label: 'Productos',
          data: categoryStock.map((c) => c.count),
          backgroundColor: getPalette(categoryStock.length),
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, datalabels: { display: false } },
      },
    })
    return () => { stockInstance.current?.destroy(); stockInstance.current = null }
  }, [categoryStock])

  const exportColumns: ExportColumn<any>[] = [
    { key: 'label', header: 'Período' },
    { key: 'total', header: 'Ingresos', format: (v) => `${config.currency.symbol}${Number(v).toFixed(2)}` },
    { key: 'count', header: 'Ventas' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.8px] text-muted">Reportes</h2>
          <p className="mt-0.5 text-[11px] text-muted">Analítica y métricas del negocio</p>
        </div>
        <Button variant="surface" size="sm" onClick={() => exportToXLSX(salesByPeriod, exportColumns, 'reporte_ventas')}>
          <Download size={13} /> Exportar
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={DollarSign} label="Ingresos hoy" value={`${config.currency.symbol}${reportData.todayRevenue.toFixed(2)}`} accent="accent" />
            <KpiCard icon={ShoppingCart} label="Ventas hoy" value={String(reportData.todaySales)} accent="primary" />
            <KpiCard
              icon={BarChart3}
              label="Ingresos del mes"
              value={`${config.currency.symbol}${reportData.monthRevenue.toFixed(2)}`}
              change={reportData.revenueChange}
              accent="success"
            />
            <KpiCard icon={Package} label="Productos" value={String(reportData.totalProducts)} change={-reportData.lowStockCount} changeLabel="con stock bajo" accent="danger" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Ventas por período */}
            <ChartCard title="Ventas por día" subtitle="Últimos 14 días">
              <div className="h-52">
                <canvas ref={barRef} />
              </div>
            </ChartCard>

            {/* Método de pago */}
            <ChartCard title="Método de pago" subtitle="Distribución de ingresos">
              <div className="h-52 flex items-center justify-center">
                <canvas ref={doughnutRef} />
              </div>
            </ChartCard>

            {/* Ingresos vs Costos */}
            <ChartCard title="Ingresos vs Costos" subtitle="Últimos 14 días">
              <div className="h-52">
                <canvas ref={revenueRef} />
              </div>
            </ChartCard>

            {/* Top productos */}
            <ChartCard title="Top productos" subtitle={`${topProducts.length} más vendidos`}>
              <div className="h-60">
                <canvas ref={topBarRef} />
              </div>
            </ChartCard>

            {/* Stock por categoría */}
            <ChartCard title="Stock por categoría" subtitle="Cantidad de productos">
              <div className="h-52">
                <canvas ref={stockRef} />
              </div>
            </ChartCard>

            {/* Resumen */}
            <ChartCard title="Resumen general" subtitle="Métricas globales">
              <div className="space-y-3">
                {[
                  { label: 'Ingresos totales', value: `${config.currency.symbol}${reportData.allTimeRevenue.toFixed(2)}` },
                  { label: 'Ventas totales', value: String(reportData.allTimeSales) },
                  { label: 'Productos en catálogo', value: String(reportData.totalProducts) },
                  { label: 'Con stock bajo', value: String(reportData.lowStockCount), danger: reportData.lowStockCount > 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                    <span className="text-[12px] text-muted">{item.label}</span>
                    <span className={`text-[13px] font-semibold ${item.danger ? 'text-danger-text' : 'text-text'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
