-- Add pricing fields to quote_items table
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add replied_at to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS admin_notes TEXT;
