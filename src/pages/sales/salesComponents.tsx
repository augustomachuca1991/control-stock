import type { PaymentMethod, SaleStatus } from '../../types'

export const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

export function StatusBadge({ status }: { status: SaleStatus }) {
  if (status === 'voided')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger-dim px-2 py-0.5 text-[11px] font-medium text-danger-text">
        <span className="h-1.5 w-1.5 rounded-full bg-danger-text" />
        Anulada
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-dim px-2 py-0.5 text-[11px] font-medium text-success-text">
      <span className="h-1.5 w-1.5 rounded-full bg-success-text" />
      Activa
    </span>
  )
}

export function PaymentTag({ method }: { method: PaymentMethod }) {
  const styles: Record<PaymentMethod, string> = {
    cash: 'bg-success-dim text-success-text',
    card: 'bg-primary-dim text-primary-text',
    transfer: 'bg-warning-dim text-warning-text',
  }
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${styles[method]}`}>
      {paymentLabels[method]}
    </span>
  )
}
