import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'

interface Option {
    value: string
    label: string
}

interface SearchSelectProps {
    options: Option[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    label?: string
    error?: string
}

export function SearchSelect({ options, value, onChange, placeholder = 'Buscar...', label, error }: SearchSelectProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selected = options.find((o) => o.value === value)

    const filtered = query.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
        : options.slice(-5)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50)
    }, [open])

    function handleSelect(val: string) {
        onChange(val)
        setQuery('')
        setOpen(false)
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation()
        onChange('')
        setQuery('')
    }

    return (
        <div className="relative flex flex-col gap-1.5" ref={containerRef}>
            {label !== undefined && (
                <label className="text-[11px] font-medium uppercase tracking-[0.6px] text-muted">{label}</label>
            )}

            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`flex h-9 w-full items-center justify-between rounded-lg border bg-surface px-3 text-[13px] transition-colors focus:outline-none focus:border-border-strong ${error ? 'border-danger/50' : 'border-border'}`}
            >
                <span className={`truncate ${selected ? 'text-text' : 'text-muted'}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <div className="flex shrink-0 items-center gap-1 ml-2">
                    {value && (
                        <span onClick={handleClear} className="text-muted hover:text-text">
                            <X size={13} />
                        </span>
                    )}
                    <ChevronDown size={13} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            <div className="min-h-[18px]">
              {error && <p className="text-[11px] text-danger-text">{error}</p>}
            </div>
            {open && (
                <div className="absolute top-full left-0 right-0 z-[60] mt-1 rounded-lg border border-border bg-card shadow-xl">
                    <div className="border-b border-border p-2">
                        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5">
                            <Search size={13} className="shrink-0 text-muted" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Buscar por nombre o código..."
                                className="w-full bg-transparent text-[12px] text-text placeholder:text-muted focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="px-3 py-4 text-center text-[12px] text-muted">Sin resultados</p>
                        ) : (
                            filtered.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={`w-full px-3 py-2 text-left text-[12px] transition-colors hover:bg-primary-dim ${opt.value === value ? 'bg-primary-dim text-primary-light' : 'text-text'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}