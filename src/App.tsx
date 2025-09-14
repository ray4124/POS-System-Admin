import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/LoginForm'
import { Layout } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { Inventory } from './components/Inventory'
import { Promotions } from './components/Promotions'
import { Employees } from './components/Employees'
import { Reports } from './components/Reports'
import './index.css'
import 'react-datepicker/dist/react-datepicker.css';
import { syncStaffs } from './contexts/staffDB'

function AppContent() {
  const { user, profile, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    if (profile) {
      setActiveTab(profile.role === "Staff" ? "register" : "dashboard")
    }
  }, [profile])

  useEffect(() => {
    // 🔹 Run sync on first load
    syncStaffs();

    // 🔹 Optionally, set up interval sync (e.g. every 5 mins)
    const interval = setInterval(() => {
      syncStaffs();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-blue-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <LoginForm />
  }

  const cashier = async () => {
    localStorage.clear();
    // Store data on the backend before redirecting
    const userData = { user, profile };
    const response = await fetch('http://localhost:5000/storeData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'user_data', data: userData })
    });
    if (response.ok) {
      // Successfully stored the data on the backend
      window.location.href = "http://localhost:5174/staff/";
    } else {
      // Handle the error
      console.error('Failed to store user data on the backend');
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'register':
        cashier();
        return null;
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'promotions':
        return <Promotions />;
      case 'employees':
        return <Employees />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
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