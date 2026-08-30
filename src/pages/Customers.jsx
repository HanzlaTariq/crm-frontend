import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Plus, Search, X, UserPlus, Pencil, Eye, Lock, Archive } from 'lucide-react'

const statusColors = {
  new: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  interested: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  'not-interested': 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  followup: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  sale: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  lost: 'bg-slate-200 text-slate-500 dark:bg-slate-600/20 dark:text-slate-400',
}

const closedBadgeCls = 'bg-ink-950 text-white dark:bg-white/10 dark:text-slate-200'

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 bg-slate-50 dark:bg-ink-800 text-ink-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
const labelCls = "block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5"

function Customers() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '', notes: '', status: '' })
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [assignTo, setAssignTo] = useState('')
  const [assignNote, setAssignNote] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeNote, setCloseNote] = useState('')
  const [closing, setClosing] = useState(false)
  const [viewMode, setViewMode] = useState('active') // 'active' | 'closed' (closed sirf admin ke liye)
  const [closedCustomers, setClosedCustomers] = useState([])
  const [closedLoading, setClosedLoading] = useState(false)

  useEffect(() => {
    fetchCustomers()
    fetchTeamMembers()
  }, [])

  useEffect(() => {
    if (viewMode === 'closed' && user?.role === 'admin') {
      fetchClosedCustomers()
    }
  }, [viewMode])

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers')
      setCustomers(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClosedCustomers = async () => {
    setClosedLoading(true)
    try {
      const res = await api.get('/customers/closed/all')
      setClosedCustomers(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setClosedLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const res = await api.get('/users')
      // Admin filter out karo — admin ko assign nahi kar sakte
      setTeamMembers(res.data.filter(u => u.role !== 'admin'))
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return
    setSubmitting(true)
    try {
      const res = await api.post('/customers', form)
      setCustomers([res.data, ...customers])
      setForm({ name: '', phone: '', email: '', address: '', notes: '' })
      setShowModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const startEditing = () => {
    if (!selectedCustomer) return
    setEditForm({
      name: selectedCustomer.name || '',
      phone: selectedCustomer.phone || '',
      email: selectedCustomer.email || '',
      address: selectedCustomer.address || '',
      notes: selectedCustomer.notes || '',
      status: selectedCustomer.status || 'new',
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!selectedCustomer) return
    setSubmitting(true)
    try {
      const res = await api.put(`/customers/${selectedCustomer._id}`, editForm)
      setCustomers(prev => prev.map(c => c._id === res.data._id ? res.data : c))
      setSelectedCustomer(res.data)
      setIsEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssign = async () => {
    if (!assignTo) return
    setAssigning(true)
    try {
      const res = await api.put(`/customers/${selectedCustomer._id}/assign`, {
        assignedTo: assignTo,
        note: assignNote,
      })
      setCustomers(customers.map(c =>
        c._id === selectedCustomer._id ? { ...c, assignedTo: res.data.assignedTo, assignedBy: res.data.assignedBy } : c
      ))
      setSelectedCustomer(res.data)
      setShowAssignModal(false)
      setAssignTo('')
      setAssignNote('')
    } catch (err) {
      console.error(err)
    } finally {
      setAssigning(false)
    }
  }

  const handleClose = async () => {
    if (!selectedCustomer) return
    setClosing(true)
    try {
      const res = await api.put(`/customers/${selectedCustomer._id}/close`, { note: closeNote })
      // Ab yeh customer "close done" hai — apni list se hata do (admin ki normal list bhi sirf open dikhati hai)
      setCustomers(prev => prev.filter(c => c._id !== selectedCustomer._id))
      setSelectedCustomer(res.data)
      setShowCloseModal(false)
      setShowDetailModal(false)
      setCloseNote('')
    } catch (err) {
      console.error(err)
    } finally {
      setClosing(false)
    }
  }

  // Flat hierarchy — only admin has team (everyone)
  const getAssignableMembers = () => {
    if (user?.role === 'admin') {
      return teamMembers
    }
    if (user?.role === 'manager') {
      return teamMembers.filter(m => ['manager', 'jmanager', 'telecom', 'salesperson'].includes(m.role))
    }
    if (user?.role === 'jmanager') {
      return teamMembers.filter(m => ['jmanager', 'telecom', 'salesperson'].includes(m.role))
    }
    if (['telecom', 'salesperson'].includes(user?.role)) {
      return teamMembers.filter(m => ['telecom', 'salesperson', 'manager', 'jmanager'].includes(m.role))
    }
    return []
  }

  const filtered = customers.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    return matchFilter && matchSearch
  })

  const canAssign = ['admin', 'manager', 'jmanager', 'telecom', 'salesperson'].includes(user?.role)
  const canAddCustomer = user?.role !== 'admin'
  // Close button sirf us ke pas jise customer assign hua ho, ya admin ke pas
  const canClose = (c) => !c.closed && (user?.role === 'admin' || String(c.assignedTo?._id) === String(user?.id))

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-950 dark:text-white">Customers</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your leads &amp; customers</p>
        </div>
        {canAddCustomer && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-ink-950 hover:bg-ink-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-ink-950 font-medium rounded-xl transition shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} />
            Add Customer
          </button>
        )}
      </div>

      {/* Admin — Active / Closed toggle */}
      {user?.role === 'admin' && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('active')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
              viewMode === 'active'
                ? 'bg-ink-950 dark:bg-brand-500 text-white dark:text-ink-950'
                : 'bg-white dark:bg-ink-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-ink-600 hover:bg-slate-50 dark:hover:bg-ink-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setViewMode('closed')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
              viewMode === 'closed'
                ? 'bg-ink-950 dark:bg-brand-500 text-white dark:text-ink-950'
                : 'bg-white dark:bg-ink-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-ink-600 hover:bg-slate-50 dark:hover:bg-ink-700'
            }`}
          >
            <Archive className="w-3.5 h-3.5" /> Closed ({closedCustomers.length || ''})
          </button>
        </div>
      )}

      {/* Search + Filter — sirf active view me */}
      {viewMode === 'active' && (
        <div className="flex flex-wrap gap-2.5 mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 bg-white dark:bg-ink-800 text-ink-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 w-full sm:w-64"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'new', 'interested', 'not-interested', 'followup', 'sale', 'lost'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium capitalize transition ${
                  filter === s
                    ? 'bg-ink-950 dark:bg-brand-500 text-white dark:text-ink-950'
                    : 'bg-white dark:bg-ink-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-ink-600 hover:bg-slate-50 dark:hover:bg-ink-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Closed table — admin only, full close detail */}
      {viewMode === 'closed' && user?.role === 'admin' && (
        <div className="hidden md:block bg-white dark:bg-ink-800 rounded-xl shadow-panel border border-slate-100 dark:border-white/5 overflow-hidden mb-6">
          {closedLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : closedCustomers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No closed customers yet</div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[820px]">
                <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wide">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-medium">Name</th>
                    <th className="px-6 py-3.5 text-left font-medium">Phone</th>
                    <th className="px-6 py-3.5 text-left font-medium">Assigned To</th>
                    <th className="px-6 py-3.5 text-left font-medium">Closed By</th>
                    <th className="px-6 py-3.5 text-left font-medium">Closed On</th>
                    <th className="px-6 py-3.5 text-left font-medium">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {closedCustomers.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition">
                      <td className="px-6 py-3.5 font-medium text-ink-950 dark:text-white">{c.name}</td>
                      <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{c.phone}</td>
                      <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 capitalize">{c.assignedTo?.name || 'N/A'}</td>
                      <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 capitalize">{c.closedBy?.name || 'N/A'}</td>
                      <td className="px-6 py-3.5 text-slate-400 text-xs font-mono">{c.closedAt ? new Date(c.closedAt).toLocaleString() : 'N/A'}</td>
                      <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 max-w-[220px] truncate">{c.closeNote || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Table — desktop (active) */}
      {viewMode === 'active' && (
      <div className="hidden md:block bg-white dark:bg-ink-800 rounded-xl shadow-panel border border-slate-100 dark:border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No customers found</div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wide">
                <tr>
                  <th className="px-6 py-3.5 text-left font-medium">Name</th>
                  <th className="px-6 py-3.5 text-left font-medium">Phone</th>
                  <th className="px-6 py-3.5 text-left font-medium">Status</th>
                  <th className="px-6 py-3.5 text-left font-medium">Added By</th>
                  <th className="px-6 py-3.5 text-left font-medium">Assigned To</th>
                  <th className="px-6 py-3.5 text-left font-medium">Date</th>
                  <th className="px-6 py-3.5 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition">
                    <td className="px-6 py-3.5 font-medium text-ink-950 dark:text-white">{c.name}</td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{c.phone}</td>
                    <td className="px-6 py-3.5">
                      {c.closed
                        ? <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${closedBadgeCls}`}>Close Done</span>
                        : <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[c.status]}`}>
                            {c.status}
                          </span>
                      }
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 capitalize">
                      {c.addedBy?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 capitalize">
                      {c.assignedTo?.name
                        ? <span className="px-2 py-1 bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 rounded-lg text-xs">
                            {c.assignedTo.name}
                          </span>
                        : <span className="text-slate-300 dark:text-slate-600">Unassigned</span>
                      }
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 text-xs font-mono">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedCustomer(c)
                            setShowDetailModal(true)
                          }}
                          className="text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium transition text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {canAssign && !c.closed && (
                          <button
                            onClick={() => {
                              setSelectedCustomer(c)
                              setAssignTo(c.assignedTo?._id || '')
                              setShowAssignModal(true)
                            }}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium transition text-xs inline-flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Assign
                          </button>
                        )}
                        {canClose(c) && (
                          <button
                            onClick={() => {
                              setSelectedCustomer(c)
                              setCloseNote('')
                              setShowCloseModal(true)
                            }}
                            className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium transition text-xs inline-flex items-center gap-1"
                          >
                            <Lock className="w-3.5 h-3.5" /> Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Cards — mobile (active) */}
      {viewMode === 'active' && (
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5">No customers found</div>
        ) : filtered.map(c => (
          <div key={c._id} className="bg-white dark:bg-ink-800 rounded-xl p-4 border border-slate-100 dark:border-white/5 shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink-950 dark:text-white truncate">{c.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{c.phone}</p>
              </div>
              {c.closed
                ? <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${closedBadgeCls}`}>Close Done</span>
                : <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
              }
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>
                {c.assignedTo?.name
                  ? <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 rounded-lg">{c.assignedTo.name}</span>
                  : 'Unassigned'}
              </span>
              <span className="font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="mt-3 flex items-center gap-4 pt-3 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={() => { setSelectedCustomer(c); setShowDetailModal(true) }}
                className="text-sky-600 dark:text-sky-400 font-medium text-xs inline-flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              {canAssign && !c.closed && (
                <button
                  onClick={() => { setSelectedCustomer(c); setAssignTo(c.assignedTo?._id || ''); setShowAssignModal(true) }}
                  className="text-emerald-600 dark:text-emerald-400 font-medium text-xs inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Assign
                </button>
              )}
              {canClose(c) && (
                <button
                  onClick={() => { setSelectedCustomer(c); setCloseNote(''); setShowCloseModal(true) }}
                  className="text-rose-600 dark:text-rose-400 font-medium text-xs inline-flex items-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" /> Close
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-800 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Add Customer</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Name *', placeholder: 'Full name' },
                { key: 'phone', label: 'Phone *', placeholder: '03001234567' },
                { key: 'email', label: 'Email', placeholder: 'email@example.com' },
                { key: 'address', label: 'Address', placeholder: 'City, Country' },
              ].map(field => (
                <div key={field.key}>
                  <label className={labelCls}>{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className={inputCls}
                  />
                </div>
              ))}
              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  placeholder="Any additional notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-ink-950 dark:bg-brand-500 hover:bg-ink-800 dark:hover:bg-brand-600 text-white dark:text-ink-950 font-medium transition disabled:opacity-50">
                {submitting ? 'Adding...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-800 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Customer Details</h3>
              <button onClick={() => { setShowDetailModal(false); setIsEditing(false) }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                {[
                  { key: 'name', label: 'Name *', placeholder: 'Full name' },
                  { key: 'phone', label: 'Phone *', placeholder: '03001234567' },
                  { key: 'email', label: 'Email', placeholder: 'email@example.com' },
                  { key: 'address', label: 'Address', placeholder: 'City, Country' },
                ].map(field => (
                  <div key={field.key}>
                    <label className={labelCls}>{field.label}</label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={editForm[field.key]}
                      onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                ))}
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className={inputCls}
                  >
                    {['new', 'interested', 'not-interested', 'followup', 'sale', 'lost'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div className="flex gap-3 mt-3">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition">Cancel</button>
                  <button onClick={handleSave} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {[
                    { label: 'Name', value: selectedCustomer.name },
                    { label: 'Phone', value: selectedCustomer.phone },
                    { label: 'Email', value: selectedCustomer.email || 'N/A' },
                    { label: 'Address', value: selectedCustomer.address || 'N/A' },
                    { label: 'Added By', value: selectedCustomer.addedBy?.name || 'N/A' },
                    { label: 'Assigned To', value: selectedCustomer.assignedTo?.name || 'Unassigned' },
                    { label: 'Assigned From', value: selectedCustomer.assignedBy?.name || 'N/A' },
                    { label: 'Date Added', value: new Date(selectedCustomer.createdAt).toLocaleDateString() },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/5">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{item.label}</span>
                      <span className="text-sm font-medium text-ink-950 dark:text-white text-right">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                    {selectedCustomer.closed
                      ? <span className={`px-3 py-1 rounded-full text-xs font-medium ${closedBadgeCls}`}>Close Done</span>
                      : <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[selectedCustomer.status]}`}>
                          {selectedCustomer.status}
                        </span>
                    }
                  </div>
                  {selectedCustomer.notes && (
                    <div className="py-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Notes</span>
                      <p className="text-sm text-ink-950 dark:text-white mt-1">{selectedCustomer.notes}</p>
                    </div>
                  )}
                  {/* Closed detail — sirf admin ko dikhta hai; assignee/closer ko sirf "Close Done" badge dikhta hai */}
                  {selectedCustomer.closed && user?.role === 'admin' && (
                    <div className="mt-2 pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Closed By</span>
                        <span className="text-sm font-medium text-ink-950 dark:text-white">{selectedCustomer.closedBy?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Closed On</span>
                        <span className="text-sm font-medium text-ink-950 dark:text-white">{selectedCustomer.closedAt ? new Date(selectedCustomer.closedAt).toLocaleString() : 'N/A'}</span>
                      </div>
                      {selectedCustomer.closeNote && (
                        <div className="py-1">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Close Note</span>
                          <p className="text-sm text-ink-950 dark:text-white mt-1">{selectedCustomer.closeNote}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-5 flex gap-3">
                  <button onClick={() => { setShowDetailModal(false); setIsEditing(false) }} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition">Dismiss</button>
                  {!selectedCustomer.closed && (
                    <button onClick={startEditing} className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-ink-950 font-medium transition inline-flex items-center justify-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {canClose(selectedCustomer) && (
                    <button
                      onClick={() => { setShowDetailModal(false); setCloseNote(''); setShowCloseModal(true) }}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium transition inline-flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" /> Close
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Assign Customer</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Assigning: <span className="font-semibold text-ink-950 dark:text-white">{selectedCustomer.name}</span>
            </p>

            {selectedCustomer.assignedTo?.name && (
              <p className="text-xs text-sky-600 dark:text-sky-400 mb-3">
                Currently assigned to: <span className="font-medium">{selectedCustomer.assignedTo.name}</span>
              </p>
            )}

            <div>
              <label className={labelCls}>Assign To</label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className={inputCls}
              >
                <option value="">— Select Member —</option>
                {getAssignableMembers().map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role === 'jmanager' ? 'J. Manager' : m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label className={labelCls}>Note (optional)</label>
              <textarea
                placeholder="Why is this being assigned/reassigned..."
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowAssignModal(false); setAssignNote('') }} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition">Cancel</button>
              <button onClick={handleAssign} disabled={assigning || !assignTo} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition disabled:opacity-50">
                {assigning ? 'Assigning...' : 'Assign ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Customer Modal */}
      {showCloseModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Close Customer</h3>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Closing: <span className="font-semibold text-ink-950 dark:text-white">{selectedCustomer.name}</span>
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Once closed, this customer will be removed from the active list. It can't be reopened or edited afterwards.
            </p>

            <div>
              <label className={labelCls}>Note (optional)</label>
              <textarea
                placeholder="Reason for closing..."
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCloseModal(false); setCloseNote('') }} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition">Cancel</button>
              <button onClick={handleClose} disabled={closing} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium transition disabled:opacity-50">
                {closing ? 'Closing...' : 'Close ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers