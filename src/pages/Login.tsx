import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Formik, Form } from 'formik'
import { Mail, Lock, LogIn } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import MarelyLogo from '../components/ui/MarelyLogo'
import { useAuth } from '../contexts/AuthContext'
import { loginSchema } from '../lib/validation'

export function Login() {
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm">
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setError('')
            const { error: err } = await signIn(values.email, values.password)
            setSubmitting(false)
            if (err) setError(err.message)
            else navigate('/')
          }}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col items-center gap-6 py-4">
              <MarelyLogo width={160} />

              <div className="w-full space-y-3">
                <Field name="email" label="Email" type="email" placeholder="tu@email.com" icon={<Mail size={14} />} />
                <Field name="password" label="Contraseña" type="password" placeholder="••••••••" icon={<Lock size={14} />} />
              </div>

              {error && <p className="text-[12px] text-danger-text text-center">{error}</p>}

              <Button variant="gold" className="w-full" type="submit" disabled={isSubmitting}>
                <LogIn size={15} /> {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
              </Button>

              <Link to="/forgot-password" className="text-[12px] text-muted hover:text-primary-light transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  )
}
