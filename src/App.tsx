import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './app/LanguageContext';
import { CartProvider } from './app/CartContext';
import { ToastProvider } from './app/ToastContext';
import { Header, Footer } from './components/Layout';
import { DemoBanner } from './components/DemoBanner';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { DressDetails } from './pages/DressDetails';
import { Cart, Checkout } from './pages/Shop';
import { About, Contact, Faq, NotFound, Policies } from './pages/Static';
import { Favorites } from './pages/Favorites';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminLogin, AdminShell, RequireAdmin } from './pages/admin/Auth';
import { AdminOverview } from './pages/admin/Overview';
import { AdminDresses } from './pages/admin/Dresses';
import { AdminBookings, AdminOrders, AdminCustomers, AdminSettings, AdminReports } from './pages/admin/Manage';
import { useToast } from './app/ToastContext';

function Toasts() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {toasts.map((t) => (
        <button key={t.id} onClick={() => dismiss(t.id)}
          className={`max-w-md w-full text-sm rounded-2xl px-4 py-3 shadow-lg border ${t.kind === 'success' ? 'bg-green-50 border-green-300 text-green-900' : t.kind === 'error' ? 'bg-red-50 border-red-300 text-red-900' : 'bg-white border-champagne text-cocoa'}`}>
          {t.message}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <CartProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col">
              <DemoBanner />
              <Header />
              <div className="flex-1">
                <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/dress/:code" element={<DressDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/policies" element={<Policies />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<RequireAdmin><AdminShell /></RequireAdmin>}>
                    <Route index element={<AdminOverview />} />
                    <Route path="dresses" element={<AdminDresses />} />
                    <Route path="bookings" element={<AdminBookings />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </ErrorBoundary>
              </div>
              <Footer />
            </div>
            <Toasts />
          </ToastProvider>
        </CartProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
