import { FileText, Printer } from 'lucide-react'
import type { Sale } from '../../types'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { PaymentTag } from './salesComponents'
import { config } from '../../config'

interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  lastSale: Sale | null
  onPrint?: () => void
}

export function ReceiptModal({ open, onClose, lastSale, onPrint }: ReceiptModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Comprobante emitido" size="md">
      {lastSale && (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 border-b pb-4" style={{ borderColor: 'var(--clr-border)' }}>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: 'var(--clr-success-dim)' }}
            >
              <FileText size={22} style={{ color: 'var(--clr-success-text)' }} />
            </div>
            <div className="text-center">
              <h3 className="text-[15px] font-bold" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--clr-text)' }}>{config.storeName}</h3>
              <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>Comprobante #{lastSale.id.slice(-8).toUpperCase()}</p>
              <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>{new Date(lastSale.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
            </div>
          </div>

          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'var(--clr-border)' }}>
                <th className="pb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Producto</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Cant.</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>P. Unit.</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {lastSale.items.map((item) => (
                <tr key={item.productId} className="border-b" style={{ borderColor: 'var(--clr-border-subtle)' }}>
                  <td className="py-2.5" style={{ color: 'var(--clr-text)' }}>
                    <p>{item.productName}</p>
                    {item.productDescription && <p className="text-[10px] text-muted mt-0.5 leading-snug">{item.productDescription}</p>}
                  </td>
                  <td className="py-2.5 text-right" style={{ color: 'var(--clr-muted-light)' }}>{item.quantity}</td>
                  <td className="py-2.5 text-right" style={{ color: 'var(--clr-muted-light)' }}>{config.currency.symbol}{item.unitPrice.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-semibold" style={{ color: 'var(--clr-text)' }}>{config.currency.symbol}{(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col items-end gap-1 border-t pt-3" style={{ borderColor: 'var(--clr-border)' }}>
            {lastSale.discountPercent && lastSale.discountPercent > 0 && (
              <div className="flex w-56 items-center justify-between text-[12px]">
                <span style={{ color: 'var(--clr-danger-text)' }}>Descuento ({lastSale.discountPercent}%)</span>
                <span style={{ color: 'var(--clr-danger-text)' }}>-{config.currency.symbol}{(lastSale.total * lastSale.discountPercent / (100 - lastSale.discountPercent)).toFixed(2)}</span>
              </div>
            )}
            <div className="flex w-56 items-center justify-between text-[15px] font-bold">
              <span style={{ color: 'var(--clr-text)' }}>Total</span>
              <span style={{ color: 'var(--clr-accent)' }}>{config.currency.symbol}{lastSale.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-[12px]" style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}>
            <span style={{ color: 'var(--clr-muted)' }}>Método de pago</span>
            <PaymentTag method={lastSale.paymentMethod} />
          </div>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="surface" onClick={onClose}>Cerrar</Button>
        {lastSale && onPrint && (
          <Button variant="gold" onClick={onPrint}>
            <Printer size={15} /> Imprimir comprobante
          </Button>
        )}
      </div>
    </Modal>
  )
}
