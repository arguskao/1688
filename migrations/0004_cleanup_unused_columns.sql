-- Remove unused columns from products table

-- Drop additional_images (replaced by images JSONB column)
ALTER TABLE products DROP COLUMN IF EXISTS additional_images;

-- Add comment
COMMENT ON TABLE products IS 'Product catalog with images stored in JSONB format';
