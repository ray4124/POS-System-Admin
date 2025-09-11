import { useState, useEffect, useMemo } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, ShoppingBag, Users, Download, Package, TrendingDown, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import dayjs from 'dayjs'
import { Product, getProducts } from '../api/productAPI'
import {
  Branch,
  getBranches,
  Brand,
  getBrands,
  BranchBrand, 
  getBranchBrands, 
  Transaction, 
  getTransactions, 
  TransactionProduct, 
  getTransactionProducts
} from '../api/staticAPI'


export function Reports() {
  // states for API data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionProducts, setTransactionProducts] = useState<TransactionProduct[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [branchBrands, setBranchBrands] = useState<BranchBrand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // const for page functionality
  const { profile } = useAuth()
  const [dateRange, setDateRange] = useState(7)
  const [dateText, setDateText] = useState(`Last ${dateRange} days`)
  const [branchBrandId, setBranchBrandId] = useState(
    branchBrands.length > 0 ? branchBrands[0].id : 0
  );
  const isMobileOptimized = profile?.role === 'Owner'
  const [showHeader, setShowHeader] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const [atTop, setAtTop] = useState(true); // <-- new
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        const [fetchedBranches, fetchedBrands, fetchedBranchBrands, fetchedTransactions, fetchedTransactionProducts, fetchedProducts] = await Promise.all([
          getBranches(),
          getBrands(),
          getBranchBrands(),
          getTransactions(),
          getTransactionProducts(),
          getProducts()
        ]);
        setBranches(fetchedBranches);
        setBrands(fetchedBrands);
        setBranchBrands(fetchedBranchBrands);
        setTransactions(fetchedTransactions);
        setTransactionProducts(fetchedTransactionProducts);
        setProducts(fetchedProducts);
        if (fetchedBranchBrands.length > 0) {
          setBranchBrandId(fetchedBranchBrands[0].id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

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
        // find relation row
        const relation = branchBrands.find(bb => bb.id === p.branch_brand_id);

        const branch = branches.find(b => b.id === relation?.branch_id)?.branch_name || 'Unknown Branch';
        const brand = brands.find(br => br.id === relation?.brand_id)?.brand_name || 'Unknown Brand';

        return `${branch} - ${brand}: low stock of ${p.product_name} remaining ${p.stock}`;
      });
  }, [products, branches, brands, branchBrands]);

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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
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
        <h3 className="text-2xl font-bold text-gray-800 mb-1">
          {typeof value === 'number' && title.includes('Sales') ? `₱${value.toLocaleString()}` : value}
        </h3>
        <p className="text-gray-800 text-sm">{title}</p>
        <p className="text-gray-500 text-xs mt-1">{dateIndicate}</p>
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

  function filterTransactionsByBranchBrandAndDateRange(
    branchBrandId: number,
    startDate: Date,
    endDate: Date
  ) {
    // Build a dictionary for faster product lookups
    const productMap: Record<number, number> = {};
    products.forEach((p) => {
      productMap[p.id] = p.branch_brand_id;
    });

    return transactions.filter((t) => {
      const tDate = new Date(t.created_at);
      if (tDate < startDate || tDate > endDate) return false;

      // get products for this transaction
      const tProducts = transactionProducts.filter(
        (tp) => tp.transaction_id === t.id
      );

      // check if at least one product matches the branchBrandId
      return tProducts.some(
        (tp) => productMap[tp.product_id] === branchBrandId
      );
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

    // --- Current range ---
    const currentStart = new Date();
    currentStart.setDate(now.getDate() - dateRange);
    const currentTransactions = filterTransactionsByBranchBrandAndDateRange(branchBrandId, currentStart, now);

    // --- Previous range ---
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

    // --- Inventory (direct branch_brand_id filter) ---
    const totalInventory = products
      .filter(p => p.branch_brand_id === branchBrandId)
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
  }, [branchBrandId, dateRange, transactions, transactionProducts, products]);

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

    // Build lookup for product → branch_brand
    const productMap: Record<number, number> = {};
    products.forEach((p) => {
      productMap[p.id] = p.branch_brand_id;
    });

    // Filter transactions for selected branch-brand
    const filteredTransactions = transactions.filter((t) => {
      const tDate = dayjs(t.created_at);
      if (!tDate.isBetween(startDate, endDate, null, "[]")) return false;

      const tProducts = transactionProducts.filter((tp) => tp.transaction_id === t.id);

      // Check if any product belongs to this branchBrandId
      return tProducts.some((tp) => productMap[tp.product_id] === branchBrandId);
    });

    // Sum sales & orders per day
    filteredTransactions.forEach((t) => {
      const tProducts = transactionProducts.filter((tp) => tp.transaction_id === t.id);

      const total = tProducts.reduce((sum, tp) => {
        const product = products.find((p) => p.id === tp.product_id);
        return product ? sum + product.price * tp.quantity : sum;
      }, 0);

      const dateKey = dayjs(t.created_at).format("YYYY-MM-DD");
      if (!salesByDate[dateKey]) salesByDate[dateKey] = { sales: 0, orders: 0 };
      salesByDate[dateKey].sales += total;
      salesByDate[dateKey].orders += 1;
    });

    // Convert to array
    const dailyData = Object.entries(salesByDate).map(
      ([date, { sales, orders }]) => ({
        date,
        sales,
        orders,
      })
    );

    setFilteredData(dailyData);
  }, [dateRange, branchBrandId, transactions, transactionProducts, products]);

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
    const startDate = dayjs().subtract(dateRange - 1, "day").startOf("day");
    const endDate = dayjs().endOf("day");

    // Build product → branch_brand map
    const productMap: Record<number, { branchBrandId: number; name: string; price: number }> = {};
    products.forEach((p) => {
      productMap[p.id] = { branchBrandId: p.branch_brand_id, name: p.product_name, price: p.price };
    });

    // Filter transactions (only those with at least one product from branchBrandId in range)
    const filteredTransactions = transactions.filter((t) => {
      const tDate = dayjs(t.created_at);
      if (!tDate.isBetween(startDate, endDate, null, "[]")) return false;

      const tProducts = transactionProducts.filter((tp) => tp.transaction_id === t.id);
      return tProducts.some((tp) => productMap[tp.product_id]?.branchBrandId === branchBrandId);
    });

    // Aggregate sales
    const productSalesMap: Record<number, { name: string; sales: number; revenue: number }> = {};

    filteredTransactions.forEach((t) => {
      const tProducts = transactionProducts.filter((tp) => tp.transaction_id === t.id);

      tProducts.forEach((tp) => {
        const product = productMap[tp.product_id];
        if (!product) return;
        if (product.branchBrandId !== branchBrandId) return; // ✅ Only count products for this branchBrandId

        if (!productSalesMap[tp.product_id]) {
          productSalesMap[tp.product_id] = {
            name: product.name,
            sales: 0,
            revenue: 0,
          };
        }

        productSalesMap[tp.product_id].sales += tp.quantity;
        productSalesMap[tp.product_id].revenue += product.price * tp.quantity;
      });
    });

    // Sort & limit
    return Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 products
  }, [branchBrandId, dateRange, transactions, transactionProducts, products]);

  const branchBrand = branchBrands.find(bb => bb.id === branchBrandId);
  const branchName = branchBrand ? branches.find(b => b.id === branchBrand.branch_id)?.branch_name : null;
  const brandName = branchBrand ? brands.find(br => br.id === branchBrand.brand_id)?.brand_name : null;

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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Analytics & Reports</h1>
            <p className="text-gray-500">Comprehensive business insights and data analytics</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={branchBrandId}
              onChange={(e) => setBranchBrandId(Number(e.target.value))}
              className="px-4 py-2 border border-[#1F2937] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {branchBrands.map((bb) => {
                const branchName = branches.find(b => b.id === bb.branch_id)?.branch_name || `Branch ${bb.branch_id}`;
                const brandName = brands.find(br => br.id === bb.brand_id)?.brand_name || `Brand ${bb.brand_id}`;
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
              className="px-4 py-2 border border-[#1F2937] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Sales Trend</h2>
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
        <h2 className="text-xl font-bold text-gray-800">
          Top Selling Products of {brandName && branchName ? `${branchName} - ${brandName}` : `BranchBrand ${branchBrandId}`}
        </h2>
        <p className="text-gray-600 mb-4">
          The top products sold in the last {dateRange} days.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F2937]">
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Units Sold</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.name} className="border-b border-[#1F2937] hover:bg-background transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-promo' : index === 1 ? 'bg-secondary' : 'bg-brown-400'
                      }`}>
                        {index + 1}
                      </span>
                      <p className='text-gray-700'>{product.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-700">{product.sales}</td>
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