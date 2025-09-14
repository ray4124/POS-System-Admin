import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { Employee, login } from '../api/employeeAPI'
import { Branch, getBranches } from '../api/staticAPI'
import { staffDB } from "./staffDB";

interface Profile {
  id: number
  email: string
  full_name: string
  role: 'Owner' | 'Super Admin' | 'Admin' | 'Staff'
  branch_id: number | null
  is_active: boolean
  created_at: string
}

interface AuthContextType {
  user: Employee | null
  profile: Profile | null
  branches: Branch[]
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users
const mockUsers: Record<string, { id: string, email: string, profile: Profile }> = {
  'owner@afflatus.com': {
    id: 'owner-mock-id',
    email: 'owner@afflatus.com',
    profile: {
      id: 1,
      email: 'owner@afflatus.com',
      full_name: 'Business Owner',
      role: 'Owner',
      branch_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
    }
  },
  'admin@afflatus.com': {
    id: 'admin-mock-id',
    email: 'admin@afflatus.com',
    profile: {
      id: 2,
      email: 'admin@afflatus.com',
      full_name: 'System Administrator',
      role: 'Super Admin',
      branch_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
    }
  },
  'cashier@afflatus.com': {
    id: 'cashier-mock-id',
    email: 'cashier@afflatus.com',
    profile: {
      id: 3,
      email: 'cashier@afflatus.com',
      full_name: 'Store Cashier',
      role: 'Staff',
      branch_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    }
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Employee | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBranchesData = async () => {
      try {
        const data = await getBranches()
        setBranches(data)
      } catch {
        setBranches([
          { id: 1, branch_name: 'Main Branch - Makati' },
          { id: 2, branch_name: 'BGC Branch' },
          { id: 3, branch_name: 'Ortigas Branch' }
        ])
      } finally {
        setLoading(false)
      }
    }

    // Check if user data exists in localStorage
    const storedUser = localStorage.getItem('user')
    const storedProfile = localStorage.getItem('profile')
    
    if (storedUser && storedProfile) {
      setUser(JSON.parse(storedUser))
      setProfile(JSON.parse(storedProfile))
    }

    fetchBranchesData()
  }, [])

  const refreshProfile = async () => {
    if (!user) return
    try {
      const res = await axios.get(`/employees/${user.id}`)
      const emp = res.data as Employee
      setUser(emp)
      setProfile({ id: emp.id, email: emp.email, full_name: emp.name, role: emp.role, branch_id: emp.branch_id, is_active: true, created_at: new Date().toISOString() })
    } catch (err) {
      console.error('Error refreshing profile:', err)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // 🔹 Try real backend
      const emp = await login(email, password)

      // ✅ No password saving here, just trust backend
      setUser(emp)
      setProfile({
        id: emp.id,
        email: emp.email,
        full_name: emp.name,
        role: emp.role,
        branch_id: emp.branch_id,
        is_active: true,
        created_at: new Date().toISOString(),
      })

      // Save user data in localStorage
      localStorage.setItem('user', JSON.stringify(emp))
      localStorage.setItem('profile', JSON.stringify({
        id: emp.id,
        email: emp.email,
        full_name: emp.name,
        role: emp.role,
        branch_id: emp.branch_id,
        is_active: true,
        created_at: new Date().toISOString(),
      }))

      return { error: null }
    } catch (err) {
      console.warn("⚠️ Backend login failed, trying offline:", err)

      // 🔹 Check mock users or IndexedDB as fallback
      if (mockUsers[email] && password === "demo123") {
        const mock = mockUsers[email]
        setUser({
          id: mock.profile.id,
          name: mock.profile.full_name,
          email: mock.profile.email,
          role: mock.profile.role,
          branch_id: mock.profile.branch_id,
        })
        setProfile(mock.profile)

        return { error: null }
      }

      const staff = await staffDB.staffs.where("email").equals(email).first()

      if (staff && staff.passwordHash) {
        const match = password === staff.passwordHash
        if (match) {
          setUser({
            id: staff.id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            branch_id: staff.branch_id,
          })
          setProfile({
            id: staff.id,
            email: staff.email,
            full_name: staff.name,
            role: staff.role,
            branch_id: staff.branch_id,
            is_active: true,
            created_at: staff.modified_at,
          })

          return { error: null }
        }
      }

      return { error: { message: "Invalid email or password (offline)" } }
    }
  }

  const signOut = async () => {
    setUser(null)
    setProfile(null)

    // Clear user data from localStorage on sign-out
    localStorage.removeItem('user')
    localStorage.removeItem('profile')
  }

  return (
    <AuthContext.Provider value={{ user, profile, branches, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}