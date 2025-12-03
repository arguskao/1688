-- Add images array column to products table
-- This will store all product images as a JSON array

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Update existing products to move image_url to images array
UPDATE products 
SET images = jsonb_build_array(
  jsonb_build_object('url', image_url, 'is_primary', true)
)
WHERE image_url IS NOT NULL AND image_url != '';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_images ON products USING GIN (images);

-- Add comment
COMMENT ON COLUMN products.images IS 'Array of product images with metadata (url, is_primary, alt_text, etc.)';
