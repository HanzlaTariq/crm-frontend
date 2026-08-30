import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import {
  Users, CircleDot, PhoneCall, CheckCircle2, XCircle, Ban, ArrowRight,
} from 'lucide-react'

const statusColors = {
  new: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  interested: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  'not-interested': 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  followup: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  sale: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  lost: 'bg-slate-200 text-slate-500 dark:bg-slate-600/20 dark:text-slate-400',
}

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

  const cards = [
    { label: 'Total Customers', value: stats?.total ?? 0, icon: Users, tint: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-500/15', trend: 'All leads' },
    { label: 'Interested', value: stats?.interested ?? 0, icon: CircleDot, tint: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/15', trend: 'Hot leads' },
    { label: 'Follow Ups', value: stats?.followup ?? 0, icon: PhoneCall, tint: 'text-brand-700 bg-brand-50 dark:text-brand-400 dark:bg-brand-500/15', trend: 'Pending calls' },
    { label: 'Sales Done', value: stats?.sale ?? 0, icon: CheckCircle2, tint: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/15', trend: 'Closed deals' },
    { label: 'Not Interested', value: stats?.notInterested ?? 0, icon: XCircle, tint: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/15', trend: 'Cold leads' },
    { label: 'Lost', value: stats?.lost ?? 0, icon: Ban, tint: 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-600/20', trend: 'Gone leads' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-950 dark:text-white">
          Welcome back, {user?.name}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          <span className="capitalize font-mono text-xs uppercase tracking-wide bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md mr-2">
            {user?.role}
          </span>
          here's your overview
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-ink-800 rounded-xl p-5 h-32 animate-pulse border border-slate-100 dark:border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <div
              key={card.label}
              className="bg-white dark:bg-ink-800 rounded-xl p-5 border border-slate-100 dark:border-white/5 shadow-panel"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-lg ${card.tint}`}>
                  <card.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wide">{card.trend}</span>
              </div>
              <p className="mt-4 text-3xl sm:text-4xl font-display font-semibold text-ink-950 dark:text-white tabular">
                {card.value}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Customers */}
      <div className="mt-8 bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-panel">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink-950 dark:text-white text-sm sm:text-base">Recent Customers</h3>
          <button
            onClick={() => navigate('/customers')}
            className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition flex items-center gap-1 font-medium"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No customers yet</div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wide">
                <tr>
                  <th className="px-5 sm:px-6 py-3 text-left font-medium">Name</th>
                  <th className="px-5 sm:px-6 py-3 text-left font-medium">Phone</th>
                  <th className="px-5 sm:px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-5 sm:px-6 py-3 text-left font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {recent.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition">
                    <td className="px-5 sm:px-6 py-3 font-medium text-ink-950 dark:text-white">{c.name}</td>
                    <td className="px-5 sm:px-6 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{c.phone}</td>
                    <td className="px-5 sm:px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-3 text-slate-400 text-xs font-mono">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard