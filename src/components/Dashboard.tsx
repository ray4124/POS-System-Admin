import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, DollarSign, ShoppingBag, Package, Receipt, TrendingDown, CalendarArrowDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  getBranches,
  Branch,
  getBrands,
  Brand,
  getBranchBrands,
  BranchBrand,
  getTransactions,
  Transaction,
  getTransactionProducts,
  TransactionProduct
} from '../api/staticAPI';
import { getProducts, Product } from '../api/productAPI';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);


interface ProductSales {[ productId: number ]: number; }
interface BranchBrandPerformance {
  branch_id: number;
  brand_id: number;
  sales: number;
  orders: number;
  customers: number;
}

export function Dashboard() {
  // states for API data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionProducts, setTransactionProducts] = useState<TransactionProduct[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [branchBrands, setBranchBrands] = useState<BranchBrand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Const for page functionality
  const { profile } = useAuth();
  const [dateRange, setDateRange] = useState(7);
  const [dateText, setDateText] = useState(`Last ${dateRange} days`);
  const [filteredData, setFilteredData] = useState<{ date: string; sales: number; orders: number }[]>([]);
  const [HPD, setHPD] = useState(new Date(new Date().setDate(new Date().getDate() - 1)));
  const [hourlyData, setHourlyData] = useState<{ hour: string; sales: number; orders: number }[]>([]);
  const isMobileOptimized = profile?.role === 'Owner'
  const [showHeader, setShowHeader] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const [atTop, setAtTop] = useState(true); // <-- new

  useEffect(() => {
    // Fetch all data in parallel
    const fetchData = async () => {
      try {
        const [branchesData, brandsData, branchBrandData, transactionsData, transactionProductsData, productsData] = await Promise.all([
          getBranches(),
          getBrands(),
          getBranchBrands(),
          getTransactions(),
          getTransactionProducts(),
          getProducts()
        ]);

        setBranches(branchesData);
        setBrands(brandsData);
        setBranchBrands(branchBrandData);
        setTransactions(transactionsData);
        setTransactionProducts(transactionProductsData);
        setProducts(productsData);
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

  const stats = useMemo(() => {
    setDateText(`Last ${dateRange === 365 ? "year" : `${dateRange} days`} `);

    // date range window
    const start = dayjs().subtract(dateRange, "day").startOf("day").valueOf();
    const end = dayjs().endOf("day").valueOf();

    // 1) transactions inside the date range AND with status Completed
    const txInRange: Transaction[] = (transactions as Transaction[]).filter((tx) => {
      const t = dayjs(tx.created_at).valueOf();
      return (
        t >= start &&
        t <= end &&
        tx.status === "Completed" // ✅ only include completed
      );
    });

    // 2) unique transaction ids in range
    const txIds = new Set(txInRange.map((t) => t.id));

    // 3) transaction products belonging to those transactions
    const tpsInRange: TransactionProduct[] = (transactionProducts as TransactionProduct[]).filter((tp) =>
      txIds.has(tp.transaction_id)
    );

    // 4) total revenue = SUM of net_amount (instead of TP calc)
    const totalRevenue = txInRange.reduce(
      (sum, tx) => sum + (tx.net_amount ?? 0),
      0
    );

    // 5) total products sold = sum(quantity) across TP
    const totalProductsSold = tpsInRange.reduce(
      (sum, tp) => sum + tp.quantity,
      0
    );

    // 6) total transactions = number of completed transactions in range
    const totalTransactions = txInRange.length;

    // 7) total inventory = sum of stock for all products (regardless of date)
    const totalInventory = (products as Product[]).reduce(
      (sum, p) => sum + (p.stock ?? 0),
      0
    );

    // 8) Payment method breakdown
    const paymentCounts: Record<string, number> = {};
    const paymentSales: Record<string, number> = {};
    txInRange.forEach((tx) => {
      const method = tx.payment_method ?? "Unknown";
      paymentCounts[method] = (paymentCounts[method] || 0) + 1;
      paymentSales[method] = (paymentSales[method] || 0) + (tx.net_amount ?? 0);
    });

    return {
      sales: totalRevenue, // ✅ now net total
      sold: totalProductsSold,
      transactions: totalTransactions,
      inventory: totalInventory,
      paymentCounts,
      paymentSales,
    };
  }, [dateRange, transactions, transactionProducts, products]);

  useEffect(() => {
    const startDate = dayjs().subtract(dateRange - 1, "day").startOf("day");
    const endDate = dayjs().endOf("day");

    // Step 1: Filter only transactions in date range + completed ones
    const filteredTransactions = transactions.filter(
      (t) =>
        t.status === "Completed" &&
        dayjs(t.created_at).isBetween(startDate, endDate, null, "[]")
    );

    const validTransactionIds = new Set(filteredTransactions.map((t) => t.id));

    // Step 2: Aggregate sales per day, per branch, per brand
    type SalesStat = { sales: number; orders: Set<number> };
    const salesByDate: Record<
      string,
      Record<string, SalesStat>
    > = {}; 
    // Example: salesByDate["2025-08-20"]["1-3"] = { sales: 1200, orders: Set(2) }

    transactionProducts.forEach((tp) => {
      if (!validTransactionIds.has(tp.transaction_id)) return;

      const product = products.find((p) => p.id === tp.product_id);
      if (!product) return;

      const branchBrand = branchBrands.find((bb) => bb.id === product.branch_brand_id);
      if (!branchBrand) return;

      const dateKey = dayjs(
        filteredTransactions.find((t) => t.id === tp.transaction_id)?.created_at
      ).format("YYYY-MM-DD");

      const branchBrandKey = `${branchBrand.branch_id}-${branchBrand.brand_id}`;

      if (!salesByDate[dateKey]) salesByDate[dateKey] = {};
      if (!salesByDate[dateKey][branchBrandKey]) {
        salesByDate[dateKey][branchBrandKey] = { sales: 0, orders: new Set() };
      }

      // Add sales (subtotal from schema)
      salesByDate[dateKey][branchBrandKey].sales += tp.subtotal;
      // Track orders per transaction (avoid double counting)
      salesByDate[dateKey][branchBrandKey].orders.add(tp.transaction_id);
    });

    // Step 3: Build chart data, filling missing days
    const chartData: {
      date: string;
      branch_id: number;
      brand_id: number;
      sales: number;
      orders: number;
    }[] = [];

    for (let i = 0; i < dateRange; i++) {
      const currentDate = startDate.add(i, "day").format("YYYY-MM-DD");

      if (salesByDate[currentDate]) {
        Object.entries(salesByDate[currentDate]).forEach(([key, val]) => {
          const [branch_id, brand_id] = key.split("-").map(Number);
          chartData.push({
            date: currentDate,
            branch_id,
            brand_id,
            sales: val.sales,
            orders: val.orders.size,
          });
        });
      } else {
        // no sales on this day = still push (good for charts)
        chartData.push({
          date: currentDate,
          branch_id: 0, // or null if you want
          brand_id: 0,
          sales: 0,
          orders: 0,
        });
      }
    }

    setFilteredData(chartData);
  }, [dateRange, transactions, transactionProducts, products, branchBrands]);


  function getGroupedSalesData(data: any[], dateRange: number) {
    const now = dayjs();
    const startDate = now.subtract(dateRange, "day");

    // Filter and sort
    const filtered = data
      .filter(item => dayjs(item.date).isAfter(startDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (dateRange === 365) {
      // Group by 2-month buckets
      const buckets: Record<string, any> = {};

      filtered.forEach(item => {
        const d = dayjs(item.date);
        const year = d.year();
        const month = Math.floor(d.month() / 2) * 2; // start month of the bucket
        const bucketKey = dayjs(new Date(year, month, 1)).format("YYYY-MM-DD");

        if (!buckets[bucketKey]) {
          buckets[bucketKey] = item; // first occurrence in this bucket
        }
      });

      return Object.values(buckets)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6); // Ensure only 6 points
    }

    // Step sizes for 7, 30, 90 days
    let step = 1;
    if (dateRange === 30) step = 5;
    else if (dateRange === 90) step = 15;

    const grouped = [];
    for (let i = 0; i < filtered.length; i += step) {
      grouped.push(filtered[i]);
    }

    return dateRange === 7 ? grouped.slice(0, 7) : grouped.slice(0, 6);
  }

  const groupedData = getGroupedSalesData(filteredData, dateRange);

  const salesChangePercent =
    groupedData.length > 1 && groupedData[0].sales !== 0
      ? ((groupedData[groupedData.length - 1].sales - groupedData[0].sales) /
          groupedData[0].sales) *
        100
      : 0;
  
  useEffect(() => {
    if (!HPD) return;
  
    // Step 1: Validate selected date (only yesterday to 31 days ago allowed)
    const yesterday = dayjs().subtract(1, "day").endOf("day");
    const minDate = dayjs().subtract(31, "day").startOf("day");
    const selectedDate = dayjs(HPD).startOf("day");
  
    if (selectedDate.isAfter(yesterday) || selectedDate.isBefore(minDate)) {
      setHourlyData([]);
      return;
    }
  
    // Step 2: Filter only completed transactions for that day
    const dayTransactions = transactions.filter(
      t =>
        t.status === "Completed" &&
        dayjs(t.created_at).isSame(selectedDate, "day")
    );
  
    // Step 3: Initialize only 10AM to 10PM
    const hourly: Record<string, { sales: number; orders: number }> = {};
    for (let h = 10; h <= 22; h++) {
      hourly[String(h).padStart(2, "0")] = { sales: 0, orders: 0 };
    }
  
    // Step 4: Process transactions (only if inside 10AM–10PM)
    dayTransactions.forEach(t => {
      const hour = dayjs(t.created_at).hour();
      if (hour < 10 || hour > 22) return; // skip outside range
    
      const hourKey = String(hour).padStart(2, "0");
    
      // Get products for this transaction
      const tProducts = transactionProducts.filter(
        tp => tp.transaction_id === t.id
      );
    
      // Use subtotal instead of price*qty
      const transactionTotal = tProducts.reduce((sum, tp) => sum + tp.subtotal, 0);
    
      hourly[hourKey].sales += transactionTotal;
      hourly[hourKey].orders += 1;
    });
  
    // Step 5: Convert to array & format hours
    const chartData = Object.keys(hourly)
      .sort((a, b) => Number(a) - Number(b)) // ensure order
      .map(hour => {
        const h = Number(hour);
        let label = `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`; // 10→10AM, 12→12PM, 22→10PM
        return {
          hour: label,
          sales: hourly[hour].sales,
          orders: hourly[hour].orders,
        };
      });
    
    setHourlyData(chartData);
  }, [HPD, transactions, transactionProducts]);

  const productSales: ProductSales = {};

  // Sum up quantities sold per productId
  transactionProducts.forEach(tp => {
    if (!productSales[tp.product_id]) {
      productSales[tp.product_id] = 0;
    }
    productSales[tp.product_id] += tp.quantity;
  });

  // Convert to array with product names
  function getTopProducts(
    days: number,
    transactions: Transaction[],
    transactionProducts: TransactionProduct[],
    products: Product[]
  ) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - 1); // yesterday
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (days - 1)); // days range

    // 1. Filter transactions in range & only completed ones
    const filteredTransactions = transactions.filter((t) => {
      const tDate = new Date(t.created_at);
      return (
        t.status === "Completed" &&
        tDate >= startDate &&
        tDate <= endDate
      );
    });

    const transactionIds = new Set(filteredTransactions.map((t) => t.id));

    // 2. Sum quantities per product
    const productQuantities: Record<number, number> = {};
    transactionProducts.forEach((tp) => {
      if (transactionIds.has(tp.transaction_id)) {
        productQuantities[tp.product_id] =
          (productQuantities[tp.product_id] || 0) + tp.quantity;
      }
    });

    // 3. Join with product data
    const result = Object.entries(productQuantities)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === Number(productId));
        return {
          id: product?.id || Number(productId),
          name: product?.product_name || "Unknown",
          category: product?.category || "Uncategorized",
          quantity,
          revenue: (product?.price || 0) * quantity,
        };
      })
      .sort((a, b) => b.quantity - a.quantity);

    return result;
  }

  function getPaymentMethods(dateRangeDays: number) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dateRangeDays);
    
    // Always start counting from yesterday
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);
    
    const filteredTransactions: Transaction[] = transactions.filter(t => {
      const tDate = new Date(t.created_at);
      return tDate >= startDate && tDate <= endDate;
    });
  
    const paymentSales: Record<string, number> = {};
  
    filteredTransactions.forEach(t => {
      if (!t.payment_method) return;
      paymentSales[t.payment_method] = (paymentSales[t.payment_method] || 0) + 1;
    });
  
    const totalSales = Object.values(paymentSales).reduce((sum, val) => sum + val, 0);
  
    return [
      {
        name: 'Cash',
        amount: paymentSales['Cash'] || 0,
        value: totalSales > 0 
          ? Math.round((paymentSales['Cash'] || 0) / totalSales * 100) 
          : 0,
        color: 'green'
      },
      {
        name: 'E-Wallet',
        amount: paymentSales['E-Wallet'] || 0,
        value: totalSales > 0 
          ? Math.round((paymentSales['E-Wallet'] || 0) / totalSales * 100) 
          : 0,
        color: 'blue'
      }
    ];
  }

  function getBranchBrandPerformance(
    dateRangeDays: number,
    transactions: Transaction[],
    transactionProducts: TransactionProduct[],
    products: Product[],
    branchBrands: BranchBrand[]
  ): BranchBrandPerformance[] {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dateRangeDays);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);

    // Only completed transactions within date range
    const validTransactions = transactions.filter(t => {
      const tDate = new Date(t.created_at);
      return (
        t.status === "Completed" &&
        tDate >= startDate &&
        tDate <= endDate
      );
    });

    const validTransactionIds = new Set(validTransactions.map(t => t.id));

    // Map for branch-brand aggregation
    const stats: Record<string, { sales: number; orders: Set<number>; customers: Set<number> }> = {};

    // Traverse transaction_products
    transactionProducts.forEach(tp => {
      if (!validTransactionIds.has(tp.transaction_id)) return;

      const product = products.find(p => p.id === tp.product_id);
      if (!product) return;

      const branchBrand = branchBrands.find(bb => bb.id === product.branch_brand_id);
      if (!branchBrand) return;

      const key = `${branchBrand.branch_id}-${branchBrand.brand_id}`;
      if (!stats[key]) {
        stats[key] = { sales: 0, orders: new Set(), customers: new Set() };
      }

      // Add sales from subtotal
      stats[key].sales += tp.subtotal;

      // Count orders by transaction
      stats[key].orders.add(tp.transaction_id);

      // Customers = unique transactions (assuming each transaction = one customer)
      stats[key].customers.add(tp.transaction_id);
    });

    return Object.entries(stats).map(([key, val]) => {
      const [branch_id, brand_id] = key.split("-").map(Number);
      return {
        branch_id,
        brand_id,
        sales: val.sales,
        orders: val.orders.size,
        customers: val.customers.size,
      };
    });
  }

  const branchBrandPerformance = getBranchBrandPerformance(
    dateRange,
    transactions,
    transactionProducts,
    products,
    branchBrands
  ).map(perf => {
    const branch = branches.find(b => b.id === perf.branch_id);
    const brand = brands.find(br => br.id === perf.brand_id);
    return {
      ...perf,
      branch_name: branch ? branch.branch_name : `Branch ${perf.branch_id}`,
      brand_name: brand ? brand.brand_name : `Brand ${perf.brand_id}`
    };
  });

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
          value={stats.inventory}
          icon={Package}
          subtitle="Total stock across all branches"
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
              onChange={(date: Date | null) => {
                if (date) {
                  setHPD(date);
                }
              }}
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Top Products</h2>
              <p className="text-sm text-gray-500">{dateText}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F2937] text-left">
                  <th className="py-2 text-gray-800 font-semibold">Product</th>
                  <th className="py-2 text-gray-800 font-semibold text-center">Qty</th>
                  <th className="py-2 text-gray-800 font-semibold text-center">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {getTopProducts(dateRange, transactions, transactionProducts, products).slice(0, 10).map((product, index) => (
                  <tr key={product.name} className="border-b border-[#1F2937]">
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
                    <td className="py-2 font-medium text-center">{product.quantity}</td>
                    <td className="py-2 font-bold text-primary text-center">₱{product.revenue.toLocaleString()}</td>
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
            {getPaymentMethods(dateRange).map((method) => (
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
        <h2 className="text-xl font-bold text-gray-800">Branch Performance</h2>
        <p className="text-sm text-gray-500 mb-4">{dateText}</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F2937]">
                <th className="text-left py-3 font-semibold text-gray-800">Branch</th>
                <th className="text-center py-3 font-semibold text-gray-800">Sales</th>
                <th className="text-center py-3 font-semibold text-gray-800">Orders</th>
                <th className="text-center py-3 font-semibold text-gray-800">Customers</th>
                <th className="text-center py-3 font-semibold text-gray-800">Avg. Order</th>
              </tr>
            </thead>
            <tbody>
              {branchBrandPerformance.map((branch, index) => (
                <tr key={`${branch.branch_id}-${branch.brand_id}`} className="border-b border-[#1F2937] hover:bg-background transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-promo' : index === 1 ? 'bg-secondary' : 'bg-brown-400'
                      }`}>
                        {index + 1}
                      </span>
                      {branch.branch_name} - {branch.brand_name}
                    </div>
                  </td>
                  <td className="py-3 font-bold text-primary text-center">₱{branch.sales.toLocaleString()}</td>
                  <td className="py-3 font-medium text-center">{branch.orders}</td>
                  <td className="py-3 font-medium text-center">{branch.customers}</td>
                  <td className="py-3 font-medium text-center">₱{Math.round(branch.sales / branch.orders)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
