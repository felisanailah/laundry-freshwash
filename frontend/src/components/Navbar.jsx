import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Droplets, LogOut, User, LayoutDashboard } from 'lucide-react'
import { clearAuthSession, getStoredUser } from '../lib/api'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = getStoredUser()

  const handleLogout = () => {
    clearAuthSession()
    navigate('/')
  }

  const navLinkClass = (active) =>
    `text-sm font-semibold transition-colors ${
      active ? 'text-[#0284C7]' : 'text-slate-600 hover:text-slate-900'
    }`

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0284C7] text-white flex items-center justify-center shadow-sm">
            <Droplets className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            FreshWash <span className="text-[#0284C7]">Laundry</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          <Link to="/#layanan" className={navLinkClass(location.pathname === '/')}>
            Layanan
          </Link>
          <Link to="/#lacak" className={navLinkClass(false)}>
            Cek Status
          </Link>
          <Link to="/order" className={navLinkClass(location.pathname === '/order')}>
            Pesan Online
          </Link>
          <Link to="/admin/pos" className={navLinkClass(location.pathname.startsWith('/admin'))}>
            Kasir &amp; Operasional
          </Link>
          <Link to="/owner/dashboard" className={navLinkClass(location.pathname.startsWith('/owner'))}>
            Owner Analytics
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to={user.role === 'owner' ? '/owner/dashboard' : '/admin/pos'}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                {user.name} ({user.role})
              </Link>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <User className="w-4 h-4" />
              Masuk
            </Link>
          )}
          <Link
            to="/order"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            Pesan Sekarang
          </Link>
        </div>
      </div>
    </header>
  )
}
