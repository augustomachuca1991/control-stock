import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalSize = 'sm' | 'md' | 'lg'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  children: ReactNode
}

const sizes: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
}

export function Modal({ open, onClose, title, size = 'md', children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative flex max-h-dvh w-full flex-col ${sizes[size]} rounded-[10px] border border-border bg-card shadow-xl sm:max-h-[85vh]`}>
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
            <h2 className="text-[13px] font-semibold text-text">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted transition-colors hover:bg-primary-dim hover:text-primary-light"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto overflow-x-hidden p-5">{children}</div>
      </div>
    </div>
  )
}