import * as yup from 'yup'

// ── Reutilizables ────────────────────────────────────
export const email = yup.string().email('Email inválido').required('Requerido')
export const password = yup.string().min(6, 'Mínimo 6 caracteres').required('Requerido')
export const requiredString = yup.string().required('Requerido')
export const positiveNumber = yup
  .number()
  .typeError('Debe ser un número')
  .moreThan(0, 'Debe ser mayor a 0')
  .required('Requerido')
export const positiveInt = yup
  .number()
  .typeError('Debe ser un número')
  .integer('Debe ser un número entero')
  .moreThan(0, 'Debe ser mayor a 0')
  .required('Requerido')

// ── Auth ─────────────────────────────────────────────
export const loginSchema = yup.object({ email, password })

export const forgotPasswordSchema = yup.object({ email })

export const resetPasswordSchema = yup.object({
  password,
  confirm: yup.string()
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Requerido'),
})

// ── Productos ────────────────────────────────────────
export const productSchema = yup.object({
  name: requiredString,
  brand: requiredString,
  barcode: yup.string(),
  categoryId: yup.string().required('Seleccioná una categoría'),
  price: yup.number().typeError('Debe ser un número').min(0, 'Mínimo 0').required('Requerido'),
  cost: yup.number().typeError('Debe ser un número').min(0, 'Mínimo 0').required('Requerido'),
  stock: yup.number().typeError('Debe ser un número').integer('Entero').min(0, 'Mínimo 0').required('Requerido'),
  minStock: yup.number().typeError('Debe ser un número').integer('Entero').min(0, 'Mínimo 0').required('Requerido'),
})

// ── Categorías ───────────────────────────────────────
export const categorySchema = yup.object({
  name: requiredString,
  description: yup.string(),
})

// ── Ventas ───────────────────────────────────────────
export const saleSchema = yup.object({
  paymentMethod: yup
    .string()
    .oneOf(['cash', 'card', 'transfer'], 'Seleccioná un método de pago')
    .required('Requerido'),
})

// ── Compras (cada entrada del ingreso) ──────────────
export const purchaseEntrySchema = yup.object({
  productId: yup.string(),
  newName: yup.string().when('createNewMode', {
    is: true,
    then: (s) => s.required('Requerido'),
    otherwise: (s) => s.notRequired(),
  }),
  newBarcode: yup.string(),
  newBrand: yup.string(),
  newCategoryId: yup.string(),
  newDescription: yup.string(),
  cost: yup
    .number()
    .typeError('Debe ser un número')
    .moreThan(0, 'Debe ser mayor a 0')
    .required('Requerido'),
  quantity: yup
    .number()
    .typeError('Debe ser un número')
    .integer('Debe ser entero')
    .moreThan(0, 'Debe ser mayor a 0')
    .required('Requerido'),
  createNewMode: yup.boolean(),
})

// ── Perfil ───────────────────────────────────────────
export const profileSchema = yup.object({
  full_name: yup.string().min(2, 'Mínimo 2 caracteres'),
  phone: yup
    .string()
    .matches(/^[\d\s\-+()]*$/, 'Formato inválido (solo números, espacios, +, -, ())'),
})
