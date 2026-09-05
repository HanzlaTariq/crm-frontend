import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { getErrorMessage } from '../utils/errors'
import EmptyState from '../components/EmptyState'
import {
  ChevronLeft, ChevronRight, CalendarDays, PhoneCall, Clock, AlertCircle,
} from 'lucide-react'

const statusColors = {
  interested: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  'not-interested': 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  followup: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  sale: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  lost: 'bg-slate-200 text-slate-500 dark:bg-slate-600/20 dark:text-slate-400',
}

const dotColors = {
  interested: 'bg-emerald-500',
  'not-interested': 'bg-rose-500',
  followup: 'bg-brand-500',
  sale: 'bg-violet-500',
  lost: 'bg-slate-400',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toDateKey = (d) => {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

const isSameDay = (a, b) => toDateKey(a) === toDateKey(b)

function Calendar() {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(today)

  const fetchEvents = useCallback(async (monthStart) => {
    setLoading(true)
    try {
      const from = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1)
      const to = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999)
      const res = await api.get('/followups/calendar/upcoming', {
        params: { from: from.toISOString(), to: to.toISOString() },
      })
      setEvents(res.data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load calendar'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvents(cursor) }, [cursor, fetchEvents])

  // Group events by day-of-month for quick lookup while rendering the grid.
  const eventsByDay = useMemo(() => {
    const map = {}
    for (const e of events) {
      if (!e.nextCallDate) continue
      const key = toDateKey(e.nextCallDate)
      if (!map[key]) map[key] = []
      map[key].push(e)
    }
    return map
  }, [events])

  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  // Build a 6-week grid so layout never jumps between months.
  const gridDays = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const startOffset = firstOfMonth.getDay()
    const gridStart = new Date(firstOfMonth)
    gridStart.setDate(gridStart.getDate() - startOffset)

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      return d
    })
  }, [cursor])

  const goToMonth = (delta) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  const goToToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
  }

  const selectedEvents = (eventsByDay[toDateKey(selectedDate)] || [])
    .slice()
    .sort((a, b) => new Date(a.nextCallDate) - new Date(b.nextCallDate))

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-950 dark:text-white">Calendar</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Upcoming follow-up calls at a glance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Month grid */}
        <div className="lg:col-span-2 bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-panel p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-ink-950 dark:text-white text-base">{monthLabel}</h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                Today
              </button>
              <button
                onClick={() => goToMonth(-1)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToMonth(1)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 py-1.5">
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {[...Array(42)].map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-slate-50 dark:bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {gridDays.map((d) => {
                const inMonth = d.getMonth() === cursor.getMonth()
                const key = toDateKey(d)
                const dayEvents = eventsByDay[key] || []
                const isToday = isSameDay(d, today)
                const isSelected = isSameDay(d, selectedDate)
                const isOverdue = dayEvents.length > 0 && d < new Date(today.getFullYear(), today.getMonth(), today.getDate())

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(d)}
                    className={`aspect-square rounded-lg p-1.5 flex flex-col items-center sm:items-start text-left transition border ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                    } ${!inMonth ? 'opacity-40' : ''}`}
                  >
                    <span
                      className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-ink-950 dark:bg-brand-500 text-white dark:text-ink-950' : 'text-ink-950 dark:text-white'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex items-center gap-0.5 mt-1 flex-wrap justify-center sm:justify-start">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span key={e._id} className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-rose-500' : dotColors[e.status] || 'bg-slate-400'}`} />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-slate-400 font-mono">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected day's calls */}
        <div className="bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-panel overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">{selectedEvents.length} call{selectedEvents.length === 1 ? '' : 's'} scheduled</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[520px] scrollbar-thin">
            {selectedEvents.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Nothing scheduled" message="No follow-up calls are due on this day." />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {selectedEvents.map((e) => {
                  const overdue = new Date(e.nextCallDate) < today && !['sale', 'lost'].includes(e.customer?.status)
                  return (
                    <button
                      key={e._id}
                      onClick={() => e.customer?.name && navigate(`/customers?search=${encodeURIComponent(e.customer.name)}`)}
                      className="w-full text-left px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm text-ink-950 dark:text-white truncate">{e.customer?.name || 'Unknown'}</p>
                        {overdue && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-400 shrink-0">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{e.customer?.phone}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColors[e.status] || 'bg-slate-100 text-slate-500'}`}>
                          {e.status}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" /> {new Date(e.nextCallDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {e.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">{e.note}</p>}
                      <p className="text-[11px] text-slate-400 mt-1.5 inline-flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" /> by {e.doneBy?.name || 'Unknown'}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar