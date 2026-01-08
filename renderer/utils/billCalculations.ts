import { OrderItem } from 'utils/menuTypes';
import { CustomerTab } from 'types';
import { calculateSubtotal } from './orderCalculations';

/**
 * Customer bill calculation utilities for Bill View & Payment
 * Handles customer-specific subtotals, tax, service charges, and split logic
 */

export interface CustomerBillBreakdown {
  customerId: string | null;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  itemCount: number;
}

export interface BillSummary {
  customerBreakdowns: CustomerBillBreakdown[];
  tableSubtotal: number;
  tax: number;
  serviceCharge: number;
  grandTotal: number;
}

export interface SplitPaymentOption {
  type: 'pay-all' | 'split-even' | 'individual';
  customerIds?: (string | null)[]; // For individual payment - which customers are paying
  amount: number;
  perPersonAmount?: number; // For split-even
}

/**
 * Group order items by customer tab ID and calculate per-customer subtotals
 */
export function groupItemsByCustomer(
  orderItems: OrderItem[],
  customerTabs: CustomerTab[]
): CustomerBillBreakdown[] {
  const groups: Map<string | null, OrderItem[]> = new Map();
  
  // Group items by customer_tab_id
  orderItems.forEach(item => {
    const tabId = (item as any).customer_tab_id || null;
    const existing = groups.get(tabId) || [];
    groups.set(tabId, [...existing, item]);
  });
  
  // Convert to breakdown array
  const breakdowns: CustomerBillBreakdown[] = [];
  
  // Table-level items first
  const tableLevelItems = groups.get(null);
  if (tableLevelItems && tableLevelItems.length > 0) {
    breakdowns.push({
      customerId: null,
      customerName: 'Table',
      items: tableLevelItems,
      subtotal: calculateSubtotal(tableLevelItems),
      itemCount: tableLevelItems.length
    });
  }
  
  // Customer tab items
  Array.from(groups.keys())
    .filter(tabId => tabId !== null)
    .forEach(tabId => {
      const items = groups.get(tabId)!;
      const tab = customerTabs.find(t => t.id === tabId);
      const customerName = tab?.tab_name || `Customer ${tabId?.slice(0, 4)}`;
      
      breakdowns.push({
        customerId: tabId,
        customerName,
        items,
        subtotal: calculateSubtotal(items),
        itemCount: items.length
      });
    });
  
  return breakdowns;
}

/**
 * Calculate complete bill summary with tax and service charges
 */
export function calculateBillSummary(
  orderItems: OrderItem[],
  customerTabs: CustomerTab[],
  options: {
    taxRate?: number; // Default 0 (VAT already included in menu prices)
    serviceChargePercent?: number; // Default 0
  } = {}
): BillSummary {
  const { taxRate = 0, serviceChargePercent = 0 } = options;
  
  const customerBreakdowns = groupItemsByCustomer(orderItems, customerTabs);
  const tableSubtotal = customerBreakdowns.reduce((sum, breakdown) => sum + breakdown.subtotal, 0);
  
  // Calculate tax (if applicable)
  const tax = tableSubtotal * taxRate;
  
  // Calculate service charge
  const serviceCharge = tableSubtotal * (serviceChargePercent / 100);
  
  const grandTotal = tableSubtotal + tax + serviceCharge;
  
  return {
    customerBreakdowns,
    tableSubtotal,
    tax,
    serviceCharge,
    grandTotal
  };
}

/**
 * Calculate payment option amounts
 */
export function calculatePaymentAmount(
  billSummary: BillSummary,
  option: SplitPaymentOption
): number {
  switch (option.type) {
    case 'pay-all':
      return billSummary.grandTotal;
      
    case 'split-even': {
      const customerCount = billSummary.customerBreakdowns.length;
      return billSummary.grandTotal / customerCount;
    }
      
    case 'individual': {
      if (!option.customerIds || option.customerIds.length === 0) {
        return 0;
      }
      
      // Sum subtotals for selected customers
      const selectedSubtotal = billSummary.customerBreakdowns
        .filter(breakdown => option.customerIds!.includes(breakdown.customerId))
        .reduce((sum, breakdown) => sum + breakdown.subtotal, 0);
      
      // Calculate proportional tax and service charge
      const proportion = selectedSubtotal / billSummary.tableSubtotal;
      const proportionalTax = billSummary.tax * proportion;
      const proportionalServiceCharge = billSummary.serviceCharge * proportion;
      
      return selectedSubtotal + proportionalTax + proportionalServiceCharge;
    }
      
    default:
      return 0;
  }
}

/**
 * Validate that selected customers cover the full bill amount
 */
export function validatePaymentCoverage(
  billSummary: BillSummary,
  paidCustomerIds: (string | null)[]
): { isValid: boolean; remaining: number } {
  const paidAmount = billSummary.customerBreakdowns
    .filter(breakdown => paidCustomerIds.includes(breakdown.customerId))
    .reduce((sum, breakdown) => sum + breakdown.subtotal, 0);
  
  const totalRequired = billSummary.tableSubtotal;
  const remaining = totalRequired - paidAmount;
  
  return {
    isValid: Math.abs(remaining) < 0.01, // Allow for rounding errors
    remaining
  };
}
