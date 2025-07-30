import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile, Branch } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  branches: Branch[]
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for demo when Supabase is not connected
const mockUsers = {
  'owner@afflatus.com': {
    id: 'owner-mock-id',
    email: 'owner@afflatus.com',
    profile: {
      id: 'owner-mock-id',
      email: 'owner@afflatus.com',
      full_name: 'Business Owner',
      role: 'owner' as const,
      branch_id: 'branch-1',
      is_active: true,
      created_at: new Date().toISOString()
    }
  },
  'admin@afflatus.com': {
    id: 'admin-mock-id',
    email: 'admin@afflatus.com',
    profile: {
      id: 'admin-mock-id',
      email: 'admin@afflatus.com',
      full_name: 'System Administrator',
      role: 'admin' as const,
      branch_id: 'branch-1',
      is_active: true,
      created_at: new Date().toISOString()
    }
  },
  'manager@afflatus.com': {
    id: 'manager-mock-id',
    email: 'manager@afflatus.com',
    profile: {
      id: 'manager-mock-id',
      email: 'manager@afflatus.com',
      full_name: 'Branch Manager',
      role: 'manager' as const,
      branch_id: 'branch-1',
      is_active: true,
      created_at: new Date().toISOString()
    }
  },
  'cashier@afflatus.com': {
    id: 'cashier-mock-id',
    email: 'cashier@afflatus.com',
    profile: {
      id: 'cashier-mock-id',
      email: 'cashier@afflatus.com',
      full_name: 'Store Cashier',
      role: 'cashier' as const,
      branch_id: 'branch-1',
      is_active: true,
      created_at: new Date().toISOString()
    }
  }
}

const mockBranches: Branch[] = [
  {
    id: 'branch-1',
    name: 'Main Branch - Makati',
    address: '123 Ayala Ave, Makati City',
    phone: '+632-8123-4567',
    email: 'makati@afflatus.com',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'branch-2',
    name: 'BGC Branch',
    address: '456 BGC Central, Taguig City',
    phone: '+632-8234-5678',
    email: 'bgc@afflatus.com',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'branch-3',
    name: 'Ortigas Branch',
    address: '789 Ortigas Center, Pasig City',
    phone: '+632-8345-6789',
    email: 'ortigas@afflatus.com',
    is_active: true,
    created_at: new Date().toISOString()
  }
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [branches, setBranches] = useState<Branch[]>(mockBranches)
  const [loading, setLoading] = useState(true)
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false)

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null = null

    const checkSupabaseConnection = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          throw new Error('Supabase not reachable')
        }

        console.log('✅ Supabase connected')
        setIsSupabaseConnected(true)
        setUser(session.user)
        await fetchProfile(session.user.id)
        await fetchBranches()

        const { data } = supabase.auth.onAuthStateChange(
          async (_, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
              await fetchProfile(session.user.id)
              await fetchBranches()
            } else {
              setProfile(null)
            }
          }
        )
        subscription = data.subscription
      } catch (err) {
        console.warn('⚠️ Supabase connection failed, using mock mode:', err)
        setIsSupabaseConnected(false)
      } finally {
        setLoading(false)
      }
    }

    checkSupabaseConnection()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
      setBranches(mockBranches)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConnected) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error }
      } catch (err) {
        console.error('🔴 Supabase login error:', err)
        return { error: { message: 'Failed to connect to server. Please try again.' } }
      }
    } else {
      // Mock login
      if (password === 'demo123' && mockUsers[email as keyof typeof mockUsers]) {
        const mockUserData = mockUsers[email as keyof typeof mockUsers]
        const mockUser = {
          id: mockUserData.id,
          email: mockUserData.email,
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          confirmation_sent_at: new Date().toISOString()
        } as User

        setUser(mockUser)
        setProfile(mockUserData.profile)
        return { error: null }
      } else {
        return { error: { message: 'Invalid email or password' } }
      }
    }
  }

  const signOut = async () => {
    if (isSupabaseConnected) {
      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.error('Sign out error:', error)
      }
    }
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    branches,
    loading,
    signIn,
    signOut,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
