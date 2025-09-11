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

  // useEffect(() => {
  //   // Directly call the sign-in logic for demo auto-login
  //   const autoSignIn = async () => {
  //     setLoading(true)
  //     setError('')
  //     try {
  //       const result = await signIn(email, password)
  //       if (result?.error) {
  //         setError(result.error.message || 'Failed to sign in.')
  //       }
  //     } catch (err: any) {
  //       setError(err.message || 'An unexpected error occurred.')
  //     } finally {
  //       setLoading(false)
  //     }
  //   }
  //   autoSignIn()
  // }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="bg-blue-600/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-semibold text-black mb-2">Afflatus POS</h1>
          <p className="text-gray-700">Welcome back! Please sign in to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-slide-up">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-white rounded-lg shadow-lg">
          <h3 className="font-medium text-black mb-2">Demo Accounts:</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Owner:</strong> owner@afflatus.com</p>
            <p><strong>Admin:</strong> admin@afflatus.com</p>
            <p><strong>Cashier:</strong> cashier@afflatus.com</p>
            <p className="text-xs mt-2 italic text-blue-600 font-semibold">Password: demo123 for all accounts</p>
            <p className="text-xs mt-1 text-gray-600">
              💡 System running in demo mode - no database required
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
