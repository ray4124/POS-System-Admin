import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, FileText, DollarSign, ShoppingBag, Package, Receipt, TrendingDown, CalendarArrowDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import salesData from '../mockdata/salesData365.json';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'

export function Dashboard() {
  const { profile } = useAuth()
  const [dateRange, setDateRange] = useState(30)
  const [dateText, setDateText] = useState(`Last ${dateRange} days`);
  const [filteredData, setFilteredData] = useState<
    {
      quantity_sold: number; product_name: string, date: string; sales: number; sold: number; transactions: number; PayMethod: string 
}[]
  >([]);
  const [HPD, setHPD] = useState(new Date(new Date().setDate(new Date().getDate() - 1)));
  const [hourlyData, setHourlyData] = useState<{ hour: string; sales: number; orders: number }[]>([]);

  // Helper functions
  const formatHourLabel = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour} ${period}`;
  };

  const convertLabelTo24Hour = (label: string): number => {
    const [hourStr, period] = label.split(" ");
    let hour = parseInt(hourStr, 10);
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return hour;
  };

  const formatHourlySalesData = (data: typeof salesData, date: Date) => {
    const hourlyMap: { [key: string]: { sales: number; orders: number } } = {};
    
    data.forEach(entry => {
      const entryDate = new Date(entry.date);
    
      const isSameDay =
        entryDate.getFullYear() === date.getFullYear() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getDate() === date.getDate();
    
      if (isSameDay) {
        const hour = entryDate.getHours();
        const label = formatHourLabel(hour); // e.g., "2 PM"
      
        if (!hourlyMap[label]) {
          hourlyMap[label] = { sales: 0, orders: 0 };
        }
      
        hourlyMap[label].sales += entry.sales;
        hourlyMap[label].orders += 1; // ✅ Each entry = 1 order
      }
    });
  
    return Object.entries(hourlyMap)
      .map(([hour, values]) => ({
        hour,
        sales: values.sales,
        orders: values.orders,
      }))
      .sort((a, b) => convertLabelTo24Hour(a.hour) - convertLabelTo24Hour(b.hour));
  };

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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}/10`}>
          <Icon className={`h-6 w-6 text-${color === 'primary' ? 'primary' : color === 'secondary' ? 'secondary' : 'brown-800'}`} />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-1">
        {typeof value === 'number' && title.includes('Revenue') ? `₱${value.toLocaleString()}` : value}
      </h3>
      <p className="text-gray-800 text-sm">{title}</p>
      {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  )

  const exportReport = (format: 'excel' | 'pdf' | 'csv') => {
    // In a real app, this would generate and download the report
    alert(`Exporting report as ${format.toUpperCase()}...`)
  }

  useEffect(() => {
    const now = dayjs();
    
    const filtered = salesData
      .filter(item => dayjs(item.date).isAfter(now.subtract(dateRange, 'day')))
      .map(item => ({
        ...item,
        sales: Number(item.sales),           // Ensure numeric sales
        sold: Number(item.quantity_sold),    // Products sold in this transaction
        transactions: 1,                     // One transaction per row
        date: dayjs(item.date).format('YYYY-MM-DD'), // Normalize for grouping
      }))
      .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix()); // Ascending date
    
    setFilteredData(filtered);
    setDateText(`Last ${dateRange === 365 ? "12 months" : `${dateRange} days`}`);
  }, [dateRange]);


  const stats = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => {
        acc.sales += curr.sales;
        acc.sold += curr.sold;
        acc.transactions += 1;

        const method = curr.PayMethod === 'E-wallet' ? 'E-wallet' : 'Cash';

        acc.paymentCounts[method] = (acc.paymentCounts[method] || 0) + 1;
        acc.paymentSales[method] = (acc.paymentSales[method] || 0) + curr.sales;

        return acc;
      },
      {
        sales: 0,
        sold: 0,
        transactions: 0,
        paymentCounts: {
          Cash: 0,
          'E-wallet': 0
        },
        paymentSales: {
          Cash: 0,
          'E-wallet': 0
        }
      }
    );
  }, [filteredData]);
  

  function getGroupedSalesData(data: any[], dateRange: number) {
    const now = dayjs();
    const startDate = now.subtract(dateRange, 'day');

    // Filter data within date range
    const filtered = data.filter(item => dayjs(item.date).isAfter(startDate));

    // 365-day logic is fine
    if (dateRange === 365) {
      const buckets: Record<string, any> = {};

      filtered.forEach(item => {
        const d = dayjs(item.date);
        const year = d.year();
        const month = d.month(); // 0-based
        const bucketMonth = Math.floor(month / 2) * 2;
        const bucketKey = dayjs(new Date(year, bucketMonth, 1)).format('YYYY-MM-DD');

        if (!buckets[bucketKey]) {
          buckets[bucketKey] = item;
        }
      });

      return Object.values(buckets).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // For 7, 30, 90 days — group by date intervals
    let step = 1;
    if (dateRange === 30) step = 5;
    else if (dateRange === 90) step = 15;

    const groupedMap: Record<string, any> = {};

    filtered.forEach(item => {
      const d = dayjs(item.date);
      const bucketDate = d.startOf('day').subtract(d.day() % step, 'day').format('YYYY-MM-DD');
      if (!groupedMap[bucketDate]) {
        groupedMap[bucketDate] = item;
      }
    });

    return Object.values(groupedMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  const groupedData = getGroupedSalesData(filteredData, dateRange);

  const salesChangePercent = useMemo(() => {
    if (!groupedData.length) return 0;

    const firstSales = groupedData[0].sales;
    const lastSales = groupedData[groupedData.length - 1].sales;

    if (firstSales === 0) return 0; // avoid division by zero

    return ((lastSales - firstSales) / firstSales) * 100;
  }, [filteredData, dateRange]);

  const handleSalesDateChange = (date: Date | null) => {
    if (!date) return;
    setHPD(date);
    const newData = formatHourlySalesData(salesData, date);
    setHourlyData(newData);
  };

  useEffect(() => {
    const newData = formatHourlySalesData(salesData, HPD);
    setHourlyData(newData);
  }, [HPD]);

  const totalSales = stats.paymentSales['Cash'] + stats.paymentSales['E-wallet'];

  const paymentMethods = [
    {
      name: 'Cash',
      amount: stats.paymentSales['Cash'],
      value: totalSales > 0
        ? Math.round((stats.paymentSales['Cash'] / totalSales) * 100)
        : 0,
      color: 'green' // Gold
    },
    {
      name: 'E-wallet',
      amount: stats.paymentSales['E-wallet'],
      value: totalSales > 0
        ? Math.round((stats.paymentSales['E-wallet'] / totalSales) * 100)
        : 0,
      color: 'blue' // Blue
    }
  ];

  const topProducts = useMemo(() => {
    const grouped: Record<string, { name: string; quantity: number; revenue: number }> = {};

    filteredData.forEach(item => {
      if (!grouped[item.product_name]) {
        grouped[item.product_name] = {
          name: item.product_name,
          quantity: 0,
          revenue: 0,
        };
      }

      grouped[item.product_name].quantity += item.quantity_sold;
      grouped[item.product_name].revenue += item.sales;
    });

    return Object.values(grouped)
      .sort((a, b) => b.quantity - a.quantity) // or b.revenue - a.revenue
      .slice(0, 10); // top 10 to allow slicing later
  }, [filteredData]);

  return (
    <div className={`space-y-6 ${isMobileOptimized ? 'p-4' : ''}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {profile?.full_name}!</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))} // Cast to number
            className="px-4 py-2 border border-[#1F2937] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
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
          value={stats.sales}
          icon={DollarSign}
          subtitle={dateText}
        />
        <StatCard
          title="Product Sold"
          value={stats.sold}
          icon={ShoppingBag}
          subtitle={dateText}
        />
        <StatCard
          title="Total Transactions"
          value={stats.transactions}
          icon={Receipt}
          subtitle={dateText}
        />
        <StatCard
          title="Total Inventory"
          value={8942}
          icon={Package}
          subtitle={dateText}
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-brown-900">Sales Trend</h2>
            <div className="flex items-center gap-2" style={{ color: salesChangePercent >= 0 ? 'green' : 'red' }}>
              {salesChangePercent >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {salesChangePercent >= 0 ? '+' : ''}
                {salesChangePercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={groupedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
              <XAxis 
                dataKey="date" 
                stroke="#1F2937"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                padding={{left: 60, right: 60}}
              />
              <YAxis stroke="#1F2937" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fdf6f5', 
                  border: '1px solid #efc282',
                  borderRadius: '8px'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [
                  name === 'sales' ? `₱${value.toLocaleString()}` : value,
                  name === 'sales' ? 'Sales' : 'Orders'
                ]}
              />
              <Line 
                type="monotone"
                dataKey="sales"
                stroke="#38b6ff"
                strokeWidth={3}
                dot={{ fill: '#38b6ff', r: 6, stroke: '#38b6ff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Sales Pattern */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
        <div className="flex flex-row justify-between">
          <h2 className="text-xl font-bold text-brown-900 mb-4">Hourly Sales Pattern</h2>
          <div className="relative w-full max-w-[200px]">
            <DatePicker
              selected={HPD}
              onChange={(date) => handleSalesDateChange(date || new Date())}
              className="w-full border p-2 pr-10 rounded-md"
              maxDate={new Date(new Date().setDate(new Date().getDate() - 1))}
              minDate={new Date(new Date().setDate(new Date().getDate() - 31))}
              popperPlacement="bottom-end"
              calendarClassName="z-20"
            />
            <CalendarArrowDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#999999" />
            <XAxis dataKey="hour" stroke="black" />
            <YAxis stroke="black" />
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
          <h2 className="text-xl font-bold text-gray-800">Payment Methods</h2>
          <p className='text-sm text-gray-500 mb-4'>{dateText}</p>
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