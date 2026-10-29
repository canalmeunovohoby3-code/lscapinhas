import type { OrderStatus } from '../types/orders';

export interface AdminOrderItem {
  id: string;
  order_id: string;
  brand_id: string;
  brand_name: string;
  model_id: string;
  model_name: string;
  quantity: number;
  created_at: string;
}

export interface AdminOrderImage {
  id: string;
  order_id: string;
  order_item_id: string | null;
  storage_path: string;
  file_name: string | null;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface AdminOrder {
  id: string;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  customer_contact: string | null;
  status: OrderStatus;
  notes: string | null;
  order_items?: AdminOrderItem[] | null;
  order_images?: AdminOrderImage[] | null;
}

export interface AdminOrderSummary {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_contact: string | null;
  status: OrderStatus;
}
