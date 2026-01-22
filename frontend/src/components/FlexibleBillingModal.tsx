import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Receipt, Users, DollarSign } from 'lucide-react';
import { OrderItem } from '../utils/menuTypes';
import { TableData } from '../utils/tableTypes';
import { useRealtimeMenuStore, BillingOption } from '../utils/realtimeMenuStore';

interface FlexibleBillingModalProps {
  onPrintBill: (option: BillingOption) => void;
}

export interface BillingOption {
  type: 'combined' | 'separate' | 'selective';
  tableNumbers?: number[]; // For selective billing
  items: OrderItem[];
  total: number;
  selectedItems?: OrderItem[]; // For selective billing with specific items
}

interface TableBill {
  tableNumber: number;
  items: OrderItem[];
  total: number;
  isSelected: boolean;
}

/**
 * Flexible Billing Modal for Linked Tables
 * Allows staff to choose between combined bill, separate bills by table, or selective billing
 * Now uses useRealtimeMenuStore for state management instead of props
 */
export function FlexibleBillingModal({
  onPrintBill
}: FlexibleBillingModalProps) {
  // Get modal state from store instead of props
  const { 
    flexibleBillingModal,
    closeFlexibleBillingModal 
  } = useRealtimeMenuStore();
  
  const {
    isOpen,
    orderItems,
    linkedTables,
    primaryTableNumber
  } = flexibleBillingModal;
  
  const [billingMode, setBillingMode] = useState<'combined' | 'separate' | 'selective'>('combined');
  const [selectedTables, setSelectedTables] = useState<Set<number>>(new Set());

  // Calculate bills by table
  const tableBills = useMemo(() => {
    const bills = new Map<number, TableBill>();
    
    // Initialize bills for all linked tables + primary
    const allTables = [primaryTableNumber, ...linkedTables.map(t => t.tableNumber)];
    allTables.forEach(tableNumber => {
      bills.set(tableNumber, {
        tableNumber,
        items: [],
        total: 0,
        isSelected: false
      });
    });

    // Group items by source table
    orderItems.forEach(item => {
      const sourceTable = item.sourceTableNumber || primaryTableNumber;
      const bill = bills.get(sourceTable);
      if (bill) {
        bill.items.push(item);
        bill.total += item.price * item.quantity;
      }
    });

    return Array.from(bills.values()).filter(bill => bill.items.length > 0);
  }, [orderItems, linkedTables, primaryTableNumber]);

  // Calculate combined total
  const combinedTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [orderItems]);

  // Calculate selective total
  const selectiveTotal = useMemo(() => {
    return tableBills
      .filter(bill => selectedTables.has(bill.tableNumber))
      .reduce((sum, bill) => sum + bill.total, 0);
  }, [tableBills, selectedTables]);

  const handleTableSelection = (tableNumber: number) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(tableNumber)) {
      newSelected.delete(tableNumber);
    } else {
      newSelected.add(tableNumber);
    }
    setSelectedTables(newSelected);
  };

  const handlePrintBill = () => {
    let billingOption: BillingOption;

    switch (billingMode) {
      case 'combined':
        billingOption = {
          type: 'combined',
          items: orderItems,
          total: combinedTotal
        };
        break;
      case 'separate':
        // For separate bills, we'll print all table bills
        billingOption = {
          type: 'separate',
          tableNumbers: tableBills.map(bill => bill.tableNumber),
          items: orderItems,
          total: combinedTotal
        };
        break;
      case 'selective':
        const selectedItems = tableBills
          .filter(bill => selectedTables.has(bill.tableNumber))
          .flatMap(bill => bill.items);
        billingOption = {
          type: 'selective',
          tableNumbers: Array.from(selectedTables),
          items: selectedItems,
          total: selectiveTotal,
          selectedItems: selectedItems
        };
        break;
    }

    onPrintBill(billingOption);
    closeFlexibleBillingModal();
  };

  const canPrint = billingMode !== 'selective' || selectedTables.size > 0;

  return (
    <Dialog open={isOpen} onOpenChange={closeFlexibleBillingModal}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 13, 35, 0.98) 100%)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(124, 93, 250, 0.3)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <Receipt className="w-6 h-6 text-purple-400" />
            Billing Options for Linked Tables
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Choose how to handle billing for {linkedTables.length + 1} linked tables with {orderItems.length} total items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Table Summary */}
          <Card style={{
            background: 'rgba(21, 21, 21, 0.4)',
            border: '1px solid rgba(124, 93, 250, 0.2)',
            backdropFilter: 'blur(4px)',
          }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Linked Tables Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  Table {primaryTableNumber} (Primary)
                </Badge>
                {linkedTables.map(table => (
                  <Badge key={table.tableNumber} variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    Table {table.tableNumber} (Linked)
                  </Badge>
                ))}
              </div>
              <div className="mt-3 text-white/70">
                Total Items: {orderItems.length} • Combined Total: £{combinedTotal.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          {/* Billing Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Combined Bill */}
            <Card 
              className={`cursor-pointer transition-all ${
                billingMode === 'combined' 
                  ? 'ring-2 ring-purple-500' 
                  : 'hover:ring-1 hover:ring-purple-500/50'
              }`}
              style={{
                background: billingMode === 'combined' 
                  ? 'rgba(124, 93, 250, 0.2)' 
                  : 'rgba(21, 21, 21, 0.4)',
                border: '1px solid rgba(124, 93, 250, 0.3)',
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => setBillingMode('combined')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Receipt className="w-8 h-8 text-purple-400" />
                  {billingMode === 'combined' && <Check className="w-6 h-6 text-green-400" />}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">One Combined Bill</h3>
                <p className="text-white/70 text-sm mb-3">
                  Print all items from all tables on a single bill
                </p>
                <div className="text-white font-bold">£{combinedTotal.toFixed(2)}</div>
              </CardContent>
            </Card>

            {/* Separate Bills */}
            <Card 
              className={`cursor-pointer transition-all ${
                billingMode === 'separate' 
                  ? 'ring-2 ring-purple-500' 
                  : 'hover:ring-1 hover:ring-purple-500/50'
              }`}
              style={{
                background: billingMode === 'separate' 
                  ? 'rgba(124, 93, 250, 0.2)' 
                  : 'rgba(21, 21, 21, 0.4)',
                border: '1px solid rgba(124, 93, 250, 0.3)',
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => setBillingMode('separate')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <CreditCard className="w-8 h-8 text-purple-400" />
                  {billingMode === 'separate' && <Check className="w-6 h-6 text-green-400" />}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Separate Bills</h3>
                <p className="text-white/70 text-sm mb-3">
                  Print separate bills for each table based on where items were added
                </p>
                <div className="text-white font-bold">{tableBills.length} Bills</div>
              </CardContent>
            </Card>

            {/* Selective Bills */}
            <Card 
              className={`cursor-pointer transition-all ${
                billingMode === 'selective' 
                  ? 'ring-2 ring-purple-500' 
                  : 'hover:ring-1 hover:ring-purple-500/50'
              }`}
              style={{
                background: billingMode === 'selective' 
                  ? 'rgba(124, 93, 250, 0.2)' 
                  : 'rgba(21, 21, 21, 0.4)',
                border: '1px solid rgba(124, 93, 250, 0.3)',
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => setBillingMode('selective')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="w-8 h-8 text-purple-400" />
                  {billingMode === 'selective' && <Check className="w-6 h-6 text-green-400" />}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Select Tables</h3>
                <p className="text-white/70 text-sm mb-3">
                  Choose specific tables to bill (e.g., if some guests leave early)
                </p>
                <div className="text-white font-bold">
                  {selectedTables.size > 0 ? `£${selectiveTotal.toFixed(2)}` : 'Select tables'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Selection for Selective Billing */}
          {billingMode === 'selective' && (
            <Card style={{
              background: 'rgba(21, 21, 21, 0.4)',
              border: '1px solid rgba(124, 93, 250, 0.2)',
              backdropFilter: 'blur(4px)',
            }}>
              <CardHeader>
                <CardTitle className="text-white">Select Tables to Bill</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tableBills.map(bill => (
                    <Card 
                      key={bill.tableNumber}
                      className={`cursor-pointer transition-all ${
                        selectedTables.has(bill.tableNumber)
                          ? 'ring-2 ring-green-500 bg-green-500/10'
                          : 'hover:ring-1 hover:ring-purple-500/50'
                      }`}
                      style={{
                        background: selectedTables.has(bill.tableNumber)
                          ? 'rgba(34, 197, 94, 0.1)'
                          : 'rgba(15, 15, 15, 0.6)',
                        border: '1px solid rgba(124, 93, 250, 0.2)',
                      }}
                      onClick={() => handleTableSelection(bill.tableNumber)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-semibold">
                              Table {bill.tableNumber}
                              {bill.tableNumber === primaryTableNumber && " (Primary)"}
                            </div>
                            <div className="text-white/70 text-sm">
                              {bill.items.length} items
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">£{bill.total.toFixed(2)}</div>
                            {selectedTables.has(bill.tableNumber) && (
                              <Check className="w-5 h-5 text-green-400 mt-1" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bill Preview */}
          {billingMode === 'separate' && (
            <Card style={{
              background: 'rgba(21, 21, 21, 0.4)',
              border: '1px solid rgba(124, 93, 250, 0.2)',
              backdropFilter: 'blur(4px)',
            }}>
              <CardHeader>
                <CardTitle className="text-white">Separate Bills Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tableBills.map(bill => (
                    <div key={bill.tableNumber} className="border border-gray-600 rounded p-3">
                      <div className="font-semibold text-white mb-2">
                        Table {bill.tableNumber} Bill
                        {bill.tableNumber === primaryTableNumber && " (Primary)"}
                      </div>
                      <div className="space-y-1">
                        {bill.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm text-white/80">
                            <span>{item.quantity}x {item.name}</span>
                            <span>£{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-2 bg-gray-600" />
                      <div className="flex justify-between font-bold text-white">
                        <span>Total:</span>
                        <span>£{bill.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={closeFlexibleBillingModal}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePrintBill}
              disabled={!canPrint}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Print Bill{billingMode === 'separate' ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
