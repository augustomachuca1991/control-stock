import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, ArrowLeft, KeyRound } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import MarelyLogo from '../components/ui/MarelyLogo'
import { useAuth } from '../contexts/AuthContext'

export function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setError('')
    setLoading(true)
    const { error: err } = await updatePassword(password)
    setLoading(false)
    if (err) setError(err.message)
    else setDone(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 py-4">
          <MarelyLogo width={160} />

          {done ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-dim">
                <KeyRound size={20} className="text-success-text" />
              </div>
              <p className="text-[13px] text-muted">
                Tu contraseña se actualizó correctamente.
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
                Ingresá tu nueva contraseña.
              </p>

              <div className="w-full space-y-3">
                <Input
                  label="Nueva contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={14} />}
                />
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  icon={<Lock size={14} />}
                  error={confirm && password !== confirm ? 'Las contraseñas no coinciden' : undefined}
                />
              </div>

              {error && (
                <p className="text-[12px] text-danger-text text-center">{error}</p>
              )}

              <Button variant="gold" className="w-full" type="submit" disabled={loading}>
                <KeyRound size={15} /> {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
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
