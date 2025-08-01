import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, Store, BarChart3, Package, Users, Gift, Settings } from 'lucide-react'
import { clsx } from 'clsx'

interface LayoutProps {
  children: React.ReactNode
  activeTab?: string
  onTabChange?: (tab: string) => void
}

const navigationItems = {
  owner: [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'promotions', label: 'Promotions', icon: Gift },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  manager: [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'promotions', label: 'Promotions', icon: Gift },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ],
  cashier: [
    { id: 'register', label: 'Register', icon: Store },
  ]
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { profile, signOut } = useAuth()
  
  if (!profile) return null

  const userNavItems = navigationItems[profile.role] || []
  const isCashier = profile.role === 'cashier'

  return (
    <div className={clsx(
      "min-h-screen bg-background",
      isCashier ? "p-2" : "p-0"
    )}>
      {!isCashier && (
        <header className="bg-[#1F2937] text-white shadow-lg">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Store className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-xl font-bold">Afflatus POS</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="text-sm">
                    {profile.full_name} ({profile.role})
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#E5E7EB] hover:bg-red-700 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-black" />
                  <span className="text-sm text-black">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className={clsx(
        "flex",
        isCashier ? "h-screen" : "h-[calc(100vh-4rem)]"
      )}>
        {!isCashier && (
          <nav className="w-64 bg-white shadow-lg border-r border-[#1F2937]">
            <div className="p-4 space-y-2">
              {userNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange?.(item.id)}
                    className={clsx(
                      "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all",
                      activeTab === item.id
                        ? "bg-primary text-white shadow-md"
                        : "text-black hover:bg-secondary hover:text-gray-200"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        )}

        <main className={clsx(
          "flex-1 overflow-auto bg-gray-50",
          isCashier ? "p-0" : "p-6"
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}