import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoidConfirmModal } from './VoidConfirmModal'
import type { Sale } from '../../types'

const sale: Sale = {
  id: 'sale-abc123',
  items: [
    { productId: 'p1', productName: 'Lapicera Azul', quantity: 2, unitPrice: 150 },
    { productId: 'p2', productName: 'Cuaderno A4', quantity: 1, unitPrice: 300 },
  ],
  total: 600,
  paymentMethod: 'cash',
  status: 'active',
  createdAt: Date.now(),
}

function renderModal(props: Partial<Parameters<typeof VoidConfirmModal>[0]> = {}) {
  const onClose = vi.fn()
  const handleVoidSale = vi.fn()
  return {
    onClose,
    handleVoidSale,
    ...render(
      <VoidConfirmModal
        open={true}
        onClose={onClose}
        saleToVoid={sale}
        voiding={false}
        handleVoidSale={handleVoidSale}
        {...props}
      />
    ),
  }
}

describe('VoidConfirmModal', () => {
  it('renders sale items with quantities', () => {
    renderModal()
    expect(screen.getByText('Lapicera Azul')).toBeInTheDocument()
    expect(screen.getByText('Cuaderno A4')).toBeInTheDocument()
    expect(screen.getByText(/x2.*stock restaurado/)).toBeInTheDocument()
    expect(screen.getByText(/x1.*stock restaurado/)).toBeInTheDocument()
  })

  it('shows the sale id in the warning', () => {
    renderModal()
    expect(screen.getByText(/ABC123/)).toBeInTheDocument()
  })

  it('calls onClose when Cancelar is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls handleVoidSale when Confirmar is clicked', async () => {
    const user = userEvent.setup()
    const { handleVoidSale } = renderModal()
    await user.click(screen.getByRole('button', { name: /confirmar anulación/i }))
    expect(handleVoidSale).toHaveBeenCalledTimes(1)
  })

  it('disables confirm button when voiding', () => {
    renderModal({ voiding: true })
    expect(screen.getByRole('button', { name: /anulando/i })).toBeDisabled()
  })

  it('shows loading text when voiding', () => {
    renderModal({ voiding: true })
    expect(screen.getByText('Anulando...')).toBeInTheDocument()
  })

  it('renders nothing when saleToVoid is null', () => {
    render(
      <VoidConfirmModal
        open={true}
        onClose={vi.fn()}
        saleToVoid={null}
        voiding={false}
        handleVoidSale={vi.fn()}
      />
    )
    expect(screen.queryByText('Lapicera Azul')).not.toBeInTheDocument()
    // Modal backdrop is still rendered when open=true but content is empty
  })
})
