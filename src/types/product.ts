/**
 * Product type definitions
 */

export interface Product {
  product_id: string;
  name_en: string;
  sku: string;
  category: string;
  description_en: string;
  specs_json: Record<string, any>;
  image_url: string;
}

export interface ProductDataSource {
  products: Product[];
}
