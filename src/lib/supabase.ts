import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'owner' | 'admin' | 'cashier'

export interface Branch {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  branch_id?: string
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  cost: number
  stock_quantity: number
  low_stock_threshold: number
  branch_id: string
  barcode?: string
  image_url?: string
  is_active: boolean
  created_at: string
}

export interface Sale {
  id: string
  branch_id: string
  cashier_id: string
  customer_id?: string
  total_amount: number
  tax_amount: number
  discount_amount: number
  payment_method: 'cash' | 'gcash' | 'maya' | 'card'
  status: 'completed' | 'void' | 'refunded'
  promotion_id?: string
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount_amount: number
  total_price: number
  created_at: string
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  loyalty_points: number
  total_spent: number
  created_at: string
}

export interface Promotion {
  id: string
  name: string
  type: 'percentage' | 'fixed' | 'bogo' | 'combo'
  value: number
  min_purchase?: number
  start_date: string
  end_date: string
  is_active: boolean
  applicable_items?: string[]
  branch_id?: string
  created_at: string
}

export interface InventoryLog {
  id: string
  product_id: string
  branch_id: string
  change_type: 'sale' | 'restock' | 'adjustment' | 'transfer'
  quantity_change: number
  previous_quantity: number
  new_quantity: number
  reference_id?: string
  notes?: string
  created_by?: string
  created_at: string
}

// Helper functions

export const createSale = async (saleData: {
  branch_id: string
  customer_id?: string
  total_amount: number
  tax_amount: number
  discount_amount: number
  payment_method: Sale['payment_method']
  promotion_id?: string
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    discount_amount: number
    total_price: number
  }>
}) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Not authenticated')

  // Create the sale
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      ...saleData,
      cashier_id: user.id
    })
    .select()
    .single()

  if (saleError) throw saleError

  // Create sale items
  const saleItems = saleData.items.map(item => ({
    ...item,
    sale_id: sale.id
  }))

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems)

  if (itemsError) throw itemsError

  // Update product stock & insert inventory logs
  for (const item of saleData.items) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single()

    if (productError || !product) continue

    const newQuantity = product.stock_quantity - item.quantity

    await supabase
      .from('products')
      .update({ stock_quantity: newQuantity })
      .eq('id', item.product_id)

    await supabase
      .from('inventory_logs')
      .insert({
        product_id: item.product_id,
        branch_id: saleData.branch_id,
        change_type: 'sale',
        quantity_change: -item.quantity,
        previous_quantity: product.stock_quantity,
        new_quantity: newQuantity,
        reference_id: sale.id,
        created_by: user.id
      })
  }

  // Update customer loyalty points if customer provided
  if (saleData.customer_id) {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('loyalty_points, total_spent')
      .eq('id', saleData.customer_id)
      .single()

    if (!customerError && customer) {
      const pointsEarned = Math.floor(saleData.total_amount / 100)

      await supabase
        .from('customers')
        .update({
          loyalty_points: customer.loyalty_points + pointsEarned,
          total_spent: customer.total_spent + saleData.total_amount
        })
        .eq('id', saleData.customer_id)
    }
  }

  return sale
}

export const getActivePromotions = async (branchId?: string) => {
  const now = new Date().toISOString()

  let query = supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)

  if (branchId) {
    query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getLowStockProducts = async (branchId?: string) => {
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query
  if (error) throw error

  // Apply low-stock logic client-side since Supabase SQL template isn't supported here
  return data.filter(product => product.stock_quantity <= product.low_stock_threshold)
}
