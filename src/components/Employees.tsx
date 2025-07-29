import React, { useState, useEffect } from 'react'
import { Users, Plus, Edit, Shield, Mail, Phone, MapPin, Trash2, Eye, EyeOff } from 'lucide-react'
import { Profile, UserRole } from '../lib/supabase'
import { clsx } from 'clsx'

export function Employees() {
  const [employees, setEmployees] = useState<Profile[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null)

  // Mock data for demo
  useEffect(() => {
    const mockEmployees: Profile[] = [
      {
        id: '1',
        email: 'john.smith@afflatus.com',
        full_name: 'John Smith',
        role: 'admin',
        branch_id: 'branch1',
        created_at: '2024-01-15T08:00:00Z'
      },
      {
        id: '2',
        email: 'maria.garcia@afflatus.com',
        full_name: 'Maria Garcia',
        role: 'manager',
        branch_id: 'branch1',
        created_at: '2024-02-01T08:00:00Z'
      },
      {
        id: '3',
        email: 'alex.chen@afflatus.com',
        full_name: 'Alex Chen',
        role: 'cashier',
        branch_id: 'branch1',
        created_at: '2024-02-15T08:00:00Z'
      },
      {
        id: '4',
        email: 'sarah.johnson@afflatus.com',
        full_name: 'Sarah Johnson',
        role: 'cashier',
        branch_id: 'branch1',
        created_at: '2024-03-01T08:00:00Z'
      },
      {
        id: '5',
        email: 'mike.wilson@afflatus.com',
        full_name: 'Mike Wilson',
        role: 'manager',
        branch_id: 'branch2',
        created_at: '2024-03-15T08:00:00Z'
      }
    ]
    setEmployees(mockEmployees)
  }, [])

  const EmployeeModal = ({ employee, onClose, onSave }: {
    employee?: Profile | null
    onClose: () => void
    onSave: (employee: Partial<Profile & { password?: string }>) => void
  }) => {
    const [formData, setFormData] = useState({
      email: employee?.email || '',
      full_name: employee?.full_name || '',
      role: employee?.role || 'cashier' as UserRole,
      branch_id: employee?.branch_id || 'branch1',
      password: ''
    })
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSave(formData)
      onClose()
    }

    const branches = [
      { id: 'branch1', name: 'Main Branch - Makati' },
      { id: 'branch2', name: 'Branch 2 - BGC' },
      { id: 'branch3', name: 'Branch 3 - Ortigas' }
    ]

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md animate-slide-up">
          <h2 className="text-xl font-bold text-brown-900 mb-4">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-800 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-800 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-800 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-800 mb-1">Branch</label>
              <select
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            {!employee && (
              <div>
                <label className="block text-sm font-medium text-brown-800 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brown-400 hover:text-brown-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-brown-600 mt-1">Minimum 6 characters</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-brown-200 text-brown-800 rounded-lg hover:bg-brown-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                {employee ? 'Update' : 'Add'} Employee
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const handleSaveEmployee = (employeeData: Partial<Profile & { password?: string }>) => {
    if (editingEmployee) {
      // Update existing employee
      setEmployees(employees.map(e => 
        e.id === editingEmployee.id 
          ? { ...e, ...employeeData } 
          : e
      ))
    } else {
      // Add new employee
      const newEmployee: Profile = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        ...employeeData
      } as Profile
      setEmployees([...employees, newEmployee])
    }
  }

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      setEmployees(employees.filter(e => e.id !== id))
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'bg-promo/20 text-brown-900'
      case 'admin': return 'bg-primary/10 text-primary'
      case 'manager': return 'bg-secondary/10 text-secondary'
      case 'cashier': return 'bg-brown-100 text-brown-800'
      default: return 'bg-brown-100 text-brown-800'
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return '👑'
      case 'admin': return '🛡️'
      case 'manager': return '👨‍💼'
      case 'cashier': return '💰'
      default: return '👤'
    }
  }

  const roleStats = employees.reduce((acc, emp) => {
    acc[emp.role] = (acc[emp.role] || 0) + 1
    return acc
  }, {} as Record<UserRole, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Employee Management</h1>
          <p className="text-brown-600">Manage your team members and their access levels</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['owner', 'admin', 'manager', 'cashier'] as UserRole[]).map(role => (
          <div key={role} className="bg-white p-4 rounded-xl shadow-sm border border-brown-100">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getRoleIcon(role)}</span>
              <div>
                <h3 className="text-lg font-semibold text-brown-900 capitalize">{role}s</h3>
                <p className="text-2xl font-bold text-primary">{roleStats[role] || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-brown-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brown-50 border-b border-brown-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Employee</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Branch</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Joined</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-brown-100 hover:bg-background transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-brown-900">{employee.full_name}</p>
                        <p className="text-sm text-brown-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {employee.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={clsx(
                      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
                      getRoleBadgeColor(employee.role)
                    )}>
                      <span>{getRoleIcon(employee.role)}</span>
                      <span className="capitalize">{employee.role}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-brown-600">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {employee.branch_id === 'branch1' ? 'Main Branch - Makati' :
                         employee.branch_id === 'branch2' ? 'Branch 2 - BGC' :
                         employee.branch_id === 'branch3' ? 'Branch 3 - Ortigas' :
                         'Unknown Branch'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-brown-600">
                    {new Date(employee.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingEmployee(employee)
                          setShowAddModal(true)
                        }}
                        className="p-1 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                        title="Edit Employee"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="p-1 text-error hover:bg-error hover:text-white rounded transition-colors"
                        title="Delete Employee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
        <h2 className="text-xl font-bold text-brown-900 mb-4">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-brown-800 flex items-center gap-2">
              👑 Owner
            </h3>
            <ul className="text-sm text-brown-600 space-y-1">
              <li>• Mobile access only</li>
              <li>• Dashboard & analytics</li>
              <li>• All reports</li>
              <li>• Real-time data</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-brown-800 flex items-center gap-2">
              🛡️ Admin
            </h3>
            <ul className="text-sm text-brown-600 space-y-1">
              <li>• Full backend access</li>
              <li>• Inventory management</li>
              <li>• User management</li>
              <li>• Pricing controls</li>
              <li>• All reports</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-brown-800 flex items-center gap-2">
              👨‍💼 Manager
            </h3>
            <ul className="text-sm text-brown-600 space-y-1">
              <li>• Limited backend access</li>
              <li>• Promotions management</li>
              <li>• Inventory updates</li>
              <li>• Branch reports</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-brown-800 flex items-center gap-2">
              💰 Cashier
            </h3>
            <ul className="text-sm text-brown-600 space-y-1">
              <li>• Register access only</li>
              <li>• Process sales</li>
              <li>• Customer lookup</li>
              <li>• Apply promotions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setShowAddModal(false)
            setEditingEmployee(null)
          }}
          onSave={handleSaveEmployee}
        />
      )}
    </div>
  )
}