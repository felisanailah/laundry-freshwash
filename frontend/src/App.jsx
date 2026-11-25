import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LandingPage from './pages/LandingPage'
import OrderPage from './pages/OrderPage'
import LoginPage from './pages/LoginPage'
import PosPage from './pages/PosPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import OwnerDashboardPage from './pages/OwnerDashboardPage'
import ManageUsersPage from './pages/ManageUsersPage'

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
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
          <Route path="/owner/users" element={<ManageUsersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
