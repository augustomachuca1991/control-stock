import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Tags, ClipboardList, FileText } from 'lucide-react'
import MarelyLogo from '../ui/MarelyLogo'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/sales', label: 'Ventas', icon: ShoppingCart },
  { to: '/purchases', label: 'Compras', icon: ClipboardList },
  { to: '/categories', label: 'Categorías', icon: Tags },
  { to: '/invoices', label: 'Factura', icon: FileText },
  /* { to: '/settings',  label: 'Ajustes',    icon: Settings }, */
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-700 ease-out will-change-opacity md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-surface transition-all duration-700 ease-out will-change-transform md:static md:z-auto md:translate-x-0 md:opacity-100 ${open ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
          }`}
      >
        {/* Logo */}
        <div className="border-b border-border flex justify-center px-4 py-2">
          <MarelyLogo width={180} backgroundColor="transparent" className="max-w-full" />
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-[3px] overflow-y-auto p-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-[10px] rounded-lg px-3 py-[9px] text-[13px] transition-colors ${isActive
                  ? 'border border-border-strong bg-primary-dim text-primary-light'
                  : 'text-muted hover:bg-primary-dim/50 hover:text-muted-light'
                }`
              }
            >
              <link.icon size={15} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <MarelyLogo iconOnly width={22} />
            <span className="text-[10px] text-muted leading-tight">
              Marely<br />Librería &amp; Papelería
            </span>
          </div>
          <div title="Sistema activo">
            <div className="h-[7px] w-[7px] rounded-full bg-success" />
          </div>
        </div>
      </aside>
    </>
  )
}