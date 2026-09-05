import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, X } from 'lucide-react'

// Lives in the top bar. Typing here just updates local state; on submit (or
// after a short pause) it pushes ?search= onto /customers, which reads it
// straight into its own server-side search query param. Kept decoupled from
// Customers.jsx's internal state — this is a "jump to" bar, not a live filter.
function GlobalSearch({ className = '' }) {
  const [value, setValue] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Keep the bar in sync if the user is already on /customers with a search param
  useEffect(() => {
    if (location.pathname === '/customers') {
      const params = new URLSearchParams(location.search)
      setValue(params.get('search') || '')
    }
  }, [location.pathname, location.search])

  const go = (term) => {
    const trimmed = term.trim()
    navigate(trimmed ? `/customers?search=${encodeURIComponent(trimmed)}` : '/customers')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') go(value)
    if (e.key === 'Escape') e.currentTarget.blur()
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.75} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search customers by name or phone..."
        className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 dark:border-ink-600 bg-slate-50 dark:bg-white/5 text-sm text-ink-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
      />
      {value && (
        <button
          onClick={() => { setValue(''); if (location.pathname === '/customers') go('') }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export default GlobalSearch
