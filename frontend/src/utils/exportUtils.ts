/**
 * Export Utilities — CSV and PDF export for POS data
 *
 * In Electron: uses native save dialog (IPC → main process → dialog.showSaveDialog)
 * In Web: falls back to browser download via Blob + anchor click
 */

import { toast } from 'sonner';
import type { ZReportData } from '../types/zReport';

// ============================================================================
// CORE EXPORT — Save file via Electron native dialog or browser download
// ============================================================================

async function saveFile(
  content: string,
  defaultFilename: string,
  filters: Array<{ name: string; extensions: string[] }>,
  encoding?: string
): Promise<boolean> {
  const electronAPI = (window as any).electronAPI;

  if (electronAPI?.saveFileDialog) {
    // Electron: native save dialog
    const result = await electronAPI.saveFileDialog({
      defaultPath: defaultFilename,
      filters,
      data: content,
      encoding: encoding || 'utf-8'
    });

    if (result.canceled) return false;
    if (result.success) {
      toast.success('File exported', { description: result.filePath });
      return true;
    }
    toast.error('Export failed', { description: result.error });
    return false;
  }

  // Web fallback: browser download
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success('File downloaded');
  return true;
}

// ============================================================================
// Z-REPORT CSV EXPORT
// ============================================================================

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportZReportCSV(report: ZReportData): Promise<boolean> {
  const rows: string[][] = [];

  // Header
  rows.push(['Z-Report Export']);
  rows.push(['Business Date', report.business_date || '']);
  rows.push(['Period', `${report.period_start || ''} to ${report.period_end || ''}`]);
  rows.push(['Generated', new Date().toISOString()]);
  rows.push(['Finalized', report.is_finalized ? 'Yes' : 'No']);
  rows.push([]);

  // Summary
  rows.push(['SUMMARY']);
  rows.push(['Metric', 'Value']);
  rows.push(['Gross Sales', report.gross_sales?.toFixed(2) || '0.00']);
  rows.push(['Net Sales', report.net_sales?.toFixed(2) || '0.00']);
  rows.push(['Total Refunds', report.total_refunds?.toFixed(2) || '0.00']);
  rows.push(['Total Discounts', report.total_discounts?.toFixed(2) || '0.00']);
  rows.push(['Service Charge', report.total_service_charge?.toFixed(2) || '0.00']);
  rows.push(['Tips', report.total_tips?.toFixed(2) || '0.00']);
  rows.push(['Total Orders', String(report.total_orders || 0)]);
  rows.push(['Total Guests', String(report.total_guests || 0)]);
  rows.push(['Tables Served', String(report.total_tables_served || 0)]);
  rows.push(['Avg Order Value', report.avg_order_value?.toFixed(2) || '0.00']);
  rows.push([]);

  // Channel Breakdown
  if (report.channel_breakdown) {
    rows.push(['CHANNEL BREAKDOWN']);
    rows.push(['Channel', 'Sales', 'Refunds', 'Net', 'Orders']);
    const ch = report.channel_breakdown;
    const channels = [
      { key: 'dine_in', label: 'Dine-In' },
      { key: 'pos_waiting', label: 'POS Waiting' },
      { key: 'pos_collection', label: 'POS Collection' },
      { key: 'pos_delivery', label: 'POS Delivery' },
      { key: 'online_collection', label: 'Online Collection' },
      { key: 'online_delivery', label: 'Online Delivery' },
      { key: 'ai_voice', label: 'AI Voice' },
    ];
    for (const c of channels) {
      const data = (ch as any)[c.key];
      if (data) {
        rows.push([
          c.label,
          data.sales?.toFixed(2) || '0.00',
          data.refunds?.toFixed(2) || '0.00',
          data.net?.toFixed(2) || '0.00',
          String(data.count || 0)
        ]);
      }
    }
    rows.push([]);
  }

  // Payment Breakdown
  if (report.payment_breakdown) {
    rows.push(['PAYMENT BREAKDOWN']);
    rows.push(['Method', 'Sales', 'Refunds', 'Net', 'Count']);
    const pb = report.payment_breakdown;
    for (const method of ['cash', 'card', 'online', 'other'] as const) {
      const data = pb[method];
      if (data) {
        rows.push([
          method.charAt(0).toUpperCase() + method.slice(1),
          data.sales?.toFixed(2) || '0.00',
          data.refunds?.toFixed(2) || '0.00',
          data.net?.toFixed(2) || '0.00',
          String(data.count || 0)
        ]);
      }
    }
    rows.push([]);
  }

  // Cash Drawer
  if (report.cash_drawer) {
    rows.push(['CASH DRAWER']);
    rows.push(['Item', 'Amount']);
    const cd = report.cash_drawer;
    rows.push(['Opening Float', cd.opening_float?.toFixed(2) || '0.00']);
    rows.push(['Cash Sales', cd.cash_sales?.toFixed(2) || '0.00']);
    rows.push(['Cash Refunds', cd.cash_refunds?.toFixed(2) || '0.00']);
    rows.push(['Paid Outs', cd.paid_outs?.toFixed(2) || '0.00']);
    rows.push(['Paid Ins', cd.paid_ins?.toFixed(2) || '0.00']);
    rows.push(['Safe Drops', cd.safe_drops?.toFixed(2) || '0.00']);
    rows.push(['Expected Cash', cd.expected_cash?.toFixed(2) || '0.00']);
    rows.push(['Actual Cash', cd.actual_cash?.toFixed(2) || '0.00']);
    rows.push(['Variance', cd.variance?.toFixed(2) || '0.00']);
  }

  const csvContent = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
  const dateStr = report.business_date || new Date().toISOString().slice(0, 10);
  const filename = `z-report-${dateStr}.csv`;

  return saveFile(csvContent, filename, [
    { name: 'CSV Files', extensions: ['csv'] },
    { name: 'All Files', extensions: ['*'] }
  ]);
}

// ============================================================================
// GENERIC ORDER EXPORT (for future use)
// ============================================================================

export async function exportGenericCSV(
  headers: string[],
  rows: any[][],
  filename: string
): Promise<boolean> {
  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ];
  const csvContent = csvLines.join('\n');

  return saveFile(csvContent, filename, [
    { name: 'CSV Files', extensions: ['csv'] },
    { name: 'All Files', extensions: ['*'] }
  ]);
}
