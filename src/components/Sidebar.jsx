import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/dashboard', label: '🏠 Dashboard', roles: ['admin', 'manager', 'jmanager', 'telecom', 'salesperson'] },
  { path: '/customers', label: '👥 Customers', roles: ['admin', 'manager', 'jmanager', 'telecom', 'salesperson'] },
  { path: '/followups', label: '📞 Follow Ups', roles: ['admin', 'manager', 'jmanager', 'telecom', 'salesperson'] },
  { path: '/team', label: '👨‍💼 Team', roles: ['admin', 'manager'] },
]

function Sidebar({ dark, setDark }) {
  const { user, logout } = useAuth()

  const filtered = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <div className="w-64 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">CRM System</h1>
        <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {filtered.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">

        {/* Dark Toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {dark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>

        {/* User Info */}
        <div className="px-4 py-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{user?.name}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-left"
        >
          🚪 Logout
        </button>
      </div>

    </div>
  )
}

export default Sidebar