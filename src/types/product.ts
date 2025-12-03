/**
 * Product type definitions
 */

export interface ProductImage {
  url: string;
  is_primary: boolean;
  alt_text?: string;
  order: number;
}

export interface ProductSpecs {
  [key: string]: string | number | string[] | boolean;
}

export interface Product {
  product_id: string;
  name_en: string;
  sku: string;
  category: string;
  description_en: string;
  description_html?: string;
  specs_json: ProductSpecs;
  image_url: string;
  images?: ProductImage[];
  created_at?: Date;
  updated_at?: Date;
}

// For creating a new product (without auto-generated fields)
export type CreateProductInput = Omit<Product, 'created_at' | 'updated_at' | 'images'>;

// For updating a product (all fields optional except id)
export type UpdateProductInput = Partial<Omit<Product, 'product_id' | 'created_at' | 'updated_at'>>;

// Product list item (lighter version for lists)
export interface ProductListItem {
  product_id: string;
  name_en: string;
  sku: string;
  category: string;
  image_url: string;
}

// Product with pagination
export interface ProductsResult {
  products: Product[];
  total: number;
}

// Product filter options
export interface ProductFilterOptions {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ProductDataSource {
  products: Product[];
}
