import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { BookingProvider } from './context/BookingContext.jsx'
import { VendorProvider } from './context/VendorContext.jsx'
import { TransportProvider } from './context/TransportContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AppProvider>
        <AuthProvider>
          <BookingProvider>
            <VendorProvider>
              <TransportProvider>
                <App />
              </TransportProvider>
            </VendorProvider>
          </BookingProvider>
        </AuthProvider>
      </AppProvider>
    </HashRouter>
  </StrictMode>,
)
