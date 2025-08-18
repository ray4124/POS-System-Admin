import { useState, useMemo } from 'react'
import { Search, Plus, Edit, AlertTriangle, Filter, Trash2, PackagePlus, PowerOff, Power } from 'lucide-react'
import { clsx } from 'clsx'
import products from '../mockdata/products.json'
import branches from '../mockdata/branches.json'
import brands from '../mockdata/brands.json'
import branchBrand from '../mockdata/branch_brand.json'

interface Product {
  id: number;
  product_name: string;
  branch_id: number;
  brand_id: number;
  price: number;
  alert_at: number;
  stock: number;
  isActive: boolean;
  isLowStock: boolean;
}

export function Inventory() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showConfirmStatusModal, setShowConfirmStatusModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const lowStockList = useMemo(() => {
      return products
        .filter(p => p.stock <= p.alert_at) // low stock condition
        .sort((a, b) => a.stock - b.stock) // sort by stock ascending
        .map(p => {
          const branch = branches.find(b => b.id === p.branch_id)?.branch_name || 'Unknown Branch';
          const brand = brands.find(br => br.id === p.brand_id)?.brand_name || 'Unknown Brand';
          return `${branch} - ${brand}: low stock of ${p.product_name} remaining ${p.stock}`;
        });
    }, []);

  const filteredProducts = useMemo(() => {
    // Start with enriched products
    let result: Product[] = products.map((p) => ({
      ...p,
      isLowStock: p.stock < p.alert_at,
    }))

    // Step 1: Filter by branch-brand
    if (filter !== 0) {
      const bb = branchBrand.find((bb) => bb.id === filter)
      if (bb) {
        result = result.filter(
          (p) => p.branch_id === bb.branch_id && p.brand_id === bb.brand_id
        )
      }
    }

    // Step 2: Search inside filtered products
    if (search.trim() !== "") {
      const term = search.toLowerCase()
      result = result.filter((p) => p.product_name.toLowerCase().includes(term))
    }

    // Step 3: Sort
    return result.sort((a, b) => a.stock - b.stock)
  }, [filter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Inventory Management</h1>
          <p className="text-brown-600">Manage your product inventory and stock levels</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              return null
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
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

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="relative flex-1 col-span-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {setSearch(e.target.value)}}
            className="w-full pl-10 pr-4 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            onClick={() => setSearch('')}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-brown-600" />
          <select
            value={filter}
            onChange={(e) => {setFilter(Number(e.target.value))}}
            className="flex-1 px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value={0}>All Products</option>
            {branchBrand.map((bb) => {
              const branchName = branches.find(b => b.id === bb.branch_id)?.branch_name || `Branch ${bb.branch_id}`;
              const brandName = brands.find(br => br.id === bb.brand_id)?.brand_name || `Brand ${bb.brand_id}`;
              return (
                <option key={bb.id} value={bb.id}>
                  {branchName} - {brandName}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-brown-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brown-50 border-b border-brown-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Product</th>
                {filter === 0 && (
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Branch and Brand</th>
                )}
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Cost</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const branchName =
                  branches.find((b) => b.id === p.branch_id)?.branch_name ||
                  `Branch ${p.branch_id}`
                const brandName =
                  brands.find((br) => br.id === p.brand_id)?.brand_name ||
                  `Brand ${p.brand_id}`
                
                return (
                  <tr key={p.id} className="border-b border-brown-100 hover:bg-background transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-brown-900">{p.product_name}</p>
                    </td>
                    {filter === 0 && (
                      <td className="py-3 px-4">
                        {branchName} - {brandName}
                      </td>
                    )}
                    <td className="py-3 px-4 font-semibold text-primary">₱{p.price}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "font-medium",
                          p.isLowStock ? "text-error" : "text-brown-900"
                        )}>
                          {p.stock}
                        </span>
                        {p.isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-error" />
                        )}
                      </div>
                      <p className="text-xs text-brown-600">Alert at {p.alert_at}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={clsx(
                        "px-2 py-1 text-xs rounded-full",
                        p.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-brown-100 text-brown-600"
                      )}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            return null
                          }}
                          className="p-1 text-green-500 hover:bg-brown-100 hover:text-green-900 rounded transition-colors"
                        >
                          <PackagePlus className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => {
                            return null
                          }}
                          className={`p-1 text-yellow-600 hover:bg-brown-100 hover:text-yellow-900 rounded transition-colors`}
                        >
                          {p.isActive ? (
                            <PowerOff className="h-6 w-6" />
                          ) : (
                            <Power className="h-6 w-6" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            return null
                          }}
                          className="p-1 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                        >
                          <Edit className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => {return null}}
                          className="p-1 text-error hover:bg-error hover:text-white rounded transition-colors"
                        >
                          <Trash2 className="h-6 w-6" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}