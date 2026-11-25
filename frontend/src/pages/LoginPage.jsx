import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, Lock, Mail, AlertCircle } from 'lucide-react'
import api, { setAuthSession } from '../lib/api'
import Navbar from '../components/Navbar'

const DEMO_ACCOUNTS = [
  { label: 'Owner', email: 'owner@freshwash.id', password: 'password' },
  { label: 'Kasir', email: 'kasir@freshwash.id', password: 'password' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('kasir@freshwash.id')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/login', { email, password })
      setAuthSession(data.token, data.user)
      if (data.user.role === 'owner') {
        navigate('/owner/dashboard')
      } else if (data.user.role === 'kasir' || data.user.role === 'kurir') {
        navigate('/admin/pos')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Email atau password tidak valid.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#0284C7] text-white flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Masuk ke FreshWash</h1>
              <p className="text-xs text-slate-500">Akses dashboard Kasir, Kurir, dan Owner</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/15"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/15"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">Akun Demo Cepat:</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email)
                    setPassword(acc.password)
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-[#0284C7] transition-colors"
                >
                  Isi Akun {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
