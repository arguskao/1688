-- Add description_html and additional_images columns to products table

-- Add description_html column to store full HTML description
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description_html TEXT;

-- Add additional_images column to store array of additional image URLs
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS additional_images TEXT[];

-- Add comment
COMMENT ON COLUMN products.description_html IS 'Full HTML description from WooCommerce';
COMMENT ON COLUMN products.additional_images IS 'Additional product images (2nd, 3rd, etc.)';
