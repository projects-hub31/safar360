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
import { ShopProvider } from './context/ShopContext.jsx'
import { SocialProvider } from './context/SocialContext.jsx'
import { AiProvider } from './context/AiContext.jsx'

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
                      <App />
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
