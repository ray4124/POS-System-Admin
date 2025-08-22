import React, { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/LoginForm'
import { Layout } from './components/Layout'
import { Register } from './components/Register'
import { Dashboard } from './components/Dashboard'
import { Inventory } from './components/Inventory'
import { Promotions } from './components/Promotions'
import { Employees } from './components/Employees'
import { Reports } from './components/Reports'
import './index.css'
import 'react-datepicker/dist/react-datepicker.css';

function AppContent() {
  const { user, profile, loading } = useAuth()
  const [activeTab, setActiveTab] = useState(() => {
    // Set default tab based on user role
    if (!profile) return 'dashboard'
    return profile.role === 'Staff' ? 'register' : 'dashboard'
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-brown-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <LoginForm />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'register':
        return <Register />
      case 'dashboard':
        return <Dashboard />
      case 'inventory':
        return <Inventory />
      case 'promotions':
        return <Promotions />
      case 'employees':
        return <Employees />
      case 'reports':
        return <Reports />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  )
}

function App() {
  // Add error boundary
  const [hasError, setHasError] = React.useState(false)
  
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Application error:', error)
      setHasError(true)
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold text-brown-900 mb-4">Something went wrong</h1>
          <p className="text-brown-600 mb-4">Please refresh the page to try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App