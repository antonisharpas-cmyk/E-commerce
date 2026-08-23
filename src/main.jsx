import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
/* HashRouter is deliberate: it means `npm run build` produces a dist/ folder
   you can open by double-clicking index.html — no server needed on the day of
   the pitch. Swap to BrowserRouter when the site goes on a real host. */
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { LanguageProvider } from './lib/i18n.jsx'
import { CartProvider } from './lib/cart.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <CartProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </CartProvider>
    </LanguageProvider>
  </StrictMode>,
)
