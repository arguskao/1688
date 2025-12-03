/**
 * Product type definitions
 */

export interface ProductImage {
  url: string;
  is_primary: boolean;
  alt_text?: string;
  order: number;
}

export interface Product {
  product_id: string;
  name_en: string;
  sku: string;
  category: string;
  description_en: string;
  description_html?: string;
  specs_json: Record<string, any>;
  image_url: string;
  images?: ProductImage[];
}

export interface ProductDataSource {
  products: Product[];
}
