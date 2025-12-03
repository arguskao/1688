-- Migration 0002: Create Products and Admin Sessions tables

-- Create Products table
CREATE TABLE IF NOT EXISTS products (
  product_id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description_en TEXT NOT NULL,
  specs_json JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for Products table
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create Admin Sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  session_id TEXT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Create index for Sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON admin_sessions(expires_at);

-- Add comment to tables
COMMENT ON TABLE products IS 'Stores product information for the catalog';
COMMENT ON TABLE admin_sessions IS 'Stores admin session tokens for authentication';
