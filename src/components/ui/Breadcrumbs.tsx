import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, LayoutDashboard } from 'lucide-react'
import { useMemo } from 'react'

const labels: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Productos',
  '/sales': 'Ventas',
  '/categories': 'Categorías',
  '/purchases': 'Compras',
  '/invoices': 'Facturas',
  '/reports': 'Reportes',
  '/settings': 'Ajustes',
}

export function Breadcrumbs() {
  const { pathname } = useLocation()

  const segments = useMemo(() => {
    if (pathname === '/') return null
    const label = labels[pathname]
    if (!label) return null
    return [{ href: '/', label: 'Inicio' }, { label }]
  }, [pathname])

  if (!segments) return null

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-[12px]">
      {segments.map((seg, i) => (
        <span key={seg.href ?? seg.label} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={12} className="text-muted" />}
          {'href' in seg && seg.href ? (
            <Link to={seg.href} className="flex items-center gap-1 text-muted transition-colors hover:text-primary-light">
              {i === 0 && <LayoutDashboard size={12} />}
              {seg.label}
            </Link>
          ) : (
            <span className="font-medium text-text">{seg.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
