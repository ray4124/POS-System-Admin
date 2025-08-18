import React, { useState, useEffect } from 'react'
import { Users, Plus, Edit, Shield, Mail, Phone, MapPin, Trash2, Eye, EyeOff, Search } from 'lucide-react'
import { clsx } from 'clsx'
import Employee from '../mockdata/employees.json';

interface EmployeeData {
  id: number; // match JSON
  name: string;
  email: string;
  password: string; // add since JSON has it
  role: string;
  branch: string | null; // allow null
}

export function Employees() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [search, setSearch] = useState('')

  const roleStats: Record<string, number> = {
    Owner: 0,
    Admin: 0,
    Staff: 0,
  };

  Employee.forEach((emp: EmployeeData) => {
    // normalize roles
    let normalizedRole = emp.role;

    if (normalizedRole === "Super Admin") {
      normalizedRole = "Admin"; // merge into Admin
    }

    roleStats[normalizedRole] =
      (roleStats[normalizedRole] || 0) + 1;
  });

  const getRoleBadgeColor = (role: EmployeeData["role"]) => {
    switch (role) {
      case 'Owner': return 'bg-promo/20 text-brown-900'
      case 'Admin': return 'bg-secondary/10 text-secondary'
      case 'Staff': return 'bg-brown-100 text-brown-800'
      default: return 'bg-brown-100 text-brown-800'
    }
  }

  const getRoleIcon = (role: EmployeeData["role"]) => {
    switch (role) {
      case 'Owner': return '👑'
      case 'Admin': return '👨‍💼'
      case 'Staff': return '💰'
      default: return '👤'
    }
  }

  const filteredEmployees = Employee.filter((emp: EmployeeData) => {
    return emp.name.toLowerCase().includes(search.toLowerCase()) ||
            emp.email.toLowerCase().includes(search.toLowerCase()) ||
            emp.role.toLowerCase().includes(search.toLowerCase()) ||
            (emp.branch ? emp.branch.toLowerCase().includes(search.toLowerCase()) : false
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Employee Management</h1>
          <p className="text-brown-600">Manage your team members and their access levels</p>
        </div>
        
        <button
          // onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(roleStats).map(([role, count]) => (
          <div key={role} className="bg-white p-4 rounded-xl shadow-sm border border-brown-100">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getRoleIcon(role as EmployeeData["role"])}</span>
              <div>
                <h3 className="text-lg font-semibold text-brown-900 capitalize">{role}s</h3>
                <p className="text-2xl font-bold text-primary">{count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search Employee..."
          value={search}
          onChange={(e) => {setSearch(e.target.value)}}
          className="w-full pl-10 pr-4 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          onClick={() => setSearch('')}
        />
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
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="border-b border-brown-100 hover:bg-background transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-brown-900">{employee.name}</p>
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
                      employee.role === 'Super Admin' ? getRoleBadgeColor('Admin') : getRoleBadgeColor(employee.role)
                    )}>
                      <span>{employee.role === 'Super Admin' ? getRoleIcon('Admin') : getRoleIcon(employee.role)}</span>
                      <span className="capitalize">{employee.role === 'Super Admin' ? 'Admin' : employee.role}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-brown-600">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {employee.branch ? employee.branch : 'No Branch Assigned'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          // setEditingEmployee(employee)
                          setShowAddModal(true)
                        }}
                        className="p-1 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                        title="Edit Employee"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        // onClick={() => handleDeleteEmployee(employee.id)}
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

      {/* Add/Edit Employee Modal */}
      {/* {showAddModal && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setShowAddModal(false)
            setEditingEmployee(null)
          }}
          onSave={handleSaveEmployee}
        />
      )} */}
    </div>
  )
}