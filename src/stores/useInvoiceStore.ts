import { create } from 'zustand'
import type { Invoice } from '../types'

interface InvoiceState {
  invoices: Invoice[]
  addInvoice: (invoice: Invoice) => void
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoices: [],
  addInvoice: (invoice) =>
    set((state) => ({
      invoices: [invoice, ...state.invoices],
    })),
}))
