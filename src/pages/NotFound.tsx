import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-4">
      <h1 className="text-6xl font-bold text-accent">404</h1>
      <p className="mt-2 text-[15px] text-muted">Página no encontrada</p>
      <p className="mt-1 text-[12px] text-muted-light">La ruta que buscás no existe o fue movida.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-dark"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
