import type { PaymentMethod } from '../../types'
import type { CartItem } from '../../stores/useSaleStore'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { PaymentTag } from './salesComponents'
import MarelyLogo from '../../components/ui/MarelyLogo'
import { config } from '../../config'

interface PreviewModalProps {
  open: boolean
  onClose: () => void
  cart: CartItem[]
  cartTotal: number
  previewPaymentMethod: PaymentMethod
  confirming: boolean
  handleConfirmSale: () => void
}

export function PreviewModal({
  open, onClose, cart, cartTotal,
  previewPaymentMethod, confirming, handleConfirmSale,
}: PreviewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Previsualizar Venta" size="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--clr-border)' }}>
          <MarelyLogo width={180} />
          <div className="text-right">
            <p className="text-[12px]" style={{ color: 'var(--clr-muted)' }}>Comprobante de venta</p>
            <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>{new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
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
            {cart.map((item) => (
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
          <div className="flex w-56 items-center justify-between text-[15px] font-bold">
            <span style={{ color: 'var(--clr-text)' }}>Total</span>
            <span style={{ color: 'var(--clr-accent)' }}>{config.currency.symbol}{cartTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-[12px]" style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}>
          <span style={{ color: 'var(--clr-muted)' }}>Método de pago</span>
          <PaymentTag method={previewPaymentMethod} />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="gold-outline" onClick={onClose}>Volver</Button>
        <Button variant="gold" onClick={handleConfirmSale} disabled={confirming}>
          {confirming ? 'Procesando...' : 'Confirmar y emitir comprobante'}
        </Button>
      </div>
    </Modal>
  )
}
