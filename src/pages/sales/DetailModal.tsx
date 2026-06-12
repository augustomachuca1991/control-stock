import { Package } from 'lucide-react'
import type { Sale, Product } from '../../types'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Img } from '../../components/ui/Img'
import { StatusBadge, PaymentTag } from './salesComponents'
import MarelyLogo from '../../components/ui/MarelyLogo'
import { config } from '../../config'

interface DetailModalProps {
  open: boolean
  onClose: () => void
  detailSale: Sale | null
  sellerName: string | null
  getProductById: (id: string) => Product | undefined
  exportToCSV: () => void
  exportToPDF: () => void
}

export function DetailModal({
  open, onClose, detailSale, sellerName,
  getProductById, exportToCSV, exportToPDF,
}: DetailModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Detalle de Venta" size="lg">
      {detailSale && (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--clr-border)' }}>
            <div className="flex items-center gap-3">
              <MarelyLogo iconOnly width={36} />
              <div>
                <h3 className="text-[15px] font-bold" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--clr-text)' }}>{config.storeName}</h3>
                <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>Comprobante de Venta</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>#{detailSale.id.slice(-8).toUpperCase()}</p>
              <p className="text-[11px]" style={{ color: 'var(--clr-muted)' }}>
                {new Date(detailSale.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'var(--clr-border)' }}>
                <th className="pb-2 pr-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}></th>
                <th className="pb-2 pr-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Producto</th>
                <th className="pb-2 pr-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Precio</th>
                <th className="pb-2 pr-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Cant.</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {detailSale.items.map((item) => {
                const product = getProductById(item.productId)
                const img = product?.images?.[0]
                return (
                  <tr key={item.productId} className="border-b" style={{ borderColor: 'var(--clr-border-subtle)' }}>
                    <td className="py-2 pr-2">
                      <div className="h-10 w-10 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--clr-border)' }}>
                        {img ? (
                          <Img src={img} alt="" className="h-full w-full object-cover" skeleton="rounded-lg" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--clr-surface)' }}>
                            <Package size={14} style={{ color: 'var(--clr-muted)' }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-2" style={{ color: 'var(--clr-text)' }}>
                      <p className="font-medium">{item.productName}</p>
                      {product?.description && <p className="text-[10px] text-muted mt-0.5 leading-snug">{product.description}</p>}
                      {product?.barcode && <code className="text-[10px]" style={{ color: 'var(--clr-muted)' }}>{product.barcode}</code>}
                    </td>
                    <td className="py-2 pr-2 text-right" style={{ color: 'var(--clr-muted-light)' }}>{config.currency.symbol}{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 pr-2 text-right" style={{ color: 'var(--clr-muted-light)' }}>{item.quantity}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: 'var(--clr-text)' }}>{config.currency.symbol}{(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex flex-col items-end gap-1 border-t pt-3" style={{ borderColor: 'var(--clr-border)' }}>
            <div className="flex w-56 items-center justify-between text-[15px] font-bold">
              <span style={{ color: 'var(--clr-text)' }}>Total</span>
              <span style={{ color: 'var(--clr-accent)' }}>{config.currency.symbol}{detailSale.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-[12px]" style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Método de pago</span>
                <div className="mt-1"><PaymentTag method={detailSale.paymentMethod} /></div>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Estado</span>
                <div className="mt-1"><StatusBadge status={detailSale.status} /></div>
              </div>
            </div>
            {detailSale.userId && (
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>Vendedor</span>
                <p className="mt-0.5 text-[12px] font-medium" style={{ color: 'var(--clr-text)' }}>{sellerName || 'Cargando...'}</p>
              </div>
            )}
          </div>

          <p className="text-[10px] text-center" style={{ color: 'var(--clr-muted)' }}>
            {detailSale.items.length} producto{detailSale.items.length !== 1 ? 's' : ''} en esta venta
          </p>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="surface" onClick={onClose}>Cerrar</Button>
        <Button variant="gold-outline" size="sm" onClick={exportToCSV}>ExportarCSV</Button>
        <Button variant="gold" size="sm" onClick={exportToPDF}>Exportar PDF</Button>
      </div>
    </Modal>
  )
}
