import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Formik, Form } from 'formik'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import MarelyLogo from '../components/ui/MarelyLogo'
import { useAuth } from '../contexts/AuthContext'
import { forgotPasswordSchema } from '../lib/validation'

export function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm">
        {sent ? (
          <div className="flex flex-col items-center gap-6 py-4">
            <MarelyLogo width={160} />
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-dim">
                <Mail size={20} className="text-success-text" />
              </div>
              <p className="text-[13px] text-muted">
                Si existe una cuenta con <strong className="text-text">{sentEmail}</strong>,
                recibirás un enlace para restablecer tu contraseña.
              </p>
              <Link to="/login" className="flex items-center gap-1.5 text-[12px] text-primary-light hover:underline transition-colors">
                <ArrowLeft size={13} /> Volver al inicio de sesión
              </Link>
            </div>
          </div>
        ) : (
          <Formik
            initialValues={{ email: '' }}
            validationSchema={forgotPasswordSchema}
            onSubmit={async (values, { setSubmitting }) => {
              setError('')
              const { error: err } = await resetPassword(values.email)
              setSubmitting(false)
              if (err) setError(err.message)
              else { setSentEmail(values.email); setSent(true) }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="flex flex-col items-center gap-6 py-4">
                <MarelyLogo width={160} />
                <p className="text-[12px] text-muted text-center">
                  Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                <div className="w-full space-y-3">
                  <Field name="email" label="Email" type="email" placeholder="tu@email.com" icon={<Mail size={14} />} />
                </div>

                {error && <p className="text-[12px] text-danger-text text-center">{error}</p>}

                <Button variant="gold" className="w-full" type="submit" disabled={isSubmitting}>
                  <Send size={15} /> {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
                </Button>

                <Link to="/login" className="flex items-center gap-1.5 text-[12px] text-muted hover:text-primary-light transition-colors">
                  <ArrowLeft size={13} /> Volver al inicio de sesión
                </Link>
              </Form>
            )}
          </Formik>
        )}
      </Card>
    </div>
  )
}
