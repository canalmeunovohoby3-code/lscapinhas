export type OrderStatus =
  | 'novo'
  | 'em_analise'
  | 'em_producao'
  | 'pronto'
  | 'concluido'
  | 'cancelado';

export interface OrderItemInput {
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerName?: string | null;
  customerContact?: string | null;
  notes?: string | null;
  items: OrderItemInput[];
}

export type OrderImageKind = 'reference' | 'original' | 'composition';

export interface OrderImageInput {
  path: string;
  fileName?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  itemId?: string | null;
  modelId?: string;
  kind?: OrderImageKind;
  metadata?: Record<string, unknown> | null;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string | null;
  customerContact: string | null;
  status: OrderStatus;
  notes: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  quantity: number;
  createdAt: string;
}

export interface OrderImage {
  id: string;
  orderId: string;
  orderItemId: string | null;
  storagePath: string;
  fileName: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  kind: OrderImageKind;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  images: OrderImage[];
}
