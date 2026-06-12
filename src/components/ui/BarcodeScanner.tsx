import { useEffect, useRef, useState } from 'react'
import { X, Camera, CameraOff, Loader2 } from 'lucide-react'
import { Modal } from './Modal'
import { Html5Qrcode } from 'html5-qrcode'

interface BarcodeScannerProps {
  open: boolean
  onClose: () => void
  onDetected: (barcode: string) => void
}

const SCANNER_ID = 'barcode-scanner-element'

export function BarcodeScanner({ open, onClose, onDetected }: BarcodeScannerProps) {
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const detectedOnce = useRef(false)

  useEffect(() => {
    if (!open) {
      detectedOnce.current = false
      setError('')
      setManualCode('')
      scannerRef.current?.stop().catch(() => {})
      return
    }

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(SCANNER_ID)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText) => {
            if (detectedOnce.current) return
            detectedOnce.current = true
            scanner.stop().catch(() => {})
            onDetected(decodedText)
            onClose()
          },
          () => {},
        )
      } catch (err) {
        setError('No se pudo acceder a la cámara. Permití el acceso o ingresá el código manualmente.')
      }
    }

    const timeout = setTimeout(start, 300)
    return () => {
      clearTimeout(timeout)
      scannerRef.current?.stop().catch(() => {})
    }
  }, [open, onDetected, onClose])

  const handleManualSubmit = () => {
    const code = manualCode.trim()
    if (code) {
      onDetected(code)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Escanear código de barras" size="sm">
      <div className="space-y-4">
        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 p-6 text-center">
            <CameraOff size={32} className="text-danger-text" />
            <p className="text-[13px] text-danger-text">{error}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-black">
            <div id={SCANNER_ID} className="h-56 w-full" />
            <div className="flex items-center justify-center gap-2 border-t border-border/30 bg-black/80 py-2">
              <Camera size={14} className="text-white/60" />
              <span className="text-[11px] text-white/60">Apuntá la cámara al código de barras</span>
              <Loader2 size={14} className="animate-spin text-accent" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted">
            O ingresá el código manualmente
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="Código de barras..."
              className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-[13px] text-text placeholder:text-muted transition-colors focus:border-border-strong focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[12px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <X size={13} /> Usar
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] text-muted transition-colors hover:bg-primary-dim hover:text-primary-light"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  )
}
