import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label !== undefined && (
          <label className="text-[11px] font-medium uppercase tracking-[0.6px] text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] text-text placeholder:text-muted transition-colors focus:border-border-strong focus:outline-none ${
              icon ? 'pl-9' : ''
            } ${error ? 'border-danger/50 focus:border-danger' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-danger-text">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'