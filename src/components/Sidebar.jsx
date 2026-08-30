import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutGrid,
  Users,
  PhoneCall,
  UsersRound,
  Sun,
  Moon,
  LogOut,
  Radio,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['admin', 'manager', 'jmanager', 'telecom', 'salesperson'] },
  { path: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'manager', 'jmanager', 'telecom', 'salesperson'] },
  { path: '/followups', label: 'Follow Ups', icon: PhoneCall, roles: ['admin', 'manager', 'jmanager', 'telecom', 'salesperson'] },
  { path: '/team', label: 'Team', icon: UsersRound, roles: ['admin'] },
]

const roleLabel = (role) => (role === 'jmanager' ? 'Jr. Manager' : role || '')

function Sidebar({ dark, setDark, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth()

  const filtered = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-64 shrink-0 bg-ink-950 text-slate-300 flex flex-col shadow-rail transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 text-ink-950" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-semibold text-white text-[15px] leading-tight tracking-tight">
              CRM System
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mt-0.5">
              {roleLabel(user?.role)} console
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {filtered.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen?.(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/[0.06] text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full transition-colors ${
                        isActive ? 'bg-brand-500' : 'bg-transparent'
                      }`}
                    />
                    <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-white/[0.06] space-y-1">
          <button
            onClick={() => setDark(!dark)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition"
          >
            {dark ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.75} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.75} />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-ink-950 text-xs font-display font-bold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wide">{roleLabel(user?.role)}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar