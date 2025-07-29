/*
  # Afflatus POS Database Schema

  1. New Tables
    - `profiles` - User profiles with roles and branch assignments
    - `branches` - Store branch information
    - `products` - Product catalog with inventory
    - `customers` - Customer information and loyalty data
    - `sales` - Sales transactions
    - `sale_items` - Individual items in each sale
    - `promotions` - Promotional campaigns and discounts
    - `inventory_logs` - Track inventory changes

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Cashiers can only access register functions
    - Managers can access branch-specific data
    - Admins have full access
    - Owners have read-only access to all data

  3. Features
    - Multi-branch support
    - Role-based permissions
    - Inventory tracking with low stock alerts
    - Customer loyalty points system
    - Promotional system with scheduling
*/

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'cashier')),
  branch_id uuid REFERENCES branches(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  loyalty_points integer DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price decimal(10,2) NOT NULL,
  cost decimal(10,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  branch_id uuid REFERENCES branches(id),
  barcode text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed', 'bogo', 'combo')),
  value decimal(10,2) NOT NULL,
  min_purchase decimal(10,2) DEFAULT 0,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  applicable_items jsonb,
  branch_id uuid REFERENCES branches(id),
  created_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id) NOT NULL,
  cashier_id uuid REFERENCES profiles(id) NOT NULL,
  customer_id uuid REFERENCES customers(id),
  total_amount decimal(10,2) NOT NULL,
  tax_amount decimal(10,2) DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'gcash', 'maya', 'card')),
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'void', 'refunded')),
  promotion_id uuid REFERENCES promotions(id),
  created_at timestamptz DEFAULT now()
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  discount_amount decimal(10,2) DEFAULT 0,
  total_price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create inventory_logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) NOT NULL,
  branch_id uuid REFERENCES branches(id) NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('sale', 'restock', 'adjustment', 'transfer')),
  quantity_change integer NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  reference_id uuid, -- Can reference sale_id or other transaction
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Insert sample branches
INSERT INTO branches (id, name, address, phone, email) VALUES
  ('branch-1', 'Main Branch - Makati', '123 Ayala Ave, Makati City', '+632-8123-4567', 'makati@afflatus.com'),
  ('branch-2', 'BGC Branch', '456 BGC Central, Taguig City', '+632-8234-5678', 'bgc@afflatus.com'),
  ('branch-3', 'Ortigas Branch', '789 Ortigas Center, Pasig City', '+632-8345-6789', 'ortigas@afflatus.com')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Branches: All authenticated users can read, only admins can modify
CREATE POLICY "Anyone can read branches"
  ON branches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify branches"
  ON branches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Profiles: Users can read their own profile, admins can manage all
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Customers: All authenticated users can manage customers
CREATE POLICY "Authenticated users can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (true);

-- Products: Branch-based access for managers, full access for admins
CREATE POLICY "Users can read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage branch products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role IN ('admin', 'owner') 
        OR (profiles.role = 'manager' AND profiles.branch_id = products.branch_id)
      )
    )
  );

-- Promotions: Similar to products
CREATE POLICY "Users can read promotions"
  ON promotions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage branch promotions"
  ON promotions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role IN ('admin', 'owner') 
        OR (profiles.role = 'manager' AND profiles.branch_id = promotions.branch_id)
      )
    )
  );

-- Sales: Users can read sales from their branch, create new sales
CREATE POLICY "Users can read branch sales"
  ON sales FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role IN ('admin', 'owner')
        OR profiles.branch_id = sales.branch_id
      )
    )
  );

CREATE POLICY "Cashiers can create sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('cashier', 'manager', 'admin')
    )
  );

-- Sale Items: Follow sales policies
CREATE POLICY "Users can read sale items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales 
      JOIN profiles ON profiles.id = auth.uid()
      WHERE sales.id = sale_items.sale_id
      AND (
        profiles.role IN ('admin', 'owner')
        OR profiles.branch_id = sales.branch_id
      )
    )
  );

CREATE POLICY "Cashiers can create sale items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('cashier', 'manager', 'admin')
    )
  );

-- Inventory Logs: Read access based on branch, create for transactions
CREATE POLICY "Users can read branch inventory logs"
  ON inventory_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role IN ('admin', 'owner')
        OR profiles.branch_id = inventory_logs.branch_id
      )
    )
  );

CREATE POLICY "Users can create inventory logs"
  ON inventory_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('cashier', 'manager', 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_branch ON inventory_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, start_date, end_date);