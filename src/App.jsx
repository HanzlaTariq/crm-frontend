import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Followups from './pages/FollowUps'
import Team from './pages/Team'


function App() {
  const [dark, setDark] = useState(false)

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen transition-colors duration-300">
        {/* Toasts replace the old console.error-only failure mode across every
            page — success/error feedback for every mutating action. Styled to
            match the ink/paper/brand tokens instead of the library defaults. */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: dark ? '#1A2230' : '#FFFFFF',
              color: dark ? '#F1F5F9' : '#10161F',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(16,22,31,0.08)'}`,
              borderRadius: '12px',
              fontSize: '13.5px',
              boxShadow: '0 1px 2px rgba(16,22,31,0.04), 0 8px 24px -12px rgba(16,22,31,0.15)',
            },
            success: { iconTheme: { primary: '#12B76A', secondary: dark ? '#1A2230' : '#FFFFFF' } },
            error: { iconTheme: { primary: '#F04438', secondary: dark ? '#1A2230' : '#FFFFFF' } },
          }}
        />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout dark={dark} setDark={setDark}>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Layout dark={dark} setDark={setDark}>
                    <Customers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/followups"
              element={
                <ProtectedRoute>
                  <Layout dark={dark} setDark={setDark}>
                    <Followups />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout dark={dark} setDark={setDark}>
                    <Team />
                  </Layout>
                </ProtectedRoute>
              }
            />  
            
          </Routes>
        </AuthProvider>
      </div>
    </div>
  )
}

export default App
