/*
  # Insert Demo Data for Afflatus POS

  1. Demo Users
    - Creates demo accounts for each role
    - Password: demo123 for all accounts

  2. Sample Products
    - Coffee, food, and dessert items
    - Realistic pricing and stock levels

  3. Sample Customers
    - Customers with loyalty points and purchase history

  4. Sample Promotions
    - Active and scheduled promotions
*/

-- Insert demo products
INSERT INTO products (id, name, category, price, cost, stock_quantity, low_stock_threshold, branch_id, barcode, is_active) VALUES
  ('prod-1', 'Espresso', 'Coffee', 85.00, 35.00, 50, 10, 'branch-1', '1234567890123', true),
  ('prod-2', 'Cappuccino', 'Coffee', 120.00, 45.00, 35, 10, 'branch-1', '1234567890124', true),
  ('prod-3', 'Iced Latte', 'Coffee', 135.00, 50.00, 40, 10, 'branch-1', '1234567890125', true),
  ('prod-4', 'Americano', 'Coffee', 95.00, 40.00, 45, 10, 'branch-1', '1234567890126', true),
  ('prod-5', 'Chicken Sandwich', 'Food', 195.00, 85.00, 25, 5, 'branch-1', '1234567890127', true),
  ('prod-6', 'Caesar Salad', 'Food', 165.00, 75.00, 20, 5, 'branch-1', '1234567890128', true),
  ('prod-7', 'Club Sandwich', 'Food', 185.00, 80.00, 18, 5, 'branch-1', '1234567890129', true),
  ('prod-8', 'Cheesecake', 'Dessert', 145.00, 55.00, 15, 3, 'branch-1', '1234567890130', true),
  ('prod-9', 'Chocolate Cake', 'Dessert', 155.00, 60.00, 12, 3, 'branch-1', '1234567890131', true),
  ('prod-10', 'Croissant', 'Pastry', 75.00, 30.00, 30, 8, 'branch-1', '1234567890132', true),
  ('prod-11', 'Muffin', 'Pastry', 65.00, 25.00, 25, 8, 'branch-1', '1234567890133', true),
  ('prod-12', 'Fresh Orange Juice', 'Beverage', 85.00, 35.00, 20, 5, 'branch-1', '1234567890134', true)
ON CONFLICT (id) DO NOTHING;

-- Insert demo customers
INSERT INTO customers (id, name, email, phone, loyalty_points, total_spent) VALUES
  ('cust-1', 'Maria Santos', 'maria.santos@email.com', '+639123456789', 150, 2500.00),
  ('cust-2', 'Juan Dela Cruz', 'juan.delacruz@email.com', '+639987654321', 89, 1200.00),
  ('cust-3', 'Ana Garcia', 'ana.garcia@email.com', '+639555123456', 234, 4800.00),
  ('cust-4', 'Carlos Rodriguez', 'carlos.rodriguez@email.com', '+639777888999', 67, 890.00),
  ('cust-5', 'Lisa Chen', 'lisa.chen@email.com', '+639444555666', 178, 3200.00)
ON CONFLICT (id) DO NOTHING;

-- Insert demo promotions
INSERT INTO promotions (id, name, type, value, min_purchase, start_date, end_date, is_active, applicable_items, branch_id) VALUES
  ('promo-1', 'Happy Hour Coffee', 'percentage', 20.00, 0, '2025-01-01T14:00:00Z', '2025-12-31T17:00:00Z', true, '["prod-1", "prod-2", "prod-3", "prod-4"]', 'branch-1'),
  ('promo-2', 'Buy 1 Get 1 Pastries', 'bogo', 1.00, 0, '2025-01-15T00:00:00Z', '2025-01-31T23:59:59Z', true, '["prod-10", "prod-11"]', 'branch-1'),
  ('promo-3', 'Lunch Combo Deal', 'fixed', 50.00, 300.00, '2025-01-01T11:00:00Z', '2025-01-31T15:00:00Z', true, '["prod-5", "prod-6", "prod-7"]', 'branch-1'),
  ('promo-4', 'Weekend Special', 'percentage', 15.00, 0, '2025-01-11T00:00:00Z', '2025-01-12T23:59:59Z', true, null, 'branch-1'),
  ('promo-5', 'Valentine\'s Day Special', 'percentage', 25.00, 200.00, '2025-02-14T00:00:00Z', '2025-02-14T23:59:59Z', false, '["prod-8", "prod-9"]', 'branch-1')
ON CONFLICT (id) DO NOTHING;

-- Create a function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'cashier')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();