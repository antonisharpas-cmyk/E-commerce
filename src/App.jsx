import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Brands from './pages/Brands'
import Contact from './pages/Contact'
import Checkout from './pages/Checkout'
import OrderStatus from './pages/OrderStatus'
import { useI18n } from './lib/i18n'
import { btn } from './components/ui'

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, search])
  return null
}

function NotFound() {
  const { t } = useI18n()
  return (
    <div className="container-x flex flex-col items-center py-32 text-center">
      <p className="display text-[clamp(5rem,18vw,11rem)] leading-none text-brand">404</p>
      <p className="mt-4 text-[15px] text-muted">{t('p.notFound')}</p>
      <Link to="/" className={`${btn.primary} mt-7`}>
        {t('nav.home')}
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:ref" element={<OrderStatus />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}
