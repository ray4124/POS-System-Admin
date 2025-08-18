import { useState, useEffect, useMemo } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, ShoppingBag, Users, Download, Package, TrendingDown, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import branches from '../mockdata/branches.json'
import branchBrand from '../mockdata/branch_brand.json';
import brands from '../mockdata/brands.json'
import transactions from '../mockdata/transactions.json';
import transactionProducts from '../mockdata/transaction_products.json';
import products from '../mockdata/products.json';
import dayjs from 'dayjs'


export function Reports() {
  const { profile } = useAuth()
  const [dateRange, setDateRange] = useState(7)
  const [dateText, setDateText] = useState(`Last ${dateRange} days`)
  const [branchBrandId, setBranchBrandId] = useState(
    branchBrand.length > 0 ? branchBrand[0].id : 0
  );
  const isMobileOptimized = profile?.role === 'owner'
  const [showHeader, setShowHeader] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const [atTop, setAtTop] = useState(true); // <-- new
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  useEffect(() => {
    const scrollContainer = document.querySelector("main");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;

      setAtTop(scrollTop === 0); // track top position

      if (scrollTop > lastScroll && scrollTop > 50) {
        setShowHeader(false); // hide when scrolling down
      } else if (scrollTop < lastScroll) {
        setShowHeader(true); // show when scrolling up
      }

      setLastScroll(scrollTop);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [lastScroll]); 

  const lowStockList = useMemo(() => {
    return products
      .filter(p => p.stock <= p.alert_at) // low stock condition
      .sort((a, b) => a.stock - b.stock) // sort by stock ascending
      .map(p => {
        const branch = branches.find(b => b.id === p.branch_id)?.name || 'Unknown Branch';
        const brand = brands.find(br => br.id === p.brand_id)?.name || 'Unknown Brand';
        return `${branch} - ${brand}: low stock of ${p.name} remaining ${p.stock}`;
      });
  }, []);

  const StatCard = ({ title, value, icon: Icon, growth, color = 'primary', dateIndicate, tooltipId, activeTooltip, setActiveTooltip }: {
    title: string
    value: string | number
    icon: any
    growth?: number
    color?: string
    dateIndicate: string
    tooltipId?: number
    toolTipText?: string
    activeTooltip?: number | null
    setActiveTooltip?: (id: number | null) => void
  }) => {
    const showTooltip = activeTooltip === tooltipId;
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100 hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg bg-${color}/10`}>
            <Icon className={`h-6 w-6 text-${color === 'primary' ? 'primary' : color === 'error' ? 'error' : 'secondary'}`} />
          </div>
          {growth !== undefined && (
            <div className={`relative flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
              onMouseEnter={() => {
                if (setActiveTooltip) setActiveTooltip(tooltipId ?? null);;
              }}
              onMouseLeave={() => {
                if (setActiveTooltip) setActiveTooltip(null);
              }}
              onClick={() => {
                if (setActiveTooltip) setActiveTooltip(showTooltip ? null : tooltipId ?? null);
              }}
            >
              {growth >= 0 ?
                <TrendingUp className="h-3 w-3" /> :
                <TrendingDown className="h-3 w-3" />
              }
              {growth > 0 ? '+' : ''}{growth.toFixed(2)}%

              {/* Tooltip for growth */}
              {showTooltip && (
                <div className="absolute top-7 w-40 bg-white border border-brown-200 rounded-lg p-2 shadow-lg z-10">
                  <p className="text-sm text-brown-800">
                    {growth >= 0 ? 'Growth' : 'Decline'} based on the previous period of {dateIndicate} for {title}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-brown-900 mb-1">
          {typeof value === 'number' && title.includes('Sales') ? `₱${value.toLocaleString()}` : value}
        </h3>
        <p className="text-brown-600 text-sm">{title}</p>
        <p className="text-brown-500 text-xs mt-1">{dateIndicate}</p>
      </div>
    )
  }

  useEffect(() => {
    setDateText(`Last ${dateRange === 365 ? 'year' : `${dateRange} days`}`)
  }, [dateRange])

  function calculateGrowth(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  function filterTransactionsByBranchBrandAndDateRange(branchBrandId: number, startDate: Date, endDate: Date) {
    return transactions.filter(t => {
      const bb = branchBrand.find(bb => bb.branch_id === t.branch_id);
      if (!bb) return false;

      const tDate = new Date(t.date);
      return bb.id === branchBrandId && tDate >= startDate && tDate <= endDate;
    });
  }

  const {
    totalSales,
    salesGrowth,
    productsSold,
    productsGrowth,
    totalTransactions,
    transactionsGrowth,
    totalInventory
  } = useMemo(() => {
    const now = new Date();

    // Current range
    const currentStart = new Date();
    currentStart.setDate(now.getDate() - dateRange);
    const currentTransactions = filterTransactionsByBranchBrandAndDateRange(branchBrandId, currentStart, now);

    // Previous range
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(currentStart.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - dateRange);
    const previousTransactions = filterTransactionsByBranchBrandAndDateRange(branchBrandId, prevStart, prevEnd);

    // --- Sales ---
    const calcSales = (txList: any[]) => txList.reduce((sum, t) => {
      const relatedProducts = transactionProducts.filter(tp => tp.transaction_id === t.id);
      return sum + relatedProducts.reduce((pSum, tp) => {
        const product = products.find(prod => prod.id === tp.product_id);
        return pSum + (product ? product.price * tp.quantity : 0);
      }, 0);
    }, 0);

    const totalSales = calcSales(currentTransactions);
    const prevSales = calcSales(previousTransactions);
    const salesGrowth = calculateGrowth(totalSales, prevSales);

    // --- Products Sold ---
    const calcProductsSold = (txList: any[]) => txList.reduce((sum, t) => {
      const relatedProducts = transactionProducts.filter(tp => tp.transaction_id === t.id);
      return sum + relatedProducts.reduce((pSum, tp) => pSum + tp.quantity, 0);
    }, 0);

    const productsSold = calcProductsSold(currentTransactions);
    const prevProductsSold = calcProductsSold(previousTransactions);
    const productsGrowth = calculateGrowth(productsSold, prevProductsSold);

    // --- Transactions ---
    const totalTransactions = currentTransactions.length;
    const prevTransactions = previousTransactions.length;
    const transactionsGrowth = calculateGrowth(totalTransactions, prevTransactions);

    // --- Inventory ---
    const totalInventory = products
      .filter(p => {
        const bb = branchBrand.find(bb =>
          bb.branch_id === p.branch_id &&
          bb.brand_id === p.brand_id
        );
        return bb?.id === branchBrandId;
      })
      .reduce((sum, p) => sum + p.stock, 0);

    return {
      totalSales,
      salesGrowth,
      productsSold,
      productsGrowth,
      totalTransactions,
      transactionsGrowth,
      totalInventory
    };
  }, [branchBrandId, dateRange, transactions, transactionProducts, products, branchBrand]);

  // --- 1️⃣ Filter transactions & calculate daily sales ---
  useEffect(() => {
    const startDate = dayjs().subtract(dateRange - 1, "day").startOf("day");
    const endDate = dayjs().endOf("day");

    // Initialize daily buckets
    const salesByDate: Record<string, { sales: number; orders: number }> = {};
    for (let i = 0; i < dateRange; i++) {
      const dayKey = startDate.add(i, "day").format("YYYY-MM-DD");
      salesByDate[dayKey] = { sales: 0, orders: 0 };
    }

    // Filter transactions for selected branch-brand
    const filteredTransactions = transactions.filter(t => {
      const bb = branchBrand.find(bb => bb.branch_id === t.branch_id && bb.id === branchBrandId);
      if (!bb) return false;
      return dayjs(t.date).isBetween(startDate, endDate, null, "[]");
    });

    // Sum sales & orders per day
    filteredTransactions.forEach(t => {
      const tProducts = transactionProducts.filter(tp => tp.transaction_id === t.id);
      const total = tProducts.reduce((sum, tp) => {
        const product = products.find(p => p.id === tp.product_id);
        return product ? sum + product.price * tp.quantity : sum;
      }, 0);

      const dateKey = dayjs(t.date).format("YYYY-MM-DD");
      if (!salesByDate[dateKey]) salesByDate[dateKey] = { sales: 0, orders: 0 };
      salesByDate[dateKey].sales += total;
      salesByDate[dateKey].orders += 1;
    });

    // Convert to array
    const dailyData = Object.entries(salesByDate).map(([date, { sales, orders }]) => ({
      date,
      sales,
      orders
    }));

    setFilteredData(dailyData);
  }, [dateRange, branchBrandId]);

  // --- 2️⃣ Group data for chart points ---
  function getGroupedSalesData(data: any[], dateRange: number) {
    if (!data.length) return [];

    let step = 1;
    if (dateRange > 7) step = Math.ceil(dateRange / 6); // ~6 points

    const grouped = data.filter((_, i) => i % step === 0);
    if (dateRange === 7) return grouped.slice(0, 7);
    if (dateRange === 365) return grouped.slice(0, 6); // yearly: limit to 6 points
    return grouped.slice(0, 6); // 30 or 90 days
  }

  // --- 3️⃣ Prepare grouped data ---
  const groupedData = getGroupedSalesData(filteredData, dateRange);

  // --- 4️⃣ Calculate growth percentage ---
  const salesChangePercent =
    groupedData.length > 1 && groupedData[0].sales !== 0
      ? ((groupedData[groupedData.length - 1].sales - groupedData[0].sales) /
          groupedData[0].sales) *
        100
      : 0;

  const topProducts = useMemo(() => {
    const startDate = dayjs().subtract(dateRange - 1, 'day').startOf('day');
    const endDate = dayjs().endOf('day');

    // Filter transactions
    const filteredTransactions = transactions.filter(t => {
      const bb = branchBrand.find(bb => bb.branch_id === t.branch_id && bb.id === branchBrandId);
      if (!bb) return false;
      return dayjs(t.date).isBetween(startDate, endDate, null, '[]');
    });

    // Aggregate sales
    const productSalesMap: { [key: number]: { name: string; sales: number; revenue: number } } = {};

    filteredTransactions.forEach(t => {
      const tProducts = transactionProducts.filter(tp => tp.transaction_id === t.id);

      tProducts.forEach(tp => {
        const product = products.find(p => p.id === tp.product_id);
        if (!product) return;

        if (!productSalesMap[product.id]) {
          productSalesMap[product.id] = {
            name: product.name,
            sales: 0,
            revenue: 0
          };
        }

        productSalesMap[product.id].sales += tp.quantity;
        productSalesMap[product.id].revenue += product.price * tp.quantity;
      });
    });

    // Sort & limit
    return Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // Top 10 products
  }, [branchBrandId, dateRange]);

  return (
    <div className={`space-y-6 ${isMobileOptimized ? 'p-4' : ''}`}>
      {/* Header */}
      <div
        className={`sticky top-0 z-10 p-4 transition-transform duration-300
        ${showHeader ? "translate-y-0" : "-translate-y-[120%]"}
        ${atTop ? "bg-transparent shadow-none" : "bg-white shadow-md"}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-brown-900">Analytics & Reports</h1>
            <p className="text-brown-600">Comprehensive business insights and data analytics</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={branchBrandId}
              onChange={(e) => setBranchBrandId(Number(e.target.value))}
              className="px-4 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {branchBrand.map((bb) => {
                const branchName = branches.find(b => b.id === bb.branch_id)?.name || `Branch ${bb.branch_id}`;
                const brandName = brands.find(br => br.id === bb.brand_id)?.name || `Brand ${bb.brand_id}`;
                return (
                  <option key={bb.id} value={bb.id}>
                    {branchName} - {brandName}
                  </option>
                );
              })}
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="px-4 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockList.length !== 0 && (
        <div className="bg-error/10 border border-error/20 p-4 rounded-xl animate-pulse-soft">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-error" />
            <div>
              <h3 className="font-semibold text-error">Low Stock Alert</h3>
              {lowStockList.map((item, index) => (
                <p key={index} className="text-error/80 text-sm">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      )} 

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={`₱${totalSales.toLocaleString()}`}
          icon={DollarSign}
          growth={salesGrowth}
          dateIndicate={dateText}
          tooltipId={0}
          activeTooltip={activeTooltip}
          setActiveTooltip={setActiveTooltip}
        />
        <StatCard
          title="Product Sold"
          value={productsSold.toLocaleString()}
          icon={ShoppingBag}
          growth={productsGrowth}
          dateIndicate={dateText}
          tooltipId={1}
          activeTooltip={activeTooltip}
          setActiveTooltip={setActiveTooltip}
        />
        <StatCard
          title="Total Transaction"
          value={totalTransactions.toLocaleString()}
          icon={Users}
          growth={transactionsGrowth}
          dateIndicate={dateText}
          tooltipId={2}
          activeTooltip={activeTooltip}
          setActiveTooltip={setActiveTooltip}
        />
        <StatCard
          title="Total Inventory"
          value={totalInventory.toLocaleString()}
          icon={Package}
          dateIndicate="Total stock of the branch"
        />
      </div>

      {/* Charts Section */}
      <div>
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#efc282" />
              <XAxis 
                dataKey="date" 
                stroke="#932f17"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                padding={{left: 60, right: 60}}
              />
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
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
        <h2 className="text-xl font-bold text-brown-900">Top Selling Products of {branches.find(b => b.id === branchBrandId)?.name || `Branch ${branchBrandId}`}</h2>
        <p className="text-brown-600 mb-4">
          The top products sold in the last {dateRange} days.
        </p>
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
    </div>
  )
}