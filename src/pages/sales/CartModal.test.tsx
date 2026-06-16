import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartModal } from './CartModal'
import type { CartItem } from '../../stores/useSaleStore'

vi.mock('../../config', () => ({
  config: {
    currency: { symbol: '$', code: 'ARS' },
  },
  applyThemeColors: () => {},
}))

const cartItems: CartItem[] = [
  {
    productId: 'p1',
    productName: 'Lapicera Azul',
    productDescription: 'Punta fina 0.7mm',
    quantity: 2,
    unitPrice: 150,
    maxStock: 50,
  },
  {
    productId: 'p2',
    productName: 'Cuaderno A4',
    productDescription: 'Rayado 96 hojas',
    quantity: 1,
    unitPrice: 300,
    maxStock: 20,
  },
]

function renderCart(props: Partial<Parameters<typeof CartModal>[0]> = {}) {
  const onClose = vi.fn()
  const setPreviewPaymentMethod = vi.fn()
  const setCashAmount = vi.fn()
  const setDiscountPercent = vi.fn()
  const updateCartQty = vi.fn()
  const removeFromCart = vi.fn()
  const onPreview = vi.fn()

  return {
    onClose,
    setPreviewPaymentMethod,
    setCashAmount,
    setDiscountPercent,
    updateCartQty,
    removeFromCart,
    onPreview,
    ...render(
      <CartModal
        open={true}
        onClose={onClose}
        cart={cartItems}
        cartSubtotal={600}
        discountPercent={0}
        setDiscountPercent={setDiscountPercent}
        finalTotal={600}
        previewPaymentMethod="cash"
        setPreviewPaymentMethod={setPreviewPaymentMethod}
        cashAmount=""
        setCashAmount={setCashAmount}
        cambio={0}
        faltante={0}
        updateCartQty={updateCartQty}
        removeFromCart={removeFromCart}
        onPreview={onPreview}
        {...props}
      />
    ),
  }
}

describe('CartModal', () => {
  it('renders cart items with name, description, and price', () => {
    renderCart()
    expect(screen.getByText('Lapicera Azul')).toBeInTheDocument()
    expect(screen.getByText('Punta fina 0.7mm')).toBeInTheDocument()
    expect(screen.getByText('Cuaderno A4')).toBeInTheDocument()
    expect(screen.getByText('Rayado 96 hojas')).toBeInTheDocument()
    expect(screen.getByText(/\$150\.00 c\/u/)).toBeInTheDocument()
    expect(screen.getByText(/\$300\.00 c\/u/)).toBeInTheDocument()
  })

  it('shows total', () => {
    renderCart()
    const totals = screen.getAllByText(/\$600\.00/)
    expect(totals.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty message when cart is empty', () => {
    renderCart({ cart: [], cartSubtotal: 0, finalTotal: 0 })
    expect(screen.getByText('El carrito está vacío')).toBeInTheDocument()
  })

  it('shows payment method select', () => {
    renderCart()
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select).toBeInTheDocument()
    expect(select.value).toBe('cash')
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
    expect(screen.getByText('Tarjeta')).toBeInTheDocument()
    expect(screen.getByText('Transferencia')).toBeInTheDocument()
  })

  it('calls setPreviewPaymentMethod on select change', async () => {
    const user = userEvent.setup()
    const { setPreviewPaymentMethod } = renderCart()
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'card')
    expect(setPreviewPaymentMethod).toHaveBeenCalledWith('card')
  })

  it('shows cash input when payment method is cash', () => {
    renderCart()
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
  })

  it('hides cash input when payment method is not cash', () => {
    renderCart({ previewPaymentMethod: 'card' })
    expect(screen.queryByPlaceholderText('0.00')).not.toBeInTheDocument()
  })

  it('shows faltante in red when cash amount < total', () => {
    renderCart({ cashAmount: '500', faltante: 100 })
    expect(screen.getByText('Faltante')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('shows vuelto when cash amount > total', () => {
    renderCart({ cashAmount: '700', cambio: 100, faltante: 0 })
    expect(screen.getByText('Vuelto')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('does not show faltante/vuelto when cashAmount is empty', () => {
    renderCart({ cashAmount: '' })
    expect(screen.queryByText('Faltante')).not.toBeInTheDocument()
    expect(screen.queryByText('Vuelto')).not.toBeInTheDocument()
  })

  it('calls onPreview when Previsualizar is clicked', async () => {
    const user = userEvent.setup()
    const { onPreview } = renderCart()
    await user.click(screen.getByRole('button', { name: /previsualizar/i }))
    expect(onPreview).toHaveBeenCalledTimes(1)
  })

  it('disables Previsualizar when cart is empty', () => {
    renderCart({ cart: [], cartSubtotal: 0, finalTotal: 0 })
    expect(screen.getByRole('button', { name: /previsualizar/i })).toBeDisabled()
  })

  it('calls onClose when Cerrar is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderCart()
    await user.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls updateCartQty with +1 when Plus is clicked', async () => {
    const user = userEvent.setup()
    const { updateCartQty } = renderCart()
    const buttons = screen.getAllByRole('button')
    const plus = buttons.find((b) => b.innerHTML.includes('lucide-plus'))
    await user.click(plus!)
    expect(updateCartQty).toHaveBeenCalledWith('p1', 1)
  })

  it('calls updateCartQty with -1 when Minus is clicked', async () => {
    const user = userEvent.setup()
    const { updateCartQty } = renderCart()
    const buttons = screen.getAllByRole('button')
    const minus = buttons.find((b) => b.innerHTML.includes('lucide-minus'))
    await user.click(minus!)
    expect(updateCartQty).toHaveBeenCalledWith('p1', -1)
  })

  it('calls removeFromCart when delete button is clicked', async () => {
    const user = userEvent.setup()
    const { removeFromCart } = renderCart()
    const buttons = screen.getAllByRole('button')
    const del = buttons.find((b) => b.innerHTML.includes('lucide-trash'))
    await user.click(del!)
    expect(removeFromCart).toHaveBeenCalledWith('p1')
  })

  it('calls setCashAmount on cash input change', async () => {
    const user = userEvent.setup()
    const { setCashAmount } = renderCart()
    const input = screen.getByPlaceholderText('0.00')
    await user.type(input, '500')
    expect(setCashAmount).toHaveBeenCalled()
  })
})
