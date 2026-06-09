import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Tags, ClipboardList, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import MarelyLogo from '../ui/MarelyLogo'

const links = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/products',  label: 'Productos',  icon: Package },
  { to: '/sales',     label: 'Ventas',     icon: ShoppingCart },
  { to: '/purchases', label: 'Compras',    icon: ClipboardList },
  { to: '/categories',label: 'Categorías', icon: Tags },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

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
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-surface transition-transform duration-300 ease-in-out md:static md:z-auto md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
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
                `flex items-center gap-[10px] rounded-lg px-3 py-[9px] text-[13px] transition-colors ${
                  isActive
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
            <div className="h-[7px] w-[7px] rounded-full bg-success" />
            <span className="text-[11px] text-success-text">Sistema activo</span>
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden flex items-center gap-1 text-[11px] text-muted hover:text-danger-text transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={13} /> Salir
          </button>
        </div>
      </aside>
    </>
  )
}