import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Mail, MapPin, Trash2, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { getEmployees, Employee, createEmployee, updateEmployee, deleteEmployee } from '../api/employeeAPI';
import { Branch, getBranches } from '../api/staticAPI';
import { useAuth } from '../contexts/AuthContext';

interface EmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (employee: Omit<Employee, 'id'>) => void;
  editingEmployee?: Employee | null;
  branches: Branch[];
}

interface DeleteEmployeeModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  employee: Employee | null
  branches: Branch[]
}

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth()

  async function LoadData() {
      const [employeeRes, branchesRes] = await Promise.all([
        getEmployees(),
        getBranches()
      ]);

      setEmployees(employeeRes);
      setBranches(branchesRes);
    }

  useEffect(() => {
    LoadData();
  }, [editingEmployee, showModal, showDeleteModal]);

  const roleStats: Record<string, number> = {
    Owner: 0,
    Admin: 0,
    Staff: 0,
  };

  employees.forEach((emp: Employee) => {
    // normalize roles
    let normalizedRole = emp.role;

    if (normalizedRole === "Super Admin") {
      normalizedRole = "Admin"; // merge into Admin
    }

    roleStats[normalizedRole] =
      (roleStats[normalizedRole] || 0) + 1;
  });

  const getRoleBadgeColor = (role: Employee["role"]) => {
    switch (role) {
      case 'Owner': return 'bg-promo/20 text-brown-900'
      case 'Admin': return 'bg-secondary/10 text-secondary'
      case 'Staff': return 'bg-brown-100 text-brown-800'
      default: return 'bg-brown-100 text-brown-800'
    }
  }

  const getRoleIcon = (role: Employee["role"]) => {
    switch (role) {
      case 'Owner': return '👑'
      case 'Admin': return '👨‍💼'
      case 'Staff': return '💰'
      default: return '👤'
    }
  }

  const filteredEmployees = employees
  .filter((emp: Employee) => {
    const branch = branches.find(b => b.id === emp.branch_id);

    return (
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase()) ||
      branch?.branch_name.toLowerCase().includes(search.toLowerCase())
    );
  })
  .sort((a, b) => {
    // Role priority first
    const roleOrder = ["Owner", "Super Admin", "Admin"];
    const indexA = roleOrder.indexOf(a.role);
    const indexB = roleOrder.indexOf(b.role);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // Branch sorting next
    const branchA = branches.find(br => br.id === a.branch_id)?.branch_name || "No Branch Assigned";
    const branchB = branches.find(br => br.id === b.branch_id)?.branch_name || "No Branch Assigned";

    if (branchA === "No Branch Assigned" && branchB !== "No Branch Assigned") return -1;
    if (branchA !== "No Branch Assigned" && branchB === "No Branch Assigned") return 1;
    if (branchA !== branchB) return branchA.localeCompare(branchB);

    // Finally, sort by role alphabetically for other roles
    return a.role.localeCompare(b.role);
  });

  const EmployeeModal = ({
    open,
    onClose,
    onSaved,
    editingEmployee,
    branches
  }: EmployeeModalProps) => {
    const [form, setForm] = useState<Omit<Employee, 'id'>>({
      name: '',
      email: '',
      role: 'Staff',
      branch_id: branches.length > 0 ? branches[0].id : 0,
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Fill form if editing or auto-select first branch
    useEffect(() => {
      if (editingEmployee) {
        setForm({
          name: editingEmployee.name,
          email: editingEmployee.email,
          role: editingEmployee.role, // keep existing role
          branch_id: editingEmployee.branch_id ?? (branches.length > 0 ? branches[0].id : 0),
        });
      } else {
        setForm({
          name: '',
          email: '',
          role: 'Staff', // auto-select Staff for new employee
          branch_id: branches.length > 0 ? branches[0].id : 0,
        });
      }
    }, [editingEmployee, branches]);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;
      setForm(prev => ({
        ...prev,
        [name]: name === 'branch_id' ? Number(value) : value
      }));
    };

    const validate = () => {
      const newErrors: { [key: string]: string } = {};
      if (!form.name.trim()) newErrors.name = 'Name is required';
      if (!form.email.trim()) newErrors.email = 'Email is required';
      if (!form.role) newErrors.role = 'Role is required';
      if (!form.branch_id) newErrors.branch_id = 'Branch is required';

      setErrors(newErrors);

      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;
      onSaved(form);
    };

    if (!open) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
        onClick={onClose}
      >
        <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h2 className="text-lg font-bold mb-4">
            {editingEmployee ? 'Edit Employee' : 'Add Employee'}
          </h2>
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-3">
              <label className="block mb-1 font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`w-full border p-2 rounded ${errors.name ? 'border-red-500' : ''}`}
                required
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full border p-2 rounded ${errors.email ? 'border-red-500' : ''}`}
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Role */}
            <div className="mb-3">
              <label className="block mb-1 font-medium">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={`w-full border p-2 rounded ${errors.role ? 'border-red-500' : ''}`}
              >
                {profile?.role === "Super Admin" && (
                  <option value="Admin">Admin</option>
                )}
                <option value="Staff">Staff</option>
              </select>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
            </div>

            {/* Branch */}
            <div className="mb-3">
              <label className="block mb-1 font-medium">Branch</label>
              <select
                name="branch_id"
                value={form.branch_id ?? ''}
                onChange={handleChange}
                className={`w-full border p-2 rounded ${errors.branch_id ? 'border-red-500' : ''}`}
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
              {errors.branch_id && <p className="text-red-500 text-xs mt-1">{errors.branch_id}</p>}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
                disabled={loading}
              >
                {loading ? 'Saving' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleSave = (employeeData: Omit<Employee, 'id'>) => {
    setLoading(true);
    if (editingEmployee) {
      // Update existing employee
      updateEmployee(editingEmployee.id.toString(), employeeData)
        .then(() => {
          LoadData();
          setLoading(false);
        })
        .catch(err => console.error(err));
    } else {
      // Create new employee
      createEmployee(employeeData)
        .then(() => {
          LoadData();
          setLoading(false);
        })
        .catch(err => console.error(err));
    }

    // Close modal and reset editing state
    setShowModal(false);
    setEditingEmployee(null);
  };

  const DeleteEmployeeModal = ({ open, onClose, onConfirm, employee, branches }: DeleteEmployeeModalProps) => {
    if (!open || !employee) return null

    const branchName = branches.find(b => b.id === employee.branch_id)?.branch_name || "No Branch Assigned"

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold mb-4 text-red-600">Confirm Delete</h2>
          <p className="mb-2">Are you sure you want to delete the following employee?</p>

          <div className="mb-4 space-y-1">
            <p><strong>Name:</strong> {employee.name}</p>
            <p><strong>Email:</strong> {employee.email}</p>
            <p><strong>Role:</strong> {employee.role}</p>
            <p><strong>Branch:</strong> {branchName}</p>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded"
              disabled={loading}
            >
              {loading ? 'Deleting' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleDeleteClick = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setLoading(true);
    if (editingEmployee) {
      await deleteEmployee(editingEmployee.id.toString()).then(() => {
        LoadData()
      })
    }
      
    setShowDeleteModal(false)
    setEditingEmployee(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Employee Management</h1>
          <p className="text-brown-600">Manage your team members and their access levels</p>
        </div>
        
        <button
          onClick={() => {setShowModal(true); setEditingEmployee(null)}}
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
              <span className="text-2xl">{getRoleIcon(role as Employee["role"])}</span>
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
                        {employee.branch_id
                          ? branches.find(b => b.id === employee.branch_id)?.branch_name || "Unknown Branch"
                          : "No Branch Assigned"
                        }
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {employee.role !== 'Owner' && employee.role !== 'Super Admin' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingEmployee(employee)
                            setShowModal(true)
                          }}
                          className="p-1 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                          title="Edit Employee"
                        >
                          <Edit className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(employee)}
                          className="p-1 text-error hover:bg-error hover:text-white rounded transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="h-6 w-6" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      <EmployeeModal
        open={showModal}
        onClose={() => {setShowModal(false); setEditingEmployee(null)}}
        onSaved={handleSave}
        editingEmployee={editingEmployee ? editingEmployee : null}
        branches={branches}
      />

      {/* Delete Employee Modal */}
      <DeleteEmployeeModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        employee={editingEmployee}
        branches={branches}
      />
    </div>
  )
}