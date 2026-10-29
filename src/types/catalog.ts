export interface PhoneModel {
  id: string;
  name: string;
  brandId: string;
}

export interface PhoneBrand {
  id: string;
  name: string;
  shortName: string;
  monogram: string;
  models: PhoneModel[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface Style {
  id: string;
  name: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  swatch: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  styles: string[];
  compatibleModels: string[];
  variants: ProductVariant[];
  available: boolean;
  featured: boolean;
  demo: true;
}

export interface CartItem {
  productId: string;
  modelId: string | null;
  variantId: string | null;
  quantity: number;
}

export interface RequestItem {
  modelId: string;
  quantity: number;
}

export interface ResolvedCartItem {
  key: string;
  item: CartItem;
  product: Product | undefined;
  model: PhoneModel | undefined;
  variant: ProductVariant | null;
  unitPrice: number;
  subtotal: number;
  issues: string[];
}
