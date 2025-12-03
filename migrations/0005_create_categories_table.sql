-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Insert default categories
INSERT INTO categories (name, display_order) VALUES
  ('Drinkware', 1),
  ('Kitchenware', 2),
  ('Office Supplies', 3),
  ('Electronics', 4),
  ('Furniture', 5),
  ('Home Decor', 6),
  ('Textiles', 7),
  ('Toys', 8),
  ('Sports', 9),
  ('Beauty', 10),
  ('Health', 11),
  ('Automotive', 12),
  ('Garden', 13),
  ('Pet Supplies', 14),
  ('Other', 99)
ON CONFLICT (name) DO NOTHING;
