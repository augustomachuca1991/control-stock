import type { Category, Product, Sale } from '../types'

export const categories: Category[] = [
  { id: 'cat-1', name: 'Lapiceras', description: 'Lapiceras, bolígrafos y plumas' },
  { id: 'cat-2', name: 'Cuadernos', description: 'Cuadernos, blocks y carpetas' },
  { id: 'cat-3', name: 'Útiles Escolares', description: 'Gomas, reglas, tijeras y más' },
  { id: 'cat-4', name: 'Álbumes', description: 'Álbumes de figuritas y fotos' },
  { id: 'cat-5', name: 'Papelería', description: 'Hojas, sobres y artículos de papel' },
]

const now = Date.now()
const day = 86400000

export const products: Product[] = [
  { id: 'prod-1', name: 'Lapicera Bic Azul', brand: 'Bic', barcode: '7791234567891', categoryId: 'cat-1', price: 850, cost: 500, stock: 200, minStock: 50, description: 'Lapicera clásica tinta azul punta fina.', createdAt: now - 90 * day, updatedAt: now - 10 * day },
  { id: 'prod-2', name: 'Lapicera Bic Roja', brand: 'Bic', barcode: '7791234567892', categoryId: 'cat-1', price: 850, cost: 500, stock: 180, minStock: 50, description: 'Lapicera clásica tinta roja punta fina.', createdAt: now - 85 * day, updatedAt: now - 15 * day },
  { id: 'prod-3', name: 'Lapicera Bic Negra', brand: 'Bic', barcode: '7791234567893', categoryId: 'cat-1', price: 850, cost: 500, stock: 220, minStock: 50, description: 'Lapicera clásica tinta negra punta fina.', createdAt: now - 80 * day, updatedAt: now - 20 * day },
  { id: 'prod-4', name: 'Lapicera Pilot Azul', brand: 'Pilot', barcode: '7791234567894', categoryId: 'cat-1', price: 1200, cost: 700, stock: 150, minStock: 30, description: 'Lapicera Pilot de tinta gel azul.', createdAt: now - 75 * day, updatedAt: now - 5 * day },
  { id: 'prod-5', name: 'Marcador Sharpie Negro', brand: 'Sharpie', barcode: '7791234567895', categoryId: 'cat-1', price: 1500, cost: 900, stock: 3, minStock: 20, description: 'Marcador permanente punta gruesa negro.', createdAt: now - 70 * day, updatedAt: now - 25 * day },
  { id: 'prod-6', name: 'Cuaderno Rivadavia Rayado A4', brand: 'Rivadavia', barcode: '7791234567896', categoryId: 'cat-2', price: 3200, cost: 2000, stock: 60, minStock: 15, description: 'Cuaderno tapa dura A4 96 hojas rayado.', createdAt: now - 65 * day, updatedAt: now - 30 * day },
  { id: 'prod-7', name: 'Cuaderno Rivadavia Cuadriculado A4', brand: 'Rivadavia', barcode: '7791234567897', categoryId: 'cat-2', price: 3200, cost: 2000, stock: 2, minStock: 15, description: 'Cuaderno tapa dura A4 96 hojas cuadriculado.', createdAt: now - 60 * day, updatedAt: now - 12 * day },
  { id: 'prod-8', name: 'Cuaderno Gloria Espiral A5', brand: 'Gloria', barcode: '7791234567898', categoryId: 'cat-2', price: 1800, cost: 1100, stock: 90, minStock: 20, description: 'Cuaderno espiral A5 80 hojas rayado.', createdAt: now - 55 * day, updatedAt: now - 8 * day },
  { id: 'prod-9', name: 'Block de Hojas A4', brand: 'Rivadavia', barcode: '7791234567899', categoryId: 'cat-5', price: 2500, cost: 1500, stock: 40, minStock: 10, description: 'Block de 500 hojas rayadas A4.', createdAt: now - 50 * day, updatedAt: now - 18 * day },
  { id: 'prod-10', name: 'Goma de Borrar Fantasma', brand: 'Fantasma', barcode: '7791234567800', categoryId: 'cat-3', price: 400, cost: 200, stock: 300, minStock: 80, description: 'Goma de borrar blanca para lápiz.', createdAt: now - 45 * day, updatedAt: now - 22 * day },
  { id: 'prod-11', name: 'Regla Plástica 30cm', brand: 'Maped', barcode: '7791234567801', categoryId: 'cat-3', price: 600, cost: 350, stock: 120, minStock: 30, description: 'Regla plástica transparente de 30cm.', createdAt: now - 40 * day, updatedAt: now - 3 * day },
  { id: 'prod-12', name: 'Tijera Escolar Punta Roma', brand: 'Maped', barcode: '7791234567802', categoryId: 'cat-3', price: 1100, cost: 650, stock: 5, minStock: 15, description: 'Tijera escolar con punta roma.', createdAt: now - 35 * day, updatedAt: now - 14 * day },
  { id: 'prod-13', name: 'Álbum de Figuritas Mundial', brand: 'Panini', barcode: '7791234567803', categoryId: 'cat-4', price: 3500, cost: 2200, stock: 25, minStock: 8, description: 'Álbum oficial de figuritas del Mundial.', createdAt: now - 30 * day, updatedAt: now - 7 * day },
  { id: 'prod-14', name: 'Álbum de Fotos 3x4', brand: 'Genérico', barcode: '7791234567804', categoryId: 'cat-4', price: 2800, cost: 1700, stock: 18, minStock: 5, description: 'Álbum para fotos tamaño 3x4 con fundas.', createdAt: now - 25 * day, updatedAt: now - 9 * day },
  { id: 'prod-15', name: 'Lápiz HB Faber-Castell', brand: 'Faber-Castell', barcode: '7791234567805', categoryId: 'cat-3', price: 500, cost: 250, stock: 4, minStock: 40, description: 'Lápiz grafito HB amarillo.', createdAt: now - 20 * day, updatedAt: now - 11 * day },
  { id: 'prod-16', name: 'Sacapuntas Metálico', brand: 'Maped', barcode: '7791234567806', categoryId: 'cat-3', price: 700, cost: 400, stock: 80, minStock: 20, description: 'Sacapuntas metálico con depósito.', createdAt: now - 18 * day, updatedAt: now - 6 * day },
  { id: 'prod-17', name: 'Carpeta PVC A4', brand: 'Rivadavia', barcode: '7791234567807', categoryId: 'cat-2', price: 2200, cost: 1300, stock: 45, minStock: 12, description: 'Carpeta PVC tamaño A4 con solapa.', createdAt: now - 15 * day, updatedAt: now - 4 * day },
  { id: 'prod-18', name: 'Correcto Líquido', brand: 'Maped', barcode: '7791234567808', categoryId: 'cat-3', price: 900, cost: 500, stock: 65, minStock: 15, description: 'Correcto líquido 20ml con pincel.', createdAt: now - 12 * day, updatedAt: now - 2 * day },
]

export const sales: Sale[] = [
  {
    id: 'sale-1',
    items: [
      { productId: 'prod-1', productName: 'Lapicera Bic Azul', quantity: 10, unitPrice: 850 },
      { productId: 'prod-2', productName: 'Lapicera Bic Roja', quantity: 5, unitPrice: 850 },
    ],
    total: 12750,
    paymentMethod: 'card',
    createdAt: now - 2 * day,
  },
  {
    id: 'sale-2',
    items: [
      { productId: 'prod-6', productName: 'Cuaderno Rivadavia Rayado A4', quantity: 3, unitPrice: 3200 },
    ],
    total: 9600,
    paymentMethod: 'cash',
    createdAt: now - 3 * day,
  },
  {
    id: 'sale-3',
    items: [
      { productId: 'prod-10', productName: 'Goma de Borrar Fantasma', quantity: 20, unitPrice: 400 },
      { productId: 'prod-11', productName: 'Regla Plástica 30cm', quantity: 10, unitPrice: 600 },
      { productId: 'prod-16', productName: 'Sacapuntas Metálico', quantity: 15, unitPrice: 700 },
    ],
    total: 24500,
    paymentMethod: 'transfer',
    createdAt: now - 5 * day,
  },
  {
    id: 'sale-4',
    items: [
      { productId: 'prod-13', productName: 'Álbum de Figuritas Mundial', quantity: 2, unitPrice: 3500 },
      { productId: 'prod-14', productName: 'Álbum de Fotos 3x4', quantity: 1, unitPrice: 2800 },
    ],
    total: 9800,
    paymentMethod: 'cash',
    createdAt: now - 7 * day,
  },
  {
    id: 'sale-5',
    items: [
      { productId: 'prod-4', productName: 'Lapicera Pilot Azul', quantity: 8, unitPrice: 1200 },
      { productId: 'prod-9', productName: 'Block de Hojas A4', quantity: 2, unitPrice: 2500 },
    ],
    total: 14600,
    paymentMethod: 'card',
    createdAt: now - 10 * day,
  },
  {
    id: 'sale-6',
    items: [
      { productId: 'prod-8', productName: 'Cuaderno Gloria Espiral A5', quantity: 5, unitPrice: 1800 },
      { productId: 'prod-15', productName: 'Lápiz HB Faber-Castell', quantity: 12, unitPrice: 500 },
    ],
    total: 15000,
    paymentMethod: 'card',
    createdAt: now - 12 * day,
  },
  {
    id: 'sale-7',
    items: [
      { productId: 'prod-18', productName: 'Correcto Líquido', quantity: 10, unitPrice: 900 },
      { productId: 'prod-3', productName: 'Lapicera Bic Negra', quantity: 15, unitPrice: 850 },
    ],
    total: 21750,
    paymentMethod: 'transfer',
    createdAt: now - 15 * day,
  },
  {
    id: 'sale-8',
    items: [
      { productId: 'prod-17', productName: 'Carpeta PVC A4', quantity: 3, unitPrice: 2200 },
      { productId: 'prod-12', productName: 'Tijera Escolar Punta Roma', quantity: 4, unitPrice: 1100 },
      { productId: 'prod-5', productName: 'Marcador Sharpie Negro', quantity: 6, unitPrice: 1500 },
    ],
    total: 20000,
    paymentMethod: 'cash',
    createdAt: now - 18 * day,
  },
]
