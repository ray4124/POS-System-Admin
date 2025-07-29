import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, AlertCircle } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn(email, password)

      if (result?.error) {
        setError(result.error.message || 'Failed to sign in.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-200 to-background flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-brown-900 mb-2">Afflatus POS</h1>
          <p className="text-brown-800/70">Welcome back! Please sign in to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 flex items-center gap-3 animate-slide-up">
              <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brown-800 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-brown-800 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-background rounded-lg">
          <h3 className="font-medium text-brown-800 mb-2">Demo Accounts:</h3>
          <div className="text-sm text-brown-800/70 space-y-1">
            <p><strong>Owner:</strong> owner@afflatus.com</p>
            <p><strong>Admin:</strong> admin@afflatus.com</p>
            <p><strong>Manager:</strong> manager@afflatus.com</p>
            <p><strong>Cashier:</strong> cashier@afflatus.com</p>
            <p className="text-xs mt-2 italic text-primary font-semibold">Password: demo123 for all accounts</p>
            <p className="text-xs mt-1 text-brown-600">
              💡 System running in demo mode - no database required
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
