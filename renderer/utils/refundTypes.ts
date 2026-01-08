// Refund management types

export interface RefundRequest {
  order_id: string;
  refund_type: 'full' | 'partial' | 'specific_items';
  refund_amount?: number;
  refund_items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  reason: string;
  admin_notes?: string;
  notify_customer: boolean;
  admin_user_id: string;
}

export interface RefundResponse {
  success: boolean;
  refund_id?: string;
  stripe_refund_id?: string;
  order_id: string;
  refund_amount?: number;
  refund_status?: 'partial' | 'full';
  message: string;
  order_updated: boolean;
}

export interface RefundInfo {
  refund_id: string;
  order_id: string;
  stripe_refund_id?: string;
  refund_amount: number;
  refund_type: string;
  reason: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  admin_user_id: string;
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
  customer_notified: boolean;
}

export interface RefundListResponse {
  success: boolean;
  refunds: RefundInfo[];
  total_count: number;
  total_refunded: number;
}
