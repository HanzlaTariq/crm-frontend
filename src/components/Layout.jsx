import { useState } from 'react'
import { Menu, Radio } from 'lucide-react'
import Sidebar from './Sidebar'

function Layout({ children, dark, setDark }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-paper dark:bg-ink-950">
      <Sidebar dark={dark} setDark={setDark} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-ink-950 text-white">
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
          <span className="font-display font-semibold text-sm">CRM System</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout