import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { applyThemeColors } from './config'
import { AuthProvider } from './contexts/AuthContext'
import { OfflineProvider } from './contexts/OfflineProvider'
import App from './App'

applyThemeColors()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <OfflineProvider>
        <App />
      </OfflineProvider>
    </AuthProvider>
  </StrictMode>,
)
