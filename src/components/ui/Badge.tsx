import type { ReactNode } from 'react'

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-success-dim text-success-text',
  danger:  'bg-danger-dim  text-danger-text',
  warning: 'bg-warning-dim text-warning-text',
  info:    'bg-primary-dim text-primary-text',
  default: 'bg-muted-dim   text-muted-text',
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-[7px] py-[2px] text-[9px] font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}