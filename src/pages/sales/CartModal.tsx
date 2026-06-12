import { Minus, Plus, Trash2, DollarSign } from 'lucide-react'
import type { PaymentMethod } from '../../types'
import type { CartItem } from '../../stores/useSaleStore'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { config } from '../../config'

interface CartModalProps {
  open: boolean
  onClose: () => void
  cart: CartItem[]
  cartTotal: number
  previewPaymentMethod: PaymentMethod
  setPreviewPaymentMethod: (v: PaymentMethod) => void
  cashAmount: string
  setCashAmount: (v: string) => void
  cambio: number
  faltante: number
  updateCartQty: (productId: string, delta: number) => void
  removeFromCart: (productId: string) => void
  onPreview: () => void
}

export function CartModal({
  open, onClose, cart, cartTotal,
  previewPaymentMethod, setPreviewPaymentMethod,
  cashAmount, setCashAmount,
  cambio, faltante,
  updateCartQty, removeFromCart, onPreview,
}: CartModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Carrito" size="lg">
      <div className="space-y-4">
        {cart.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between border-b pb-2.5 last:border-0"
            style={{ borderColor: 'var(--clr-border-subtle)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium" style={{ color: 'var(--clr-text)' }}>{item.productName}</p>
              {item.productDescription && <p className="text-[11px] text-muted mt-0.5 leading-snug">{item.productDescription}</p>}
              <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>{config.currency.symbol}{item.unitPrice.toFixed(2)} c/u</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="gold-outline" size="sm" type="button" onClick={() => updateCartQty(item.productId, -1)}><Minus size={14} /></Button>
              <span className="w-8 text-center text-[13px] font-medium" style={{ color: 'var(--clr-text)' }}>{item.quantity}</span>
              <Button variant="gold" size="sm" type="button" onClick={() => updateCartQty(item.productId, 1)}><Plus size={14} /></Button>
              <Button variant="surface" size="sm" type="button" onClick={() => removeFromCart(item.productId)}><Trash2 size={14} style={{ color: 'var(--clr-danger-text)' }} /></Button>
            </div>
          </div>
        ))}

        {cart.length === 0 && (
          <p className="text-center text-[13px] text-muted py-4">El carrito está vacío</p>
        )}

        <div
          className="flex items-center justify-between border-t pt-3"
          style={{ borderColor: 'var(--clr-border)' }}
        >
          <span className="text-[13px] font-semibold" style={{ color: 'var(--clr-text)' }}>Total</span>
          <span className="text-[18px] font-bold" style={{ color: 'var(--clr-accent)' }}>{config.currency.symbol}{cartTotal.toFixed(2)}</span>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted block mb-1">
            Método de Pago
          </label>
          <select
            value={previewPaymentMethod}
            onChange={(e) => setPreviewPaymentMethod(e.target.value as PaymentMethod)}
            className="h-9 w-full appearance-none rounded-lg border border-border bg-surface px-3 text-[13px] text-text transition-colors focus:border-border-strong focus:outline-none"
          >
            <option value="cash" className="bg-card text-text">Efectivo</option>
            <option value="card" className="bg-card text-text">Tarjeta</option>
            <option value="transfer" className="bg-card text-text">Transferencia</option>
          </select>
        </div>

        {previewPaymentMethod === 'cash' && (
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted block mb-1">
              Importe recibido
            </label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-3 text-[13px] text-text placeholder:text-muted transition-colors focus:border-border-strong focus:outline-none"
              />
            </div>
            {cashAmount && parseFloat(cashAmount) > 0 && (
              <div
                className="flex items-center justify-between mt-2 px-3 py-2 rounded-lg border"
                style={{
                  borderColor: faltante > 0 ? 'var(--clr-danger)' : cambio > 0 ? 'var(--clr-success)' : 'var(--clr-border)',
                  background: faltante > 0 ? 'var(--clr-danger-dim)' : cambio > 0 ? 'var(--clr-success-dim)' : 'transparent',
                }}
              >
                {faltante > 0 ? (
                  <>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--clr-danger-text)' }}>Faltante</span>
                    <span className="text-[15px] font-bold" style={{ color: 'var(--clr-danger-text)' }}>
                      {config.currency.symbol}{faltante.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--clr-text)' }}>Vuelto</span>
                    <span className="text-[15px] font-bold" style={{ color: cambio > 0 ? 'var(--clr-success-text)' : 'var(--clr-text)' }}>
                      {config.currency.symbol}{cambio.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="surface" type="button" onClick={onClose}>Cerrar</Button>
        <Button type="button" onClick={onPreview} disabled={cart.length === 0}>
          Previsualizar ({config.currency.symbol}{cartTotal.toFixed(2)})
        </Button>
      </div>
    </Modal>
  )
}
