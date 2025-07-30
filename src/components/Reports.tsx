import { useState } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, ShoppingBag, Users, AlertTriangle, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface DashboardStats {
  totalSales: number
  totalOrders: number
  totalCustomers: number
  lowStockItems: number
  salesGrowth: number
  ordersGrowth: number
}

const salesData = [
  { date: 'Mon', sales: 12500 },
  { date: 'Tue', sales: 15800 },
  { date: 'Wed', sales: 18200 },
  { date: 'Thu', sales: 16900 },
  { date: 'Fri', sales: 22400 },
  { date: 'Sat', sales: 28600 },
  { date: 'Sun', sales: 25100 },
]

const categoryData = [
  { name: 'Coffee', value: 45, color: '#38b6ff' },
  { name: 'Food', value: 35, color: '#f48e1b' },
  { name: 'Pastries', value: 20, color: '#fdf207' },
]

const topProducts = [
  { name: 'Cappuccino', sales: 156, revenue: 18720 },
  { name: 'Chicken Sandwich', sales: 89, revenue: 17355 },
  { name: 'Iced Latte', sales: 134, revenue: 18090 },
  { name: 'Caesar Salad', sales: 67, revenue: 11055 },
  { name: 'Cheesecake', sales: 45, revenue: 6525 },
]

export function Reports() {
  const { profile } = useAuth()
  const [stats, _] = useState<DashboardStats>({
    totalSales: 139250,
    totalOrders: 1247,
    totalCustomers: 892,
    lowStockItems: 8,
    salesGrowth: 12.5,
    ordersGrowth: 8.3
  })
  const [dateRange, setDateRange] = useState('7d')

  const isMobileOptimized = profile?.role === 'owner'

  const StatCard = ({ title, value, icon: Icon, growth, color = 'primary' }: {
    title: string
    value: string | number
    icon: any
    growth?: number
    color?: string
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}/10`}>
          <Icon className={`h-6 w-6 text-${color === 'primary' ? 'primary' : color === 'error' ? 'error' : 'secondary'}`} />
        </div>
        {growth !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <TrendingUp className="h-3 w-3" />
            {growth > 0 ? '+' : ''}{growth}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-brown-900 mb-1">
        {typeof value === 'number' && title.includes('Sales') ? `₱${value.toLocaleString()}` : value}
      </h3>
      <p className="text-brown-600 text-sm">{title}</p>
    </div>
  )

  return (
    <div className={`space-y-6 ${isMobileOptimized ? 'p-4' : ''}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-brown-900">Analytics & Reports</h1>
          <p className="text-brown-600">Comprehensive business insights and data analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="1d">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={stats.totalSales}
          icon={DollarSign}
          growth={stats.salesGrowth}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          growth={stats.ordersGrowth}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={AlertTriangle}
          color="error"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
          <h2 className="text-xl font-bold text-brown-900 mb-4">Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#efc282" />
              <XAxis dataKey="date" stroke="#932f17" />
              <YAxis stroke="#932f17" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fdf6f5', 
                  border: '1px solid #efc282',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#38b6ff" 
                strokeWidth={3}
                dot={{ fill: '#38b6ff', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
          <h2 className="text-xl font-bold text-brown-900 mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
        <h2 className="text-xl font-bold text-brown-900 mb-4">Top Selling Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brown-200">
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Units Sold</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.name} className="border-b border-brown-100 hover:bg-background transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-promo' : index === 1 ? 'bg-secondary' : 'bg-brown-400'
                      }`}>
                        {index + 1}
                      </span>
                      {product.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{product.sales}</td>
                  <td className="py-3 px-4 font-bold text-primary">₱{product.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockItems > 0 && (
        <div className="bg-error/10 border border-error/20 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-error" />
            <div>
              <h3 className="font-semibold text-error">Low Stock Alert</h3>
              <p className="text-error/80 text-sm">
                {stats.lowStockItems} items are running low on stock. Check inventory for details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}