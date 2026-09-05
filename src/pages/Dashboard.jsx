import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/errors'
import { SkeletonCard, SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import {
  Users, CircleDot, PhoneCall, CheckCircle2, XCircle, Ban, ArrowRight, TrendingUp, Inbox,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts'

const statusColors = {
  new: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  interested: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  'not-interested': 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  followup: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  sale: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  lost: 'bg-slate-200 text-slate-500 dark:bg-slate-600/20 dark:text-slate-400',
}

const PIE_COLORS = {
  new: '#64748B',
  interested: '#12B76A',
  'not-interested': '#F04438',
  followup: '#E8A33D',
  sale: '#7C5CFF',
  lost: '#94A3B8',
}

const PERIODS = [
  { key: 'week', label: '7 Days' },
  { key: 'month', label: '30 Days' },
  { key: 'year', label: '12 Months' },
]

// Tooltip content is plain divs styled to match the card system rather than
// recharts' default tooltip look.
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-ink-800 border border-slate-100 dark:border-white/10 rounded-lg px-3 py-2 shadow-panel text-xs">
      <p className="text-slate-400 dark:text-slate-500 font-mono mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-ink-950 dark:text-white font-medium">
          {p.name}: <span className="tabular">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  const [analytics, setAnalytics] = useState(null)
  const [period, setPeriod] = useState('month')
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, customersRes] = await Promise.all([
        api.get('/customers/stats/summary'),
        api.get('/customers', { params: { limit: 5 } }),
      ])
      setStats(statsRes.data)
      setRecent(customersRes.data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load dashboard'))
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAnalytics = useCallback(async (p) => {
    setAnalyticsLoading(true)
    try {
      const res = await api.get('/dashboard/analytics', { params: { period: p } })
      setAnalytics(res.data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load analytics'))
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  useEffect(() => { fetchOverview() }, [fetchOverview])
  useEffect(() => { fetchAnalytics(period) }, [period, fetchAnalytics])

  const cards = [
    { label: 'Total Customers', value: stats?.total ?? 0, icon: Users, tint: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-500/15', trend: 'All leads' },
    { label: 'Interested', value: stats?.interested ?? 0, icon: CircleDot, tint: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/15', trend: 'Hot leads' },
    { label: 'Follow Ups', value: stats?.followup ?? 0, icon: PhoneCall, tint: 'text-brand-700 bg-brand-50 dark:text-brand-400 dark:bg-brand-500/15', trend: 'Pending calls' },
    { label: 'Sales Done', value: stats?.sale ?? 0, icon: CheckCircle2, tint: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/15', trend: 'Closed deals' },
    { label: 'Not Interested', value: stats?.notInterested ?? 0, icon: XCircle, tint: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/15', trend: 'Cold leads' },
    { label: 'Lost', value: stats?.lost ?? 0, icon: Ban, tint: 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-600/20', trend: 'Gone leads' },
  ]

  const showPerUser = ['admin', 'manager', 'jmanager'].includes(user?.role)

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
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} className="h-32" />)}
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

      {/* Analytics header + period toggle */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <h3 className="font-display font-semibold text-ink-950 dark:text-white text-base">Analytics</h3>
        <div className="flex gap-1.5 bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-600 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                period === p.key
                  ? 'bg-ink-950 dark:bg-brand-500 text-white dark:text-ink-950'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {analyticsLoading ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonCard className="h-72 lg:col-span-2" />
          <SkeletonCard className="h-72" />
        </div>
      ) : !analytics || analytics.totalAllTime === 0 ? (
        <div className="mt-4 bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-panel">
          <EmptyState icon={TrendingUp} title="No data yet" message="Analytics will appear once customers start coming in." />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Leads over time */}
          <div className="lg:col-span-2 bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-ink-950 dark:text-white">Leads Over Time</p>
              <p className="text-xs text-slate-400 font-mono">{analytics.totalInRange} in range</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics.leadsOverTime} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/5" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="count" name="Leads" stroke="#E8A33D" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status breakdown */}
          <div className="bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-panel p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-ink-950 dark:text-white">Status Breakdown</p>
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{analytics.conversionRate}% conv.</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {analytics.statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={PIE_COLORS[entry.status] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-1 justify-center">
              {analytics.statusBreakdown.map((s) => (
                <span key={s.status} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[s.status] || '#94A3B8' }} />
                  {s.status} ({s.count})
                </span>
              ))}
            </div>
          </div>

          {/* Per-user performance — admin/manager/jmanager only */}
          {showPerUser && analytics.perUserPerformance?.length > 0 && (
            <div className="lg:col-span-3 bg-white dark:bg-ink-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-panel p-5">
              <p className="text-sm font-medium text-ink-950 dark:text-white mb-4">Per-Agent Performance</p>
              <ResponsiveContainer width="100%" height={Math.max(180, analytics.perUserPerformance.length * 34)}>
                <BarChart
                  data={analytics.perUserPerformance}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/5" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="sale" name="Sales" fill="#12B76A" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="lost" name="Lost" fill="#F04438" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
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

        {loading ? (
          <SkeletonTable rows={5} cols={4} />
        ) : recent.length === 0 ? (
          <EmptyState icon={Inbox} title="No customers yet" message="New leads will show up here as soon as they're added." />
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
