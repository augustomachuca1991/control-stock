import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const titles: Record<string, string> = {
  '/':           'Dashboard',
  '/products':   'Productos',
  '/sales':      'Ventas',
  '/purchases':  'Compras',
  '/categories': 'Categorías',
}

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Control de Stock'

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <header className="flex h-[52px] flex-shrink-0 items-center justify-between border-b border-border bg-surface px-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-primary-dim hover:text-primary-light md:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-[15px] font-semibold text-text">{title}</h2>
          <p className="hidden text-[10px] capitalize text-muted md:block">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
          A
        </div>
      </div>
    </header>
  )
}