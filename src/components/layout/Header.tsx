import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu, LogOut, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import MarelyLogo from '../ui/MarelyLogo'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Productos',
  '/sales': 'Ventas',
  '/purchases': 'Compras',
  '/categories': 'Categorías',
}

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const { profile, update: updateProfile } = useProfile(user?.id)
  const navigate = useNavigate()
  const title = titles[pathname] ?? 'Control de Stock'

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name)
      setPhone(profile.phone)
    }
  }, [profile])

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

  const saveProfile = useCallback(async () => {
    setSaving(true)
    await updateProfile({ full_name: fullName, phone })
    setSaving(false)
    setProfileModalOpen(false)
  }, [fullName, phone, updateProfile])

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

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-primary-dim"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">
              {initial}
            </span>
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
                <Settings size={14} /> Editar perfil
              </button>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-danger-text transition-colors hover:bg-danger-dim"
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <Modal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Editar Perfil" size="sm">
        <div className="space-y-4">
          <Input label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
          <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 1234-5678" />
          <Input label="Email" value={user?.email ?? ''} disabled />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="gold-outline" onClick={() => setProfileModalOpen(false)}>Cancelar</Button>
          <Button variant="gold" onClick={saveProfile} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </Modal>
    </>
  )
}
