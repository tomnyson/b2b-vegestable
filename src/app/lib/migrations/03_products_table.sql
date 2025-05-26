-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_vi TEXT,
  name_tr TEXT,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on product name for faster searches
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);

-- Create index on product SKU for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);

-- Create index on product category for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- Create trigger to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insert sample products
INSERT INTO products (
  name, 
  name_vi, 
  name_tr, 
  description, 
  price, 
  unit, 
  sku, 
  category, 
  is_active, 
  stock_quantity
) VALUES 
(
  'Fresh Tomatoes', 
  'Cà chua tươi', 
  'Taze Domatesler', 
  'Locally grown fresh tomatoes', 
  3.99, 
  'kg', 
  'VEGE-TOM-001', 
  'vegetables', 
  true, 
  100
),
(
  'Organic Spinach', 
  'Rau bina hữu cơ', 
  'Organik Ispanak', 
  'Fresh organic spinach grown without pesticides', 
  2.49, 
  'bunch', 
  'VEGE-SPI-002', 
  'vegetables', 
  true, 
  50
),
(
  'Red Onions', 
  'Hành tím', 
  'Kırmızı Soğanlar', 
  'Medium-sized red onions', 
  1.99, 
  'kg', 
  'VEGE-ONI-003', 
  'vegetables', 
  true, 
  75
),
(
  'Green Bell Peppers', 
  'Ớt chuông xanh', 
  'Yeşil Biber', 
  'Crunchy green bell peppers', 
  2.29, 
  'kg', 
  'VEGE-PEP-004', 
  'vegetables', 
  true, 
  60
),
(
  'Russet Potatoes', 
  'Khoai tây Russet', 
  'Russet Patatesler', 
  'Perfect for baking or mashing', 
  4.99, 
  '5kg bag', 
  'VEGE-POT-005', 
  'vegetables', 
  true, 
  40
)
ON CONFLICT (sku) DO NOTHING; 