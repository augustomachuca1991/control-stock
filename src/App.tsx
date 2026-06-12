import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { SkeletonCard } from './components/ui/Skeleton'

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then((m) => ({ default: m.ResetPassword })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Products = lazy(() => import('./pages/Products').then((m) => ({ default: m.Products })))
const Sales = lazy(() => import('./pages/Sales').then((m) => ({ default: m.Sales })))
const Categories = lazy(() => import('./pages/Categories').then((m) => ({ default: m.Categories })))
const Purchases = lazy(() => import('./pages/Purchases').then((m) => ({ default: m.Purchases })))
const Invoices = lazy(() => import('./pages/Invoices').then((m) => ({ default: m.Invoices })))
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

function PageFallback() {
  return (
    <div className="p-6 space-y-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="sales" element={<Sales />} />
              <Route path="categories" element={<Categories />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
