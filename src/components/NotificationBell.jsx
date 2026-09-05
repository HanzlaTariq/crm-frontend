import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, UserPlus, Repeat2, Users2, PhoneCall } from 'lucide-react'
import api from '../api/axios'
import { getErrorMessage } from '../utils/errors'
import toast from 'react-hot-toast'

const TYPE_ICON = {
  assignment: UserPlus,
  reassignment: Repeat2,
  bulk_assignment: Users2,
  followup_reminder: PhoneCall,
}

const TYPE_TINT = {
  assignment: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  reassignment: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  bulk_assignment: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  followup_reminder: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// Phase 4 — real-time was evaluated (Socket.io needs a persistent connection,
// which doesn't fit this backend's Vercel serverless deployment) and polling
// was chosen instead: no new infra, works with the current setup. Tightened
// from 30s to 15s and paused while the tab is hidden so it doesn't burn
// requests/battery in a background tab; resumes (with an immediate refresh)
// the moment the tab becomes visible again.
const POLL_MS = 15000

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()
  const prevUnreadRef = useRef(0)
  const firstFetchRef = useRef(true)
  const openRef = useRef(false)

  useEffect(() => { openRef.current = open }, [open])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count')
      const next = res.data.unreadCount
      // Went up since the last poll (and it's not the very first load) —
      // something new arrived. Nudge the user with a toast, and if the
      // dropdown is already open, refresh its list too.
      if (!firstFetchRef.current && next > prevUnreadRef.current) {
        toast('You have a new notification', { icon: '🔔' })
        if (openRef.current) fetchList()
      }
      prevUnreadRef.current = next
      firstFetchRef.current = false
      setUnreadCount(next)
    } catch {
      // Silent — badge just won't update this tick, not worth a toast.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications', { params: { limit: 15 } })
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load notifications'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let interval = null

    const start = () => {
      if (interval) return
      interval = setInterval(fetchUnreadCount, POLL_MS)
    }
    const stop = () => {
      if (!interval) return
      clearInterval(interval)
      interval = null
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop()
      } else {
        fetchUnreadCount() // catch up immediately on return
        start()
      }
    }

    fetchUnreadCount()
    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [fetchUnreadCount])

  useEffect(() => {
    if (open) fetchList()
  }, [open, fetchList])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const markOneRead = async (n) => {
    if (n.isRead) return
    setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)))
    setUnreadCount((c) => Math.max(0, c - 1))
    try {
      await api.put(`/notifications/${n._id}/read`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      await api.put('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All caught up')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setMarkingAll(false)
    }
  }

  const handleClick = (n) => {
    markOneRead(n)
    setOpen(false)
    if (n.relatedCustomer?.name) {
      navigate(`/customers?search=${encodeURIComponent(n.relatedCustomer.name)}`)
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition"
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[90vw] bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/10 shadow-panel z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <h4 className="font-display font-semibold text-sm text-ink-950 dark:text-white">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium inline-flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                <p className="text-sm text-slate-400">You're all caught up</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell
                return (
                  <button
                    key={n._id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 border-b border-slate-50 dark:border-white/[0.03] transition hover:bg-slate-50 dark:hover:bg-white/[0.03] ${
                      !n.isRead ? 'bg-brand-50/40 dark:bg-brand-500/[0.06]' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_TINT[n.type] || 'bg-slate-100 text-slate-500 dark:bg-white/10'}`}>
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-950 dark:text-white truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell