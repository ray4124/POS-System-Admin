import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Download, TrendingUp, FileText, DollarSign, ShoppingBag, Users, Package } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Dashboard() {
  const { profile } = useAuth()
  const [dateRange, setDateRange] = useState('30d')

  const salesData = [
    { date: '2025-01-01', sales: 15200, orders: 89, customers: 67 },
    { date: '2025-01-02', sales: 18500, orders: 102, customers: 78 },
    { date: '2025-01-03', sales: 16800, orders: 95, customers: 71 },
    { date: '2025-01-04', sales: 21200, orders: 118, customers: 89 },
    { date: '2025-01-05', sales: 19600, orders: 108, customers: 82 },
    { date: '2025-01-06', sales: 24800, orders: 135, customers: 98 },
    { date: '2025-01-07', sales: 22400, orders: 125, customers: 91 },
  ]

  const categoryPerformance = [
    { name: 'Coffee', sales: 125600, orders: 892, color: '#38b6ff' },
    { name: 'Food', sales: 98400, orders: 456, color: '#f48e1b' },
    { name: 'Pastries', sales: 45200, orders: 234, color: '#fdf207' },
    { name: 'Beverages', sales: 32100, orders: 167, color: '#932f17' },
  ]

  const hourlyData = [
    { hour: '6 AM', sales: 1200, orders: 8 },
    { hour: '7 AM', sales: 3400, orders: 22 },
    { hour: '8 AM', sales: 5600, orders: 34 },
    { hour: '9 AM', sales: 4200, orders: 28 },
    { hour: '10 AM', sales: 3800, orders: 24 },
    { hour: '11 AM', sales: 4900, orders: 31 },
    { hour: '12 PM', sales: 7200, orders: 45 },
    { hour: '1 PM', sales: 6800, orders: 42 },
    { hour: '2 PM', sales: 5400, orders: 35 },
    { hour: '3 PM', sales: 4600, orders: 29 },
    { hour: '4 PM', sales: 5200, orders: 33 },
    { hour: '5 PM', sales: 6400, orders: 39 },
    { hour: '6 PM', sales: 5800, orders: 37 },
    { hour: '7 PM', sales: 4200, orders: 27 },
    { hour: '8 PM', sales: 2800, orders: 18 },
    { hour: '9 PM', sales: 1600, orders: 12 },
  ]

  const topProducts = [
    { name: 'Cappuccino', sales: 18720, quantity: 156, revenue: 18720 },
    { name: 'Iced Latte', sales: 18090, quantity: 134, revenue: 18090 },
    { name: 'Chicken Sandwich', sales: 17355, quantity: 89, revenue: 17355 },
    { name: 'Espresso', sales: 14450, quantity: 170, revenue: 14450 },
    { name: 'Caesar Salad', sales: 11055, quantity: 67, revenue: 11055 },
    { name: 'Americano', sales: 9800, quantity: 140, revenue: 9800 },
    { name: 'Cheesecake', sales: 6525, quantity: 45, revenue: 6525 },
    { name: 'Croissant', sales: 5600, quantity: 80, revenue: 5600 },
  ]

  const paymentMethods = [
    { name: 'Cash', value: 45, amount: 124560, color: '#932f17' },
    { name: 'GCash', value: 35, amount: 96890, color: '#38b6ff' },
    { name: 'Maya', value: 20, amount: 55340, color: '#f48e1b' },
  ]

  const branchComparison = [
    { branch: 'Main - Makati', sales: 156800, orders: 1243, customers: 892 },
    { branch: 'BGC Branch', sales: 142300, orders: 1156, customers: 834 },
    { branch: 'Ortigas Branch', sales: 98600, orders: 876, customers: 642 },
  ]

  const isMobileOptimized = profile?.role === 'owner'

  const StatCard = ({ title, value, icon: Icon, subtitle, color = 'primary' }: {
    title: string
    value: string | number
    icon: any
    subtitle?: string
    color?: string
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}/10`}>
          <Icon className={`h-6 w-6 text-${color === 'primary' ? 'primary' : color === 'secondary' ? 'secondary' : 'brown-800'}`} />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-brown-900 mb-1">
        {typeof value === 'number' && title.includes('Revenue') ? `₱${value.toLocaleString()}` : value}
      </h3>
      <p className="text-brown-600 text-sm">{title}</p>
      {subtitle && <p className="text-brown-500 text-xs mt-1">{subtitle}</p>}
    </div>
  )

  const exportReport = (format: 'excel' | 'pdf' | 'csv') => {
    // In a real app, this would generate and download the report
    alert(`Exporting report as ${format.toUpperCase()}...`)
  }

  return (
    <div className={`space-y-6 ${isMobileOptimized ? 'p-4' : ''}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-brown-900">Dashboard</h1>
          <p className="text-brown-600">Welcome back, {profile?.full_name}!</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="1d">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select> 
          
          <div className="flex gap-2">
            <button
              onClick={() => exportReport('excel')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={397790}
          icon={DollarSign}
          subtitle="Last 30 days"
        />
        <StatCard
          title="Total Orders"
          value={3275}
          icon={ShoppingBag}
          subtitle="Last 30 days"
        />
        <StatCard
          title="Total Customers"
          value={2368}
          icon={Users}
          subtitle="Unique customers"
        />
        <StatCard
          title="Products Sold"
          value={8942}
          icon={Package}
          subtitle="Total items"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-brown-900">Sales Trend</h2>
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">+12.5%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#efc282" />
              <XAxis 
                dataKey="date" 
                stroke="#932f17"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis stroke="#932f17" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fdf6f5', 
                  border: '1px solid #efc282',
                  borderRadius: '8px'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any, name: string) => [
                  name === 'sales' ? `₱${value.toLocaleString()}` : value,
                  name === 'sales' ? 'Sales' : 'Orders'
                ]}
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

        {/* Category Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
          <h2 className="text-xl font-bold text-brown-900 mb-4">Category Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryPerformance}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="sales"
                label={({ name, value }) => `${name}: ₱${value.toLocaleString()}`}
              >
                {categoryPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Sales']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Sales Pattern */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
        <h2 className="text-xl font-bold text-brown-900 mb-4">Hourly Sales Pattern</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#efc282" />
            <XAxis dataKey="hour" stroke="#932f17" />
            <YAxis stroke="#932f17" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fdf6f5', 
                border: '1px solid #efc282',
                borderRadius: '8px'
              }}
              formatter={(value: any, name: string) => [
                name === 'sales' ? `₱${value.toLocaleString()}` : value,
                name === 'sales' ? 'Sales' : 'Orders'
              ]}
            />
            <Bar dataKey="sales" fill="#38b6ff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-brown-900">Top Products</h2>
            <button
              onClick={() => exportReport('csv')}
              className="text-primary hover:text-primary/80 text-sm flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brown-200 text-left">
                  <th className="py-2 text-brown-800 font-semibold">Product</th>
                  <th className="py-2 text-brown-800 font-semibold">Qty</th>
                  <th className="py-2 text-brown-800 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.slice(0, 8).map((product, index) => (
                  <tr key={product.name} className="border-b border-brown-100">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0 ? 'bg-promo' : index === 1 ? 'bg-secondary' : 'bg-brown-400'
                        }`}>
                          {index + 1}
                        </span>
                        {product.name}
                      </div>
                    </td>
                    <td className="py-2 font-medium">{product.quantity}</td>
                    <td className="py-2 font-bold text-primary">₱{product.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
          <h2 className="text-xl font-bold text-brown-900 mb-4">Payment Methods</h2>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.name} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: method.color }}
                  ></div>
                  <span className="font-medium text-brown-900">{method.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">₱{method.amount.toLocaleString()}</p>
                  <p className="text-sm text-brown-600">{method.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch Comparison */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
        <h2 className="text-xl font-bold text-brown-900 mb-4">Branch Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brown-200">
                <th className="text-left py-3 font-semibold text-brown-800">Branch</th>
                <th className="text-left py-3 font-semibold text-brown-800">Sales</th>
                <th className="text-left py-3 font-semibold text-brown-800">Orders</th>
                <th className="text-left py-3 font-semibold text-brown-800">Customers</th>
                <th className="text-left py-3 font-semibold text-brown-800">Avg. Order</th>
              </tr>
            </thead>
            <tbody>
              {branchComparison.map((branch, index) => (
                <tr key={branch.branch} className="border-b border-brown-100 hover:bg-background transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-promo' : index === 1 ? 'bg-secondary' : 'bg-brown-400'
                      }`}>
                        {index + 1}
                      </span>
                      {branch.branch}
                    </div>
                  </td>
                  <td className="py-3 font-bold text-primary">₱{branch.sales.toLocaleString()}</td>
                  <td className="py-3 font-medium">{branch.orders}</td>
                  <td className="py-3 font-medium">{branch.customers}</td>
                  <td className="py-3 font-medium">₱{Math.round(branch.sales / branch.orders)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
        <h2 className="text-xl font-bold text-brown-900 mb-4">Export Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => exportReport('excel')}
            className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <FileText className="h-6 w-6 text-primary" />
            <div className="text-left">
              <p className="font-semibold text-brown-900">Excel Report</p>
              <p className="text-sm text-brown-600">Detailed spreadsheet</p>
            </div>
          </button>
          
          <button 
            onClick={() => exportReport('pdf')}
            className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-secondary/30 rounded-lg hover:border-secondary hover:bg-secondary/5 transition-colors"
          >
            <FileText className="h-6 w-6 text-secondary" />
            <div className="text-left">
              <p className="font-semibold text-brown-900">PDF Report</p>
              <p className="text-sm text-brown-600">Formatted document</p>
            </div>
          </button>
          
          <button 
            onClick={() => exportReport('csv')}
            className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-brown-300 rounded-lg hover:border-brown-500 hover:bg-brown-50 transition-colors"
          >
            <FileText className="h-6 w-6 text-brown-600" />
            <div className="text-left">
              <p className="font-semibold text-brown-900">CSV Export</p>
              <p className="text-sm text-brown-600">Raw data file</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}