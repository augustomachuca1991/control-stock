import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, LogIn } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import MarelyLogo from '../components/ui/MarelyLogo'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 py-4">
          <MarelyLogo width={160} />

          <div className="w-full space-y-3">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={14} />}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={14} />}
            />
          </div>

          <Button variant="gold" className="w-full" type="submit">
            <LogIn size={15} /> Iniciar Sesión
          </Button>

          <Link
            to="/forgot-password"
            className="text-[12px] text-muted hover:text-primary-light transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </form>
      </Card>
    </div>
  )
}
