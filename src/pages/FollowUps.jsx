import { useState, useEffect } from 'react'
import api from '../api/axios'

const statusColors = {
  interested: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  'not-interested': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  followup: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  sale: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  lost: 'bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function FollowUps() {
  const [customers, setCustomers] = useState([])
  const [selected, setSelected] = useState(null)
  const [followups, setFollowups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    note: '', status: 'interested', nextCallDate: ''
  })
  const [submitting, setSubmitting] = useState(false)

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
    try {
      const res = await api.get(`/followups/${customer._id}`)
      setFollowups(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async () => {
    if (!form.note || !form.status) return
    setSubmitting(true)
    try {
      const res = await api.post('/followups', {
        customerId: selected._id,
        ...form
      })
      setFollowups([res.data, ...followups])
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Follow Ups</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track customer interactions</p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-180px)]">

        {/* Left — Customer List */}
        <div className="w-80 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Customers ({customers.length})
            </p>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
            ) : customers.map(c => (
              <div
                key={c._id}
                onClick={() => selectCustomer(c)}
                className={`px-4 py-3 cursor-pointer border-b border-gray-50 dark:border-gray-700/50 transition ${
                  selected?._id === c._id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                }`}
              >
                <p className="font-medium text-gray-800 dark:text-white text-sm">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.phone}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs capitalize ${statusColors[c.status] || 'bg-gray-100 text-gray-500'}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Follow Up History */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Customer Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">{selected.name}</h3>
                  <p className="text-sm text-gray-400">{selected.phone}</p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
                >
                  + Add Follow Up
                </button>
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto p-6">
                {followups.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <p className="text-4xl mb-3">📞</p>
                    <p>No follow ups yet — add the first one!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {followups.map((f, i) => (
                      <div key={f._id} className="flex gap-4">
                        {/* Timeline Line */}
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          {i !== followups.length - 1 && (
                            <div className="w-0.5 bg-gray-200 dark:bg-gray-600 flex-1 mt-1" />
                          )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[f.status]}`}>
                              {f.status}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(f.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{f.note}</p>
                          {f.nextCallDate && (
                            <p className="text-xs text-blue-500 mt-2">
                              📅 Next Call: {new Date(f.nextCallDate).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            by {f.doneBy?.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a customer to view follow ups
            </div>
          )}
        </div>
      </div>

      {/* Add Follow Up Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Add Follow Up</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="interested">🟢 Interested</option>
                  <option value="not-interested">🔴 Not Interested</option>
                  <option value="followup">🟡 Follow Up</option>
                  <option value="sale">✅ Sale Done</option>
                  <option value="lost">❌ Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note *</label>
                <textarea
                  placeholder="What happened in this interaction..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {form.status === 'followup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Call Date</label>
                  <input
                    type="date"
                    value={form.nextCallDate}
                    onChange={(e) => setForm({ ...form, nextCallDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
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