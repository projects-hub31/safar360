import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/app/AppContext.jsx'
import { AuthProvider } from './context/auth/AuthContext.jsx'
import { BookingProvider } from './context/booking/BookingContext.jsx'
import { VendorProvider } from './context/vendor/VendorContext.jsx'
import { TransportProvider } from './context/transport/TransportContext.jsx'
import { ShopProvider } from './context/shop/ShopContext.jsx'
import { SocialProvider } from './context/social/SocialContext.jsx'
import { AiProvider } from './context/ai/AiContext.jsx'
import { AdminProvider } from './context/admin/AdminContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AppProvider>
        <AuthProvider>
          <BookingProvider>
            <VendorProvider>
              <TransportProvider>
                <ShopProvider>
                  <SocialProvider>
                    {/* AiProvider reads useBooking() (live seats, bookings) internally
                        for the planner/itinerary/chatbot, so it must nest under
                        BookingProvider — see AiContext.jsx. */}
                    <AiProvider>
                      {/* AdminProvider reads useVendor() internally (reverseLedger, on
                          the one seeded row that links to a real vendor ledger row) —
                          nests innermost, after every context it might ever need. */}
                      <AdminProvider>
                        <App />
                      </AdminProvider>
                    </AiProvider>
                  </SocialProvider>
                </ShopProvider>
              </TransportProvider>
            </VendorProvider>
          </BookingProvider>
        </AuthProvider>
      </AppProvider>
    </HashRouter>
  </StrictMode>,
)
