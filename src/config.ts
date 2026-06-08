export const config = {
  storeName: import.meta.env.VITE_STORE_NAME || 'Librería y Papelería',
  currency: {
    symbol: import.meta.env.VITE_CURRENCY_SYMBOL || '$',
    code: import.meta.env.VITE_CURRENCY_CODE || 'ARS',
  },
  colors: {
    primary: import.meta.env.VITE_PRIMARY_COLOR || '#4f46e5',
    primaryDark: import.meta.env.VITE_PRIMARY_DARK || '#4338ca',
    primaryLight: import.meta.env.VITE_PRIMARY_LIGHT || '#818cf8',
    primary50: import.meta.env.VITE_PRIMARY_50 || '#eef2ff',
    accent: import.meta.env.VITE_ACCENT_COLOR || '#f59e0b',
    accentDark: import.meta.env.VITE_ACCENT_DARK || '#d97706',
    success: import.meta.env.VITE_SUCCESS_COLOR || '#10b981',
    danger: import.meta.env.VITE_DANGER_COLOR || '#ef4444',
    warning: import.meta.env.VITE_WARNING_COLOR || '#f59e0b',
  },
}

export function applyThemeColors() {
  const root = document.documentElement
  const c = config.colors
  root.style.setProperty('--color-primary', c.primary)
  root.style.setProperty('--color-primary-dark', c.primaryDark)
  root.style.setProperty('--color-primary-light', c.primaryLight)
  root.style.setProperty('--color-primary-50', c.primary50)
  root.style.setProperty('--color-accent', c.accent)
  root.style.setProperty('--color-accent-dark', c.accentDark)
  root.style.setProperty('--color-success', c.success)
  root.style.setProperty('--color-danger', c.danger)
  root.style.setProperty('--color-warning', c.warning)
}
