import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '../../contexts/AuthContext'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login', { replace: true })
  }, [loading, isAuthenticated, navigate])

  if (loading || !isAuthenticated) return null

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex h-screen flex-1 flex-col min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto bg-bg p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}