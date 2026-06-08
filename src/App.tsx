import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Sales } from './pages/Sales'
import { Categories } from './pages/Categories'
import { Purchases } from './pages/Purchases'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="sales" element={<Sales />} />
          <Route path="categories" element={<Categories />} />
          <Route path="purchases" element={<Purchases />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
