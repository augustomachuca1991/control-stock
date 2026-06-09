import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { applyThemeColors } from './config'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'

applyThemeColors()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
