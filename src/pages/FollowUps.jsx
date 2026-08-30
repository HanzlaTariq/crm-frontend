import { useState, useEffect } from 'react'
import api from '../api/axios'
import { PhoneCall, X, Repeat2, CalendarClock } from 'lucide-react'

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

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 bg-slate-50 dark:bg-ink-800 text-ink-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
const labelCls = "block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5"

function FollowUps() {
  const [customers, setCustomers] = useState([])
  const [selected, setSelected] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    note: '', status: 'interested', nextCallDate: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [quickActing, setQuickActing] = useState(false)
  const [showListMobile, setShowListMobile] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers')
      setCustomers(res.data)
      if (res.data.length > 0) {
        selectCustomer(res.data[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectCustomer = async (customer) => {
    setSelected(customer)
    setShowListMobile(false)
    setTimelineLoading(true)
    try {
      const res = await api.get(`/customers/${customer._id}/timeline`)
      setTimeline(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setTimelineLoading(false)
    }
  }

  const refreshTimeline = async (customerId) => {
    const res = await api.get(`/customers/${customerId}/timeline`)
    setTimeline(res.data)
  }

  const handleSubmit = async () => {
    if (!form.note || !form.status) return
    setSubmitting(true)
    try {
      await api.post('/followups', {
        customerId: selected._id,
        ...form
      })
      await refreshTimeline(selected._id)
      // Update customer status in list
      setCustomers(customers.map(c =>
        c._id === selected._id ? { ...c, status: form.status } : c
      ))
      setSelected({ ...selected, status: form.status })
      setForm({ note: '', status: 'interested', nextCallDate: '' })
      setShowModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Quick action — koi bhi user ek click me "Not Interested" ya "Close (Sale)" mark kar sakta hai
  const handleQuickAction = async (status) => {
    if (!selected) return
    const noteText = status === 'sale' ? 'Marked as closed (sale done)' : 'Marked as not interested'
    setQuickActing(true)
    try {
      await api.post('/followups', {
        customerId: selected._id,
        note: noteText,
        status,
      })
      await refreshTimeline(selected._id)
      setCustomers(customers.map(c =>
        c._id === selected._id ? { ...c, status } : c
      ))
      setSelected({ ...selected, status })
    } catch (err) {
      console.error(err)
    } finally {
      setQuickActing(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-950 dark:text-white">Follow Ups</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Track customer interactions</p>
        </div>
        {/* Mobile: toggle back to list */}
        {!showListMobile && (
          <button
            onClick={() => setShowListMobile(true)}
            className="lg:hidden px-3 py-2 rounded-xl border border-slate-200 dark:border-ink-600 text-sm text-slate-600 dark:text-slate-300"
          >
            ← List
          </button>
        )}
      </div>

      <div className="flex gap-5 lg:h-[calc(100vh-200px)]">

        {/* Left — Customer List */}
        <div className={`w-full lg:w-80 shrink-0 bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-panel overflow-hidden flex-col ${showListMobile ? 'flex' : 'hidden lg:flex'}`}>
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-white/5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Customers <span className="font-mono">({customers.length})</span>
            </p>
          </div>
          <div className="overflow-y-auto flex-1 scrollbar-thin max-h-[60vh] lg:max-h-none">
            {loading ? (
              <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
            ) : customers.map(c => (
              <div
                key={c._id}
                onClick={() => selectCustomer(c)}
                className={`px-4 py-3 cursor-pointer border-b border-slate-50 dark:border-white/[0.03] transition ${
                  selected?._id === c._id
                    ? 'bg-brand-50 dark:bg-brand-500/10 border-l-2 border-l-brand-500'
                    : 'hover:bg-slate-50 dark:hover:bg-white/[0.03] border-l-2 border-l-transparent'
                }`}
              >
                <p className="font-medium text-ink-950 dark:text-white text-sm">{c.name}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{c.phone}</p>
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[11px] capitalize ${statusColors[c.status] || 'bg-slate-100 text-slate-500'}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Follow Up Ledger */}
        <div className={`flex-1 bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-panel flex-col overflow-hidden ${showListMobile ? 'hidden lg:flex' : 'flex'}`}>
          {selected ? (
            <>
              {/* Customer Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-ink-950 dark:text-white text-lg">{selected.name}</h3>
                  <p className="text-sm text-slate-400 font-mono">{selected.phone}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleQuickAction('not-interested')}
                    disabled={quickActing}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-medium rounded-xl transition disabled:opacity-50"
                  >
                    Not Interested
                  </button>
                  <button
                    onClick={() => handleQuickAction('sale')}
                    disabled={quickActing}
                    className="px-3 py-2 bg-violet-50 hover:bg-violet-100 dark:bg-violet-500/10 dark:hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs sm:text-sm font-medium rounded-xl transition disabled:opacity-50"
                  >
                    Close (Sale)
                  </button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-ink-950 dark:bg-brand-500 hover:bg-ink-800 dark:hover:bg-brand-600 text-white dark:text-ink-950 text-xs sm:text-sm font-medium rounded-xl transition inline-flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Add Follow Up
                  </button>
                </div>
              </div>

              {/* Ledger Timeline — assignment history + follow-ups, time-ordered call log */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin">
                {timelineLoading ? (
                  <div className="text-center text-slate-400 py-12 text-sm">Loading timeline...</div>
                ) : timeline.length === 0 ? (
                  <div className="text-center text-slate-400 py-12">
                    <PhoneCall className="w-8 h-8 mx-auto mb-3 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                    <p className="text-sm">No activity yet — add the first follow up!</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {timeline.map((item, i) => (
                      <div key={item._id} className="flex gap-4">
                        {/* Mono timestamp rail */}
                        <div className="flex flex-col items-center w-16 sm:w-20 shrink-0 pt-1.5">
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 text-right w-full leading-tight">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[10px] font-mono text-slate-300 dark:text-slate-600 text-right w-full">
                            {new Date(item.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Line + dot */}
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ring-4 ring-white dark:ring-ink-800 ${item.type === 'assignment' ? 'bg-sky-500' : dotColors[item.status] || 'bg-slate-400'}`} />
                          {i !== timeline.length - 1 && (
                            <div className="w-px bg-slate-200 dark:bg-white/10 flex-1 mt-1" />
                          )}
                        </div>

                        {/* Content */}
                        {item.type === 'assignment' ? (
                          <div className="flex-1 bg-sky-50/60 dark:bg-sky-500/[0.06] border border-sky-100 dark:border-sky-500/20 rounded-xl p-4 mb-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 mb-2">
                              <Repeat2 className="w-3 h-3" /> Assigned
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {item.fromUser?.name ? `${item.fromUser.name} → ` : 'Added directly to '}
                              <span className="font-semibold">{item.toUser?.name}</span>
                              {item.toUser?.role && <span className="text-slate-400"> ({item.toUser.role})</span>}
                            </p>
                            {item.note && <p className="text-xs text-slate-500 mt-1">{item.note}</p>}
                            <p className="text-xs text-slate-400 mt-1.5">
                              by {item.assignedBy?.name}
                            </p>
                          </div>
                        ) : (
                          <div className="flex-1 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 mb-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${statusColors[item.status]}`}>
                              {item.status}
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{item.note}</p>
                            {item.nextCallDate && (
                              <p className="text-xs text-brand-600 dark:text-brand-400 mt-2 inline-flex items-center gap-1">
                                <CalendarClock className="w-3.5 h-3.5" /> Next Call: {new Date(item.nextCallDate).toLocaleDateString()}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1.5">
                              by {item.doneBy?.name}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-8 text-center">
              Select a customer to view follow ups
            </div>
          )}
        </div>
      </div>

      {/* Add Follow Up Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Add Follow Up</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={inputCls}
                >
                  <option value="interested">🟢 Interested</option>
                  <option value="not-interested">🔴 Not Interested</option>
                  <option value="followup">🟡 Follow Up</option>
                  <option value="sale">✅ Sale Done</option>
                  <option value="lost">❌ Lost</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Note *</label>
                <textarea
                  placeholder="What happened in this interaction..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {form.status === 'followup' && (
                <div>
                  <label className={labelCls}>Next Call Date</label>
                  <input
                    type="date"
                    value={form.nextCallDate}
                    onChange={(e) => setForm({ ...form, nextCallDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition"
              >Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-ink-950 dark:bg-brand-500 hover:bg-ink-800 dark:hover:bg-brand-600 text-white dark:text-ink-950 font-medium transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Follow Up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FollowUps