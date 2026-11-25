import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LandingPage from './pages/LandingPage'
import OrderPage from './pages/OrderPage'
import LoginPage from './pages/LoginPage'
import PosPage from './pages/PosPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import OwnerDashboardPage from './pages/OwnerDashboardPage'
import ManageUsersPage from './pages/ManageUsersPage'
import ManagePromosPage from './pages/ManagePromosPage'
import { getStoredUser } from './lib/api'

// Guard: Khusus Owner (Kasir dilarang dan otomatis dialihkan ke /admin/pos)
function OwnerRoute({ children }) {
  const user = getStoredUser()
  if (user?.role === 'kasir') {
    return <Navigate to="/admin/pos" replace />
  }
  return children
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/pos" element={<PosPage />} />
          <Route
            path="/admin/orders"
            element={
              <OwnerRoute>
                <AdminOrdersPage />
              </OwnerRoute>
            }
          />
          <Route
            path="/owner/dashboard"
            element={
              <OwnerRoute>
                <OwnerDashboardPage />
              </OwnerRoute>
            }
          />
          <Route
            path="/owner/promos"
            element={
              <OwnerRoute>
                <ManagePromosPage />
              </OwnerRoute>
            }
          />
          <Route
            path="/owner/users"
            element={
              <OwnerRoute>
                <ManageUsersPage />
              </OwnerRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
