import React, { useState, useEffect } from 'react'
import { Plus, Minus, Trash2, User, CreditCard, Receipt, Search, ShoppingCart } from 'lucide-react'
import { Product, Customer, createSale, supabase, getActivePromotions } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { clsx } from 'clsx'

interface CartItem extends Product {
  quantity: number
  discount: number
}

export function Register() {
  const { profile } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'maya'>('cash')
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('branch_id', profile?.branch_id || 'branch-1')
        .order('name')

      if (productsError) throw productsError
      setProducts(productsData || [])

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name')

      if (customersError) throw customersError
      setCustomers(customersData || [])

      // Load active promotions
      const promotionsData = await getActivePromotions(profile?.branch_id)
      setPromotions(promotionsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1, discount: 0 }])
    }
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id))
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ))
    }
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = cart.reduce((sum, item) => sum + item.discount, 0)
  const tax = (subtotal - discountAmount) * 0.12
  const total = subtotal - discountAmount + tax

  const handleCheckout = async () => {
    if (!profile?.branch_id) {
      alert('Error: No branch assigned to user')
      return
    }

    setLoading(true)
    try {
      const saleData = {
        branch_id: profile.branch_id,
        customer_id: selectedCustomer?.id,
        total_amount: total,
        tax_amount: tax,
        discount_amount: discountAmount,
        payment_method: paymentMethod as any,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          discount_amount: item.discount,
          total_price: (item.price * item.quantity) - item.discount
        }))
      }

      await createSale(saleData)

      // Reset cart and payment
      setCart([])
      setSelectedCustomer(null)
      setShowPayment(false)
      
      // Reload data to update stock levels
      await loadData()
      
      // Show success message
      const loyaltyPoints = Math.floor(total / 100)
      alert(`Payment successful! ${loyaltyPoints} points earned.`)
    } catch (error) {
      console.error('Error processing sale:', error)
      alert('Error processing sale. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(products.map(p => p.category))]

  return (
    <div className="h-screen bg-background flex">
      {/* Products Section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-brown-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setSearchTerm('')}
            className={clsx(
              "px-4 py-2 rounded-full whitespace-nowrap transition-all",
              searchTerm === '' 
                ? "bg-primary text-white" 
                : "bg-white text-brown-800 border border-brown-200 hover:bg-brown-50"
            )}
          >
            All Items
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSearchTerm(category)}
              className={clsx(
                "px-4 py-2 rounded-full whitespace-nowrap transition-all",
                searchTerm === category
                  ? "bg-primary text-white"
                  : "bg-white text-brown-800 border border-brown-200 hover:bg-brown-50"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock_quantity <= 0}
              className="bg-white p-4 rounded-xl shadow-sm border border-brown-100 hover:shadow-md transition-all hover:scale-[1.02] text-left"
            >
              <div className="h-24 bg-brown-100 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-2xl">{product.category === 'Coffee' ? '☕' : product.category === 'Food' ? '🍽️' : '🍰'}</span>
              </div>
              <h3 className="font-semibold text-brown-900 mb-1">{product.name}</h3>
              <p className="text-brown-600 text-sm mb-2">{product.category}</p>
              <p className="text-primary font-bold text-lg">₱{product.price}</p>
              <p className="text-brown-600 text-xs">Stock: {product.stock_quantity}</p>
              {product.stock_quantity <= product.low_stock_threshold && (
                <p className="text-error text-xs mt-1">Low Stock!</p>
              )}
              {product.stock_quantity <= 0 && (
                <p className="text-error text-xs mt-1 font-bold">Out of Stock!</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white border-l border-brown-200 flex flex-col">
        <div className="p-4 border-b border-brown-200">
          <h2 className="text-xl font-bold text-brown-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Current Order
          </h2>
        </div>

        {/* Customer Selection */}
        <div className="p-4 border-b border-brown-200">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-brown-600" />
            <span className="text-sm font-medium text-brown-800">Customer</span>
          </div>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find(c => c.id === e.target.value)
              setSelectedCustomer(customer || null)
            }}
            className="w-full p-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Walk-in Customer</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.loyalty_points} pts)
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <p className="text-brown-600 text-center mt-8">No items in cart</p>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-background p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-brown-900">{item.name}</h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-error hover:bg-error hover:text-white p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="bg-brown-200 hover:bg-brown-300 p-1 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-brown-200 hover:bg-brown-300 p-1 rounded"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="font-bold text-primary">₱{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-brown-200">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (12%):</span>
                <span>₱{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-primary">₱{total.toFixed(2)}</span>
              </div>
            </div>

            {!showPayment ? (
              <button
                onClick={() => setShowPayment(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Proceed to Payment
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'gcash', 'maya'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={clsx(
                        "p-2 rounded-lg font-medium transition-all",
                        paymentMethod === method
                          ? "bg-primary text-white"
                          : "bg-brown-100 text-brown-800 hover:bg-brown-200"
                      )}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Receipt className="h-5 w-5" />
                  {loading ? 'Processing...' : 'Complete Sale'}
                </button>
                <button
                  onClick={() => setShowPayment(false)}
                  className="w-full bg-brown-200 hover:bg-brown-300 text-brown-800 font-medium py-2 rounded-lg transition-colors"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}