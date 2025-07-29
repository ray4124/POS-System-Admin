import React, { useState, useEffect } from 'react'
import { Package, Search, Plus, Edit, AlertTriangle, Download, Upload, Filter, Trash2 } from 'lucide-react'
import { Product } from '../lib/supabase'
import { clsx } from 'clsx'

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Mock data for demo
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Espresso',
        category: 'Coffee',
        price: 85,
        cost: 35,
        stock_quantity: 50,
        low_stock_threshold: 10,
        branch_id: 'branch1',
        barcode: '1234567890123',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Cappuccino',
        category: 'Coffee',
        price: 120,
        cost: 45,
        stock_quantity: 8, // Low stock
        low_stock_threshold: 10,
        branch_id: 'branch1',
        barcode: '1234567890124',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Chicken Sandwich',
        category: 'Food',
        price: 195,
        cost: 85,
        stock_quantity: 25,
        low_stock_threshold: 5,
        branch_id: 'branch1',
        barcode: '1234567890125',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Caesar Salad',
        category: 'Food',
        price: 165,
        cost: 75,
        stock_quantity: 3, // Low stock
        low_stock_threshold: 5,
        branch_id: 'branch1',
        barcode: '1234567890126',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Cheesecake',
        category: 'Dessert',
        price: 145,
        cost: 55,
        stock_quantity: 15,
        low_stock_threshold: 3,
        branch_id: 'branch1',
        barcode: '1234567890127',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]
    setProducts(mockProducts)
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(products.map(p => p.category))]
  const lowStockCount = products.filter(p => p.stock_quantity <= p.low_stock_threshold).length

  const ProductModal = ({ product, onClose, onSave }: {
    product?: Product | null
    onClose: () => void
    onSave: (product: Partial<Product>) => void
  }) => {
    const [formData, setFormData] = useState({
      name: product?.name || '',
      category: product?.category || '',
      price: product?.price || 0,
      cost: product?.cost || 0,
      stock_quantity: product?.stock_quantity || 0,
      low_stock_threshold: product?.low_stock_threshold || 5,
      barcode: product?.barcode || '',
      is_active: product?.is_active ?? true
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSave(formData)
      onClose()
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md animate-slide-up">
          <h2 className="text-xl font-bold text-brown-900 mb-4">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-800 mb-1">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-800 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-brown-800 mb-1">Price (₱)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-800 mb-1">Cost (₱)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-brown-800 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-800 mb-1">Low Stock Alert</label>
                <input
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-800 mb-1">Barcode</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-brown-200 text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm text-brown-800">Active Product</label>
            </div>

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
                {product ? 'Update' : 'Add'} Product
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const handleSaveProduct = (productData: Partial<Product>) => {
    if (editingProduct) {
      // Update existing product
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...p, ...productData } 
          : p
      ))
    } else {
      // Add new product
      const newProduct: Product = {
        id: Date.now().toString(),
        branch_id: 'branch1',
        created_at: new Date().toISOString(),
        ...productData
      } as Product
      setProducts([...products, newProduct])
    }
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Inventory Management</h1>
          <p className="text-brown-600">Manage your product inventory and stock levels</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-brown-200 text-brown-800 rounded-lg hover:bg-brown-50 transition-colors">
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-brown-200 text-brown-800 rounded-lg hover:bg-brown-50 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="bg-error/10 border border-error/20 p-4 rounded-xl animate-pulse-soft">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-error" />
            <div>
              <h3 className="font-semibold text-error">Low Stock Alert</h3>
              <p className="text-error/80 text-sm">
                {lowStockCount} product(s) are running low on stock and need restocking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-brown-600" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
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
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Cost</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Stock</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isLowStock = product.stock_quantity <= product.low_stock_threshold
                const margin = ((product.price - product.cost) / product.price) * 100
                
                return (
                  <tr key={product.id} className="border-b border-brown-100 hover:bg-background transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-brown-900">{product.name}</p>
                        {product.barcode && (
                          <p className="text-xs text-brown-600">{product.barcode}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-brown-100 text-brown-800 text-xs rounded-full">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-primary">₱{product.price}</td>
                    <td className="py-3 px-4 text-brown-600">
                      ₱{product.cost}
                      <span className="block text-xs text-brown-500">
                        {margin.toFixed(1)}% margin
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "font-medium",
                          isLowStock ? "text-error" : "text-brown-900"
                        )}>
                          {product.stock_quantity}
                        </span>
                        {isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-error" />
                        )}
                      </div>
                      <p className="text-xs text-brown-600">Alert at {product.low_stock_threshold}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={clsx(
                        "px-2 py-1 text-xs rounded-full",
                        product.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-brown-100 text-brown-600"
                      )}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product)
                            setShowAddModal(true)
                          }}
                          className="p-1 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1 text-error hover:bg-error hover:text-white rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowAddModal(false)
            setEditingProduct(null)
          }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  )
}