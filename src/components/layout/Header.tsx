import { useState, useRef, useEffect, useCallback } from 'react'
import { Formik, Form } from 'formik'
import { Menu, LogOut, Sun, Moon, Upload, ShoppingCart, UserCog, Database, WifiOff } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { useThemeStore } from '../../stores/useThemeStore'
import { useSaleStore } from '../../stores/useSaleStore'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { Modal } from '../ui/Modal'
import { Img } from '../ui/Img'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { profileSchema } from '../../lib/validation'
import MarelyLogo from '../ui/MarelyLogo'
import { toast } from 'sonner'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Productos',
  '/sales': 'Ventas',
  '/purchases': 'Compras',
  '/categories': 'Categorías',
  '/invoices': 'Factura',
  '/reports': 'Reportes',
  '/settings': 'Ajustes',
}

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { pathname } = useLocation()
  const { user, signOut, isAdmin } = useAuth()
  const { profile, update: updateProfile, uploadAvatar, uploading } = useProfile(user?.id)
  const navigate = useNavigate()
  const title = titles[pathname] ?? 'Control de Stock'
  const { theme, toggle: toggleTheme } = useThemeStore()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const handleLogout = useCallback(async () => {
    await signOut()
    navigate('/login')
  }, [signOut, navigate])

  const { isOnline } = useOnlineStatus()

  const initial = user?.email?.charAt(0).toUpperCase() ?? 'U'

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <>
      <header className="relative z-50 flex h-[52px] flex-shrink-0 items-center justify-between border-b border-border bg-surface px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-primary-dim hover:text-primary-light md:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 md:hidden">
            <MarelyLogo iconOnly width={32} />
            <span className="h-5 w-px bg-border-strong" />
            <span className="text-[15px] font-semibold tracking-wide text-text/90">{title}</span>
          </div>

          <div className="hidden md:block">
            <h2 className="text-[15px] font-semibold text-text">{title}</h2>
            <p className="text-[10px] capitalize text-muted">{today}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOnline && (
            <span
              className="flex items-center gap-1 rounded-full bg-danger-dim px-2.5 py-1 text-[10px] font-semibold text-danger-text"
              title="Sin conexión — mostrando datos locales"
            >
              <WifiOff size={12} /> Offline
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-primary-dim hover:text-primary-light"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <CartBadge />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-primary-dim"
            >
              {profile?.avatar_url ? (
                <Img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" skeleton="rounded-full" />
              ) : (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{
                    background: theme === 'light' ? '#1c1917' : '#C9A84C',
                    color: theme === 'light' ? '#faf6f0' : '#0D0D0A',
                  }}
                >
                  {initial}
                </span>
              )}
              <span className="hidden text-[12px] font-medium uppercase text-text sm:block">
                {profile?.full_name || user?.email}
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border-strong bg-bg p-3 shadow-2xl">
                <div className="mb-3 border-b border-border pb-3">
                  <p className="text-[13px] font-semibold uppercase text-text">{profile?.full_name || 'Usuario'}</p>
                  <p className="text-[11px] text-muted">{user?.email}</p>
                  {profile?.phone && <p className="text-[11px] text-muted">{profile.phone}</p>}
                </div>

                <button
                  onClick={() => { setDropdownOpen(false); setProfileModalOpen(true) }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-muted transition-colors hover:bg-surface hover:text-text"
                >
                  <UserCog size={14} /> Editar perfil
                </button>

                {isAdmin && (
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/settings?tab=backup') }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-muted transition-colors hover:bg-surface hover:text-text"
                  >
                    <Database size={14} /> Respaldo y Restauración
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-danger-text transition-colors hover:bg-danger-dim"
                >
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Modal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Editar Perfil" size="sm">
        <Formik
          initialValues={{ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' }}
          validationSchema={profileSchema}
          enableReinitialize
          onSubmit={async (values, { setSubmitting }) => {
            await updateProfile(values)
            setSubmitting(false)
            setProfileModalOpen(false)
          }}
        >
          {({ isSubmitting, resetForm }) => (
            <Form className="space-y-4">
              <Field name="full_name" label="Nombre completo" placeholder="Tu nombre" />
              <Field name="phone" label="Teléfono" placeholder="+54 11 1234-5678" />
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">Foto de perfil</p>
                <div className="flex items-center gap-3">
                  {profile?.avatar_url ? (
                    <Img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" skeleton="rounded-full" />
                  ) : (
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full text-[16px] font-bold"
                      style={{
                        background: theme === 'light' ? '#1c1917' : '#C9A84C',
                        color: theme === 'light' ? '#faf6f0' : '#0D0D0A',
                      }}
                    >
                      {initial}
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="avatar-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const { error } = await uploadAvatar(file)
                      if (error) toast.error(error)
                      e.target.value = ''
                    }}
                  />
                  <Button variant="surface" size="sm" type="button" disabled={uploading} onClick={() => document.getElementById('avatar-upload')?.click()}>
                    <Upload size={13} /> {uploading ? 'Subiendo...' : 'Subir foto'}
                  </Button>
                </div>
              </div>
              <Input label="Email" value={user?.email ?? ''} disabled />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="gold-outline" type="button" onClick={() => { resetForm(); setProfileModalOpen(false) }}>Cancelar</Button>
                <Button variant="gold" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>
    </>
  )
}

function CartBadge() {
  const cart = useSaleStore((s) => s.cart)
  const navigate = useNavigate()
  const count = cart.length
  if (count === 0) return null

  return (
    <button
      onClick={() => navigate('/sales')}
      className="relative rounded-lg p-1.5 text-muted transition-colors hover:bg-primary-dim hover:text-primary-light"
      title="Ir al carrito de ventas"
    >
      <ShoppingCart size={18} />
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
        {count}
      </span>
    </button>
  )
}
