import { AlertCircle } from 'lucide-react'
import type { Sale } from '../../types'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'

interface VoidConfirmModalProps {
  open: boolean
  onClose: () => void
  saleToVoid: Sale | null
  voiding: boolean
  handleVoidSale: () => void
}

export function VoidConfirmModal({
  open, onClose, saleToVoid, voiding, handleVoidSale,
}: VoidConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Anular venta" size="sm">
      {saleToVoid && (
        <div className="space-y-4">
          <div
            className="flex items-start gap-3 rounded-xl border p-3"
            style={{ borderColor: 'var(--clr-danger)', background: 'var(--clr-danger-dim)' }}
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--clr-danger-text)' }} />
            <div className="text-[12px]" style={{ color: 'var(--clr-muted)' }}>
              <p className="font-semibold" style={{ color: 'var(--clr-danger-text)' }}>¿Anular esta venta?</p>
              <p className="mt-1">Se restaurará el stock de todos los productos de la venta #{saleToVoid.id.slice(-6).toUpperCase()}.</p>
              <p className="mt-1">Esta acción no se puede deshacer.</p>
            </div>
          </div>

          <div className="rounded-xl border p-3 space-y-1.5" style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}>
            {saleToVoid.items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-[12px]">
                <span style={{ color: 'var(--clr-text)' }}>{item.productName}</span>
                <span style={{ color: 'var(--clr-muted-light)' }}>x{item.quantity} → stock restaurado</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--clr-border)' }}>
            <Button variant="gold-outline" onClick={onClose}>Cancelar</Button>
            <Button variant="surface" onClick={handleVoidSale} disabled={voiding}>
              <AlertCircle size={14} /> {voiding ? 'Anulando...' : 'Confirmar anulación'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
