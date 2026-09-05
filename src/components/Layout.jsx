import { useState } from 'react'
import { Menu, Radio } from 'lucide-react'
import Sidebar from './Sidebar'
import GlobalSearch from './GlobalSearch'
import NotificationBell from './NotificationBell'

function Layout({ children, dark, setDark }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-paper dark:bg-ink-950">
      <Sidebar dark={dark} setDark={setDark} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-ink-950 text-white">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 transition"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5 text-ink-950" strokeWidth={2.5} />
            </div>
            <span className="font-display font-semibold text-sm flex-1">CRM System</span>
            <button
              onClick={() => setMobileSearchOpen((o) => !o)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition text-slate-300"
              aria-label="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </button>
            <div className="[&_button]:text-slate-300 [&_button:hover]:bg-white/10">
              <NotificationBell />
            </div>
          </div>
          {mobileSearchOpen && (
            <div className="px-4 pb-3">
              <GlobalSearch />
            </div>
          )}
        </div>

        {/* Desktop top bar — global search + notifications, sticky above content */}
        <div className="hidden lg:flex sticky top-0 z-30 items-center gap-4 px-8 py-3.5 bg-paper/90 dark:bg-ink-950/90 backdrop-blur border-b border-slate-200/70 dark:border-white/[0.06]">
          <GlobalSearch className="max-w-md flex-1" />
          <NotificationBell />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
