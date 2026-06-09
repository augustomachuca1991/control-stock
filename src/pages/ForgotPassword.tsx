import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import MarelyLogo from '../components/ui/MarelyLogo'
import { useAuth } from '../contexts/AuthContext'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setLoading(true)
    const { error: err } = await resetPassword(email)
    setLoading(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 py-4">
          <MarelyLogo width={160} />

          {sent ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-dim">
                <Mail size={20} className="text-success-text" />
              </div>
              <p className="text-[13px] text-muted">
                Si existe una cuenta con <strong className="text-text">{email}</strong>,
                recibirás un enlace para restablecer tu contraseña.
              </p>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-[12px] text-primary-light hover:underline transition-colors"
              >
                <ArrowLeft size={13} /> Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <p className="text-[12px] text-muted text-center">
                Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <div className="w-full space-y-3">
                <Input
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={14} />}
                />
              </div>

              {error && (
                <p className="text-[12px] text-danger-text text-center">{error}</p>
              )}

              <Button variant="gold" className="w-full" type="submit" disabled={loading}>
                <Send size={15} /> {loading ? 'Enviando...' : 'Enviar enlace'}
              </Button>

              <Link
                to="/login"
                className="flex items-center gap-1.5 text-[12px] text-muted hover:text-primary-light transition-colors"
              >
                <ArrowLeft size={13} /> Volver al inicio de sesión
              </Link>
            </>
          )}
        </form>
      </Card>
    </div>
  )
}
