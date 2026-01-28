/**
 * Z-Report Types
 * End-of-day reconciliation and cash drawer management
 */

// ============================================================================
// DATE PRESETS
// ============================================================================

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_7_days'
  | 'this_month'
  | 'last_30_days'
  | 'year_to_date'
  | 'last_12_months';

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  last_7_days: 'Last 7 Days',
  this_month: 'This Month',
  last_30_days: 'Last 30 Days',
  year_to_date: 'Year to Date',
  last_12_months: 'Last 12 Months',
};

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ZReportConfig {
  business_day_cutoff: string;  // e.g., "05:00:00"
  default_float: number;        // e.g., 100.00
  timezone: string;             // e.g., "Europe/London"
  require_drawer_count: boolean;
}

// ============================================================================
// CASH DRAWER
// ============================================================================

export type CashDrawerOperationType =
  | 'FLOAT'       // Opening cash
  | 'PAID_OUT'    // Cash paid out (e.g., supplier payment)
  | 'PAID_IN'     // Cash added (e.g., change from bank)
  | 'DROP'        // Safe drop during shift
  | 'ADJUSTMENT'; // Manual correction

export interface CashDrawerOperation {
  id: string;
  operation_type: CashDrawerOperationType;
  amount: number;
  reason?: string;
  reference?: string;
  staff_id?: string;
  staff_name?: string;
  business_date: string;  // YYYY-MM-DD
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface CashDrawerSummary {
  opening_float: number;
  cash_sales: number;
  cash_refunds: number;
  paid_outs: number;
  paid_ins: number;
  safe_drops: number;
  expected_cash: number;
  actual_cash?: number;
  variance?: number;
  operations: CashDrawerOperation[];
}

// ============================================================================
// CHANNEL BREAKDOWN
// ============================================================================

export interface ChannelCount {
  count: number;
  total: number;
}

export interface DineInBreakdown extends ChannelCount {
  tables: number;
  guests: number;
}

export interface ChannelBreakdown {
  dine_in: DineInBreakdown;
  pos_waiting: ChannelCount;
  pos_collection: ChannelCount;
  pos_delivery: ChannelCount;
  online_collection: ChannelCount;
  online_delivery: ChannelCount;
  ai_voice?: ChannelCount;
}

// ============================================================================
// PAYMENT BREAKDOWN
// ============================================================================

export interface PaymentMethodSummary {
  sales: number;
  refunds: number;
  net: number;
  count: number;
}

export interface PaymentBreakdown {
  cash: PaymentMethodSummary;
  card: PaymentMethodSummary;
  online: PaymentMethodSummary;
  other?: PaymentMethodSummary;
}

// ============================================================================
// Z-REPORT DATA
// ============================================================================

export interface ZReportData {
  id?: string;
  report_number?: string;
  business_date: string;
  period_start: string;
  period_end: string;

  // Financial totals
  gross_sales: number;
  net_sales: number;
  total_refunds: number;
  total_discounts: number;
  total_service_charge: number;
  total_tips: number;

  // Order counts
  total_orders: number;
  total_guests: number;
  total_tables_served: number;
  avg_order_value: number;

  // Breakdowns
  channel_breakdown: ChannelBreakdown;
  payment_breakdown: PaymentBreakdown;
  cash_drawer: CashDrawerSummary;

  // Status
  is_finalized: boolean;
  finalized_at?: string;
  notes?: string;

  // Staff cash count (draft)
  staff_cash_counted?: number;
  staff_closed_by?: string;
  staff_counted_at?: string;
  denomination_breakdown?: Record<string, number>; // pence_value → qty
}

// ============================================================================
// Z-REPORT LIST ITEM (for history)
// ============================================================================

export interface ZReportListItem {
  id: string;
  report_number: string;
  business_date: string;
  gross_sales: number;
  net_sales: number;
  total_orders: number;
  is_finalized: boolean;
  finalized_at?: string;
  cash_variance?: number;
  created_at: string;
}

// ============================================================================
// API REQUESTS
// ============================================================================

export interface ZReportGenerateRequest {
  business_date?: string;  // YYYY-MM-DD
  start_date?: string;     // For date range
  end_date?: string;       // For date range
}

export interface ZReportFinalizeRequest {
  actual_cash: number;
  notes?: string;
  closed_by?: string;
  verified_by?: string;
}

export interface CashDrawerOperationRequest {
  operation_type: CashDrawerOperationType;
  amount: number;
  reason?: string;
  reference?: string;
  staff_name?: string;
  business_date?: string;  // YYYY-MM-DD, defaults to current
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface StandardResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface CurrentBusinessDateResponse {
  business_date: string;
  period_start: string;
  period_end: string;
  cutoff_time: string;
  timezone: string;
}

export interface ZReportHistoryResponse {
  reports: ZReportListItem[];
  count: number;
}

// ============================================================================
// PRINT DATA
// ============================================================================

export interface ZReportPrintData {
  type: 'z_report';
  business_name: string;
  date_range: string;
  print_timestamp: string;
  grand_total: number;
  total_orders: number;
  avg_order_value: number;
  channel_breakdown: ChannelBreakdown;
  payment_breakdown: PaymentBreakdown;
  cash_drawer: CashDrawerSummary;
  tables_served: number;
  guests_served: number;
}

// ============================================================================
// STORE STATE
// ============================================================================

export interface ZReportDateRange {
  from: Date | null;
  to: Date | null;
  preset: DatePreset | 'custom';
}

export interface PaidOutEntry {
  id: string;
  description: string;
  amount: number;
  createdAt: Date;
}

// ============================================================================
// DENOMINATION COUNTING
// ============================================================================

export interface DenominationEntry {
  label: string;         // "£50", "£20", "50p", "1p"
  valuePence: number;    // 5000, 2000, 50, 1
  type: 'note' | 'coin';
  qty: number;
  total: number;         // qty * valuePence (in pence)
}

export const UK_DENOMINATIONS: Omit<DenominationEntry, 'qty' | 'total'>[] = [
  { label: '£50', valuePence: 5000, type: 'note' },
  { label: '£20', valuePence: 2000, type: 'note' },
  { label: '£10', valuePence: 1000, type: 'note' },
  { label: '£5',  valuePence: 500,  type: 'note' },
  { label: '£2',  valuePence: 200,  type: 'coin' },
  { label: '£1',  valuePence: 100,  type: 'coin' },
  { label: '50p', valuePence: 50,   type: 'coin' },
  { label: '20p', valuePence: 20,   type: 'coin' },
  { label: '10p', valuePence: 10,   type: 'coin' },
  { label: '5p',  valuePence: 5,    type: 'coin' },
  { label: '2p',  valuePence: 2,    type: 'coin' },
  { label: '1p',  valuePence: 1,    type: 'coin' },
];

export interface StaffCashCountRequest {
  business_date: string;
  staff_cash_counted: number;
  staff_closed_by: string;
  denomination_breakdown?: Record<string, number>;
  notes?: string;
}
