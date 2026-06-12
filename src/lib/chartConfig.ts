import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

Chart.register(...registerables, ChartDataLabels)

export function applyChartTheme(isDark: boolean) {
  const text = isDark ? '#a1a1aa' : '#71717a'
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  Chart.defaults.color = text
  Chart.defaults.borderColor = border
  Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif"
  Chart.defaults.font.size = 11
  Chart.defaults.plugins.legend!.labels!.boxWidth = 12
  Chart.defaults.plugins.legend!.labels!.padding = 12

  Chart.overrides.bar = {
    ...Chart.overrides.bar,
    scales: {
      x: { grid: { color: grid, display: false }, border: { display: false } },
      y: { grid: { color: grid }, border: { display: false }, ticks: { maxTicksLimit: 6 } },
    },
  } as any

  Chart.overrides.line = {
    ...Chart.overrides.line,
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { grid: { color: grid }, border: { display: false }, ticks: { maxTicksLimit: 6 } },
    },
  } as any

  Chart.overrides.doughnut = {
    ...Chart.overrides.doughnut,
    plugins: {
      legend: { position: 'bottom' },
    },
  } as any
}

export const CHART_COLORS = {
  primary: '#818cf8',
  accent: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  purple: '#a855f7',
  cyan: '#06b6d4',
  pink: '#ec4899',
  gray: '#6b7280',
}

export function getPalette(count: number): string[] {
  const palette = Object.values(CHART_COLORS)
  return Array.from({ length: count }, (_, i) => palette[i % palette.length])
}
