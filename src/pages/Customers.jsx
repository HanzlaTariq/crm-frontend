import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, getPaginationMeta } from '../utils/errors'
import useDebounce from '../hooks/useDebounce'
import { SkeletonTable, SkeletonCardList } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import {
  Plus, Search, X, UserPlus, Pencil, Eye, Lock, Archive, SlidersHorizontal,
  Download, CheckSquare, Square, Users2, Tag, Inbox,
} from 'lucide-react'

const STATUSES = ['new', 'interested', 'not-interested', 'followup', 'sale', 'lost']

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

const PAGE_LIMIT = 20

function Customers() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalCount: 0, limit: PAGE_LIMIT })

  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '', notes: '', status: '' })

  // Filters — page resets to 1 whenever any of these change.
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assignedToFilter, setAssignedToFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const debouncedSearch = useDebounce(search, 400)

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
  const [closedPage, setClosedPage] = useState(1)
  const [closedMeta, setClosedMeta] = useState({ page: 1, totalPages: 1, totalCount: 0, limit: PAGE_LIMIT })

  // Bulk selection — admin/manager only, matches the backend's bulk-action role gate.
  const canBulkAct = ['admin', 'manager'].includes(user?.role)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false)
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false)
  const [bulkAssignTo, setBulkAssignTo] = useState('')
  const [bulkAssignNote, setBulkAssignNote] = useState('')
  const [bulkStatus, setBulkStatus] = useState('interested')
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Keep the URL's ?search= in sync so the global search bar and back button work.
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (debouncedSearch) next.set('search', debouncedSearch)
    else next.delete('search')
    setSearchParams(next, { replace: true })
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => { setPage(1) }, [statusFilter, assignedToFilter, dateFrom, dateTo])

  const buildFilterParams = useCallback(() => {
    const params = {}
    if (debouncedSearch) params.search = debouncedSearch
    if (statusFilter !== 'all') params.status = statusFilter
    if (assignedToFilter) params.assignedTo = assignedToFilter
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    return params
  }, [debouncedSearch, statusFilter, assignedToFilter, dateFrom, dateTo])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/customers', {
        params: { page, limit: PAGE_LIMIT, ...buildFilterParams() },
      })
      setCustomers(res.data)
      setMeta(getPaginationMeta(res))
      setSelectedIds(new Set())
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load customers'))
    } finally {
      setLoading(false)
    }
  }, [page, buildFilterParams])

  const fetchClosedCustomers = useCallback(async () => {
    setClosedLoading(true)
    try {
      const res = await api.get('/customers/closed/all', { params: { page: closedPage, limit: PAGE_LIMIT } })
      setClosedCustomers(res.data)
      setClosedMeta(getPaginationMeta(res))
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load closed customers'))
    } finally {
      setClosedLoading(false)
    }
  }, [closedPage])

  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await api.get('/users', { params: { limit: 100 } })
      setTeamMembers(res.data.filter(u => u.role !== 'admin'))
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load team members'))
    }
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])
  useEffect(() => { fetchTeamMembers() }, [fetchTeamMembers])
  useEffect(() => {
    if (viewMode === 'closed' && user?.role === 'admin') fetchClosedCustomers()
  }, [viewMode, fetchClosedCustomers, user?.role])

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return
    setSubmitting(true)
    try {
      await api.post('/customers', form)
      toast.success('Customer added')
      setForm({ name: '', phone: '', email: '', address: '', notes: '' })
      setShowModal(false)
      fetchCustomers()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add customer'))
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
      setSelectedCustomer(res.data)
      setIsEditing(false)
      toast.success('Customer updated')
      fetchCustomers()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update customer'))
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
      setSelectedCustomer(res.data)
      setShowAssignModal(false)
      setAssignTo('')
      setAssignNote('')
      toast.success('Customer assigned')
      fetchCustomers()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not assign customer'))
    } finally {
      setAssigning(false)
    }
  }

  const handleClose = async () => {
    if (!selectedCustomer) return
    setClosing(true)
    try {
      const res = await api.put(`/customers/${selectedCustomer._id}/close`, { note: closeNote })
      setSelectedCustomer(res.data)
      setShowCloseModal(false)
      setShowDetailModal(false)
      setCloseNote('')
      toast.success('Customer closed')
      fetchCustomers()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not close customer'))
    } finally {
      setClosing(false)
    }
  }

  // Flat hierarchy — only admin has team (everyone)
  const getAssignableMembers = () => {
    if (user?.role === 'admin') return teamMembers
    if (user?.role === 'manager') return teamMembers.filter(m => ['manager', 'jmanager', 'telecom', 'salesperson'].includes(m.role))
    if (user?.role === 'jmanager') return teamMembers.filter(m => ['jmanager', 'telecom', 'salesperson'].includes(m.role))
    if (['telecom', 'salesperson'].includes(user?.role)) return teamMembers.filter(m => ['telecom', 'salesperson', 'manager', 'jmanager'].includes(m.role))
    return []
  }

  const canAssign = ['admin', 'manager', 'jmanager', 'telecom', 'salesperson'].includes(user?.role)
  const canAddCustomer = user?.role !== 'admin'
  const canClose = (c) => !c.closed && (user?.role === 'admin' || String(c.assignedTo?._id) === String(user?.id))

  // --- Bulk selection helpers ---
  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(customers.map(c => c._id)))
  }
  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkAssign = async () => {
    if (!bulkAssignTo || selectedIds.size === 0) return
    setBulkSubmitting(true)
    try {
      const res = await api.put('/customers/bulk/assign', {
        customerIds: [...selectedIds],
        assignedTo: bulkAssignTo,
        note: bulkAssignNote,
      })
      toast.success(res.data.message || 'Customers assigned')
      setShowBulkAssignModal(false)
      setBulkAssignTo('')
      setBulkAssignNote('')
      fetchCustomers()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Bulk assign failed'))
    } finally {
      setBulkSubmitting(false)
    }
  }

  const handleBulkStatus = async () => {
    if (selectedIds.size === 0) return
    setBulkSubmitting(true)
    try {
      const res = await api.put('/customers/bulk/status', {
        customerIds: [...selectedIds],
        status: bulkStatus,
      })
      toast.success(res.data.message || 'Status updated')
      setShowBulkStatusModal(false)
      fetchCustomers()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Bulk status update failed'))
    } finally {
      setBulkSubmitting(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await api.get('/customers/export', {
        params: buildFilterParams(),
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `customers-export-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Export downloaded')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Export failed'))
    } finally {
      setExporting(false)
    }
  }

  const hasActiveFilters = statusFilter !== 'all' || assignedToFilter || dateFrom || dateTo
  const clearFilters = () => {
    setStatusFilter('all')
    setAssignedToFilter('')
    setDateFrom('')
    setDateTo('')
  }

  const assignableForFilter = useMemo(() => teamMembers, [teamMembers])

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-950 dark:text-white">Customers</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your leads &amp; customers</p>
        </div>
        <div className="flex items-center gap-2.5">
          {viewMode === 'active' && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 font-medium rounded-xl transition shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" strokeWidth={2} />
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          )}
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
            <Archive className="w-3.5 h-3.5" /> Closed
          </button>
        </div>
      )}

      {/* Search + Filter — sirf active view me */}
      {viewMode === 'active' && (
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap gap-2.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
              <input
                type="text"
                placeholder="Search name, phone or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 bg-white dark:bg-ink-800 text-ink-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 w-full sm:w-64"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', ...STATUSES].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium capitalize transition ${
                    statusFilter === s
                      ? 'bg-ink-950 dark:bg-brand-500 text-white dark:text-ink-950'
                      : 'bg-white dark:bg-ink-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-ink-600 hover:bg-slate-50 dark:hover:bg-ink-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMoreFilters(o => !o)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                showMoreFilters || hasActiveFilters
                  ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30'
                  : 'bg-white dark:bg-ink-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-ink-600 hover:bg-slate-50 dark:hover:bg-ink-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> More Filters
            </button>
          </div>

          {showMoreFilters && (
            <div className="flex flex-wrap items-end gap-3 bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-600 rounded-xl p-4">
              {user?.role === 'admin' && (
                <div className="w-full sm:w-56">
                  <label className={labelCls}>Assigned To</label>
                  <select value={assignedToFilter} onChange={(e) => setAssignedToFilter(e.target.value)} className={inputCls}>
                    <option value="">Anyone</option>
                    {assignableForFilter.map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.role === 'jmanager' ? 'J. Manager' : m.role})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="w-1/2 sm:w-40">
                <label className={labelCls}>From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
              </div>
              <div className="w-1/2 sm:w-40">
                <label className={labelCls}>To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-rose-600 dark:text-rose-400 font-medium hover:underline pb-2.5">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk action bar — admin/manager only, appears once something is selected */}
      {viewMode === 'active' && canBulkAct && selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/25 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-brand-800 dark:text-brand-300 inline-flex items-center gap-1.5">
            <Users2 className="w-4 h-4" /> {selectedIds.size} selected
          </span>
          <button
            onClick={() => setShowBulkAssignModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-ink-800 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition"
          >
            <UserPlus className="w-3.5 h-3.5" /> Bulk Assign
          </button>
          <button
            onClick={() => setShowBulkStatusModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-ink-800 text-sky-600 dark:text-sky-400 text-xs font-medium border border-sky-200 dark:border-sky-500/30 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition"
          >
            <Tag className="w-3.5 h-3.5" /> Bulk Status
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            Clear
          </button>
        </div>
      )}

      {/* Closed table — admin only, full close detail */}
      {viewMode === 'closed' && user?.role === 'admin' && (
        <div className="hidden md:block bg-white dark:bg-ink-800 rounded-xl shadow-panel border border-slate-100 dark:border-white/5 overflow-hidden mb-6">
          {closedLoading ? (
            <SkeletonTable rows={6} cols={6} />
          ) : closedCustomers.length === 0 ? (
            <EmptyState icon={Archive} title="No closed customers yet" message="Customers you close will show up here for the record." />
          ) : (
            <>
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
              <div className="px-4 border-t border-slate-100 dark:border-white/5">
                <Pagination
                  page={closedMeta.page}
                  totalPages={closedMeta.totalPages}
                  totalCount={closedMeta.totalCount}
                  limit={closedMeta.limit}
                  onPageChange={setClosedPage}
                  itemLabel="closed customers"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Table — desktop (active) */}
      {viewMode === 'active' && (
      <div className="hidden md:block bg-white dark:bg-ink-800 rounded-xl shadow-panel border border-slate-100 dark:border-white/5 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} cols={canBulkAct ? 8 : 7} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No customers found"
            message={hasActiveFilters || search ? 'Try adjusting your search or filters.' : 'Customers you add will show up here.'}
          />
        ) : (
          <>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wide">
                <tr>
                  {canBulkAct && (
                    <th className="px-4 py-3.5 text-left w-8">
                      <button onClick={toggleSelectAll} aria-label="Select all">
                        {selectedIds.size === customers.length
                          ? <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          : <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                      </button>
                    </th>
                  )}
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
                {customers.map(c => (
                  <tr key={c._id} className={`hover:bg-slate-50 dark:hover:bg-white/[0.03] transition ${selectedIds.has(c._id) ? 'bg-brand-50/50 dark:bg-brand-500/[0.06]' : ''}`}>
                    {canBulkAct && (
                      <td className="px-4 py-3.5">
                        <button onClick={() => toggleSelectOne(c._id)} aria-label="Select row">
                          {selectedIds.has(c._id)
                            ? <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                            : <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                        </button>
                      </td>
                    )}
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
                          onClick={() => { setSelectedCustomer(c); setShowDetailModal(true) }}
                          className="text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium transition text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {canAssign && !c.closed && (
                          <button
                            onClick={() => { setSelectedCustomer(c); setAssignTo(c.assignedTo?._id || ''); setShowAssignModal(true) }}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium transition text-xs inline-flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Assign
                          </button>
                        )}
                        {canClose(c) && (
                          <button
                            onClick={() => { setSelectedCustomer(c); setCloseNote(''); setShowCloseModal(true) }}
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
          <div className="px-4 border-t border-slate-100 dark:border-white/5">
            <Pagination page={meta.page} totalPages={meta.totalPages} totalCount={meta.totalCount} limit={meta.limit} onPageChange={setPage} itemLabel="customers" />
          </div>
          </>
        )}
      </div>
      )}

      {/* Cards — mobile (active) */}
      {viewMode === 'active' && (
      <div className="md:hidden space-y-3">
        {loading ? (
          <SkeletonCardList count={5} />
        ) : customers.length === 0 ? (
          <div className="bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5">
            <EmptyState
              icon={Inbox}
              title="No customers found"
              message={hasActiveFilters || search ? 'Try adjusting your search or filters.' : 'Customers you add will show up here.'}
            />
          </div>
        ) : (
          <>
          {customers.map(c => (
            <div key={c._id} className="bg-white dark:bg-ink-800 rounded-xl p-4 border border-slate-100 dark:border-white/5 shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-start gap-2.5">
                  {canBulkAct && (
                    <button onClick={() => toggleSelectOne(c._id)} className="mt-0.5 shrink-0" aria-label="Select">
                      {selectedIds.has(c._id)
                        ? <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        : <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                    </button>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-ink-950 dark:text-white truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{c.phone}</p>
                  </div>
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
          <Pagination page={meta.page} totalPages={meta.totalPages} totalCount={meta.totalCount} limit={meta.limit} onPageChange={setPage} itemLabel="customers" />
          </>
        )}
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
              <button onClick={handleSubmit} disabled={submitting || !form.name || !form.phone} className="flex-1 py-2.5 rounded-xl bg-ink-950 dark:bg-brand-500 hover:bg-ink-800 dark:hover:bg-brand-600 text-white dark:text-ink-950 font-medium transition disabled:opacity-50">
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
                    {STATUSES.map(s => (
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
                  <button onClick={handleSave} disabled={submitting || !editForm.name || !editForm.phone} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition disabled:opacity-50">
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

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Bulk Assign</h3>
              <button onClick={() => setShowBulkAssignModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Assigning <span className="font-semibold text-ink-950 dark:text-white">{selectedIds.size}</span> customer(s)
            </p>
            <div>
              <label className={labelCls}>Assign To</label>
              <select value={bulkAssignTo} onChange={(e) => setBulkAssignTo(e.target.value)} className={inputCls}>
                <option value="">— Select Member —</option>
                {getAssignableMembers().map(m => (
                  <option key={m._id} value={m._id}>{m.name} ({m.role === 'jmanager' ? 'J. Manager' : m.role})</option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Note (optional)</label>
              <textarea value={bulkAssignNote} onChange={(e) => setBulkAssignNote(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Bulk assignment note..." />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowBulkAssignModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition">Cancel</button>
              <button onClick={handleBulkAssign} disabled={bulkSubmitting || !bulkAssignTo} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition disabled:opacity-50">
                {bulkSubmitting ? 'Assigning...' : 'Assign All ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Modal */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Bulk Status Update</h3>
              <button onClick={() => setShowBulkStatusModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Updating <span className="font-semibold text-ink-950 dark:text-white">{selectedIds.size}</span> customer(s)
            </p>
            <div>
              <label className={labelCls}>New Status</label>
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className={inputCls}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowBulkStatusModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition">Cancel</button>
              <button onClick={handleBulkStatus} disabled={bulkSubmitting} className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium transition disabled:opacity-50">
                {bulkSubmitting ? 'Updating...' : 'Update All ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers
