import { RotateCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function NewVersionBanner() {
  const { needRefresh, updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 border-b px-4 py-2.5 text-[13px]" style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-primary-dim)' }}>
      <span style={{ color: 'var(--clr-text)' }}>Nueva versión disponible</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-[12px] font-medium transition-colors"
        style={{ background: 'var(--clr-primary)', color: 'white' }}
      >
        <RotateCw size={14} /> Actualizar ahora
      </button>
      <button
        onClick={() => updateServiceWorker(false)}
        className="rounded-lg p-1 transition-colors hover:bg-primary-dim"
        style={{ color: 'var(--clr-muted)' }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
