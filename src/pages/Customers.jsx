import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const statusColors = {
  new: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  interested: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  'not-interested': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  followup: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  sale: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  lost: 'bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

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
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchCustomers()
    fetchTeamMembers()
  }, [])

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
        assignedTo: assignTo
      })
      setCustomers(customers.map(c =>
        c._id === selectedCustomer._id ? { ...c, assignedTo: res.data.assignedTo, assignedBy: res.data.assignedBy } : c
      ))
      setSelectedCustomer(res.data)
      setShowAssignModal(false)
      setAssignTo('')
    } catch (err) {
      console.error(err)
    } finally {
      setAssigning(false)
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Customers</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your leads & customers</p>
        </div>
        {canAddCustomer && (
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition"
          >
            + Add Customer
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        {['all', 'new', 'interested', 'not-interested', 'followup', 'sale', 'lost'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No customers found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Phone</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Added By</th>
                <th className="px-6 py-4 text-left">Assigned To</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">{c.name}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{c.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 capitalize">
                    {c.addedBy?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 capitalize">
                    {c.assignedTo?.name
                      ? <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs">
                          {c.assignedTo.name}
                        </span>
                      : <span className="text-gray-300 dark:text-gray-600">Unassigned</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedCustomer(c)
                          setShowDetailModal(true)
                        }}
                        className="text-blue-500 hover:text-blue-700 font-medium transition"
                      >
                        View
                      </button>
                      {canAssign && (
                        <button
                          onClick={() => {
                            setSelectedCustomer(c)
                            setAssignTo(c.assignedTo?._id || '')
                            setShowAssignModal(true)
                          }}
                          className="text-green-500 hover:text-green-700 font-medium transition"
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Add Customer</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Name *', placeholder: 'Full name' },
                { key: 'phone', label: 'Phone *', placeholder: '03001234567' },
                { key: 'email', label: 'Email', placeholder: 'email@example.com' },
                { key: 'address', label: 'Address', placeholder: 'City, Country' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  placeholder="Any additional notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50">
                {submitting ? 'Adding...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Customer Details</h3>
              <button onClick={() => { setShowDetailModal(false); setIsEditing(false) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={editForm[field.key]}
                      onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    {['new', 'interested', 'not-interested', 'followup', 'sale', 'lost'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 mt-3">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancel</button>
                  <button onClick={handleSave} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition disabled:opacity-50">
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
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-700/50">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[selectedCustomer.status]}`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                  {selectedCustomer.notes && (
                    <div className="py-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Notes</span>
                      <p className="text-sm text-gray-800 dark:text-white mt-1">{selectedCustomer.notes}</p>
                    </div>
                  )}
                </div>
                <div className="mt-5 flex gap-3">
                  <button onClick={() => { setShowDetailModal(false); setIsEditing(false) }} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Close</button>
                  <button onClick={startEditing} className="flex-1 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition">Edit</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Assign Customer</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Assigning: <span className="font-semibold text-gray-800 dark:text-white">{selectedCustomer.name}</span>
            </p>

            {selectedCustomer.assignedTo?.name && (
              <p className="text-xs text-blue-500 mb-3">
                Currently assigned to: <span className="font-medium">{selectedCustomer.assignedTo.name}</span>
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select Member —</option>
                {getAssignableMembers().map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role === 'jmanager' ? 'J. Manager' : m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancel</button>
              <button onClick={handleAssign} disabled={assigning || !assignTo} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition disabled:opacity-50">
                {assigning ? 'Assigning...' : 'Assign ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers