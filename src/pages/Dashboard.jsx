import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, customersRes] = await Promise.all([
        api.get('/customers/stats/summary'),
        api.get('/customers'),
      ])
      setStats(statsRes.data)
      setRecent(customersRes.data.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    new: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    interested: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    'not-interested': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    followup: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    sale: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    lost: 'bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  }

  const cards = [
    {
      label: 'Total Customers',
      value: stats?.total ?? 0,
      icon: '👥',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
      trend: 'All leads'
    },
    {
      label: 'Interested',
      value: stats?.interested ?? 0,
      icon: '🟢',
      bg: 'bg-green-50 dark:bg-green-900/20',
      iconBg: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
      trend: 'Hot leads'
    },
    {
      label: 'Follow Ups',
      value: stats?.followup ?? 0,
      icon: '📞',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
      trend: 'Pending calls'
    },
    {
      label: 'Sales Done',
      value: stats?.sale ?? 0,
      icon: '✅',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
      trend: 'Closed deals'
    },
    {
      label: 'Not Interested',
      value: stats?.notInterested ?? 0,
      icon: '🔴',
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
      trend: 'Cold leads'
    },
    {
      label: 'Lost',
      value: stats?.lost ?? 0,
      icon: '❌',
      bg: 'bg-gray-50 dark:bg-gray-700/30',
      iconBg: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
      trend: 'Gone leads'
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          Welcome back, {user?.name} 👋
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1 capitalize">
          {user?.role} — Here's your overview
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-32 animate-pulse border border-gray-100 dark:border-gray-700" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <div
              key={card.label}
              className={`${card.bg} rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl text-xl ${card.iconBg}`}>
                  {card.icon}
                </div>
                <span className="text-xs text-gray-400">{card.trend}</span>
              </div>
              <p className="mt-4 text-4xl font-bold text-gray-800 dark:text-white">
                {card.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Customers */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-white">📋 Recent Customers</h3>
          <button
            onClick={() => navigate('/customers')}
            className="text-sm text-blue-500 hover:text-blue-700 transition"
          >
            View All →
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No customers yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {recent.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                  <td className="px-6 py-3 font-medium text-gray-800 dark:text-white">{c.name}</td>
                  <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{c.phone}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs capitalize ${statusColors[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Dashboard