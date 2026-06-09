import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggle: () => void
}

const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null) as Theme | null
const initial = stored || 'dark'

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initial)
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initial,
  toggle: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return { theme: next }
    }),
}))
