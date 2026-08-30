import { useState } from 'react'
import api from "../api/axios";
import { useAuth } from '../context/AuthContext'
import { Radio, Mail, Lock, ArrowRight, PhoneCall, Users, TrendingUp } from 'lucide-react'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.user, res.data.token)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-paper dark:bg-ink-950">
      {/* Left — brand panel, hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-ink-950 text-white flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />

        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center">
            <Radio className="w-5 h-5 text-ink-950" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">CRM System</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            Every call logged.<br />Every lead accounted for.
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Track leads from first contact to closed sale — assignments, follow-up
            calls and outcomes, all in one console for your whole team.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: PhoneCall, text: 'Follow-up ledger with full call history' },
              { icon: Users, text: 'Role-based assignment across your team' },
              { icon: TrendingUp, text: 'Live pipeline stats at a glance' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-brand-400" strokeWidth={1.75} />
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-600 font-mono">© {new Date().getFullYear()} CRM System</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Radio className="w-4 h-4 text-ink-950" strokeWidth={2.5} />
            </div>
            <span className="font-display font-semibold text-lg text-ink-950 dark:text-white">CRM System</span>
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink-950 dark:text-white">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Sign in to your account to continue</p>

          {error && (
            <div className="mt-5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm border border-rose-100 dark:border-rose-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-ink-600 bg-white dark:bg-ink-800 text-ink-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-ink-600 bg-white dark:bg-ink-800 text-ink-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ink-950 hover:bg-ink-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-ink-950 font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? 'Signing in…' : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login