import { type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  placeholder?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, placeholder, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label !== undefined && (
        <label className="text-[11px] font-medium uppercase tracking-[0.6px] text-muted">
          {label}
        </label>
      )}
      <select
        className={`h-9 w-full appearance-none rounded-lg border border-border bg-surface px-3 text-[13px] text-text transition-colors focus:border-border-strong focus:outline-none ${
          error ? 'border-danger/50' : ''
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" className="text-muted bg-surface">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-text">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="min-h-[18px]">
        {error && <p className="text-[11px] text-danger-text">{error}</p>}
      </div>
    </div>
  )
}