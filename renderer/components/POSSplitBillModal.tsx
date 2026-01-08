

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { OrderItem } from "../utils/menuTypes";
import { Check, Plus, Trash2, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QSAITheme } from "../utils/QSAIDesign";
import { hexToRgb } from "../utils/utils";
import { motion } from "framer-motion";

// Split bill interface
export interface SplitBill {
  id: string;
  name: string;
  items: string[]; // IDs of the items assigned to this split
  paid: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  orderItems: OrderItem[];
  onSaveSplitBills: (splitBills: SplitBill[]) => void;
  existingSplitBills?: SplitBill[];
}

interface OrderItemWithAssignment extends OrderItem {
  assigned?: boolean;
  highlight?: boolean;
}

/**
 * Split Bill Modal Component
 * Allows users to split the bill by creating multiple bills and assigning items to each bill
 */
export function POSSplitBillModal({ isOpen, onClose, tableNumber, orderItems, onSaveSplitBills, existingSplitBills = [] }: Props) {
  const [splitBills, setSplitBills] = useState<SplitBill[]>(existingSplitBills.length > 0 ? existingSplitBills : []);
  const [newBillName, setNewBillName] = useState("");
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [assignedItems, setAssignedItems] = useState<Record<string, string[]>>({});
  
  // Initialize assigned items based on existing split bills
  useEffect(() => {
    if (existingSplitBills.length > 0) {
      const initialAssignedItems: Record<string, string[]> = {};
      existingSplitBills.forEach(bill => {
        initialAssignedItems[bill.id] = bill.items;
      });
      setAssignedItems(initialAssignedItems);
      
      // Set the first bill as selected
      if (existingSplitBills.length > 0 && !selectedBillId) {
        setSelectedBillId(existingSplitBills[0].id);
      }
    }
  }, [existingSplitBills, selectedBillId]);
  
  // Get an array of all assigned item IDs for any bill
  const getAllAssignedItemIds = (): string[] => {
    return Object.values(assignedItems).flat();
  };
  
  // Get an array of order items with assignment state
  const getOrderItemsWithAssignment = (): OrderItemWithAssignment[] => {
    const allAssignedItemIds = getAllAssignedItemIds();
    
    return orderItems.map(item => ({
      ...item,
      assigned: item.id ? allAssignedItemIds.includes(item.id) : false,
      highlight: selectedBillId && item.id ? assignedItems[selectedBillId]?.includes(item.id) : false
    }));
  };
  
  // Calculate the total for a given bill
  const calculateBillTotal = (billId: string): number => {
    if (!billId) return 0;
    
    const billItemIds = assignedItems[billId] || [];
    return orderItems
      .filter(item => item.id && billItemIds.includes(item.id))
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  // Create a new bill
  const handleCreateBill = () => {
    if (!newBillName.trim()) return;
    
    const newBill: SplitBill = {
      id: Date.now().toString(),
      name: newBillName.trim(),
      items: [],
      paid: false
    };
    
    setSplitBills([...splitBills, newBill]);
    setAssignedItems({
      ...assignedItems,
      [newBill.id]: []
    });
    setSelectedBillId(newBill.id);
    setNewBillName("");
  };
  
  // Delete a bill
  const handleDeleteBill = (billId: string) => {
    // Remove the bill from the list
    setSplitBills(splitBills.filter(bill => bill.id !== billId));
    
    // Remove the assigned items for this bill
    const { [billId]: _, ...remainingAssignedItems } = assignedItems;
    setAssignedItems(remainingAssignedItems);
    
    // If the deleted bill was selected, select another one if available
    if (selectedBillId === billId) {
      const nextBill = splitBills.find(bill => bill.id !== billId);
      setSelectedBillId(nextBill?.id || null);
    }
  };
  
  // Toggle item assignment to the selected bill
  const toggleItemAssignment = (itemId: string) => {
    if (!selectedBillId || !itemId) return;
    
    setAssignedItems(prev => {
      const currentAssignedItems = [...(prev[selectedBillId] || [])];
      const isAssigned = currentAssignedItems.includes(itemId);
      
      if (isAssigned) {
        // Remove item from this bill
        return {
          ...prev,
          [selectedBillId]: currentAssignedItems.filter(id => id !== itemId)
        };
      } else {
        // Add item to this bill
        return {
          ...prev,
          [selectedBillId]: [...currentAssignedItems, itemId]
        };
      }
    });
  };
  
  // Toggle paid status of a bill
  const toggleBillPaid = (billId: string) => {
    setSplitBills(splitBills.map(bill => {
      if (bill.id === billId) {
        return { ...bill, paid: !bill.paid };
      }
      return bill;
    }));
  };
  
  // Save the split bills
  const handleSave = () => {
    // Update items arrays in each bill
    const updatedBills = splitBills.map(bill => ({
      ...bill,
      items: assignedItems[bill.id] || []
    }));
    
    onSaveSplitBills(updatedBills);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[800px] max-h-[90vh] overflow-hidden text-white animate-in fade-in-90 zoom-in-90 duration-200" 
        style={{
          background: 'linear-gradient(145deg, #121212 0%, #1a1a1a 100%)',
          backdropFilter: 'blur(4px)',
          border: `1px solid rgba(124, 93, 250, 0.2)`,
          boxShadow: `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 15px rgba(124, 93, 250, 0.3)`,
          borderRadius: '1rem'
        }}
      >
        <DialogHeader
          className="border-b"
          style={{
            borderBottomColor: `${QSAITheme.accent.gold}20`,
            marginBottom: '1rem',
            paddingBottom: '0.75rem'
          }}
        >
          <DialogTitle 
            className="text-xl font-bold flex items-center"
            style={{
              backgroundImage: `linear-gradient(135deg, #FFFFFF 0%, ${QSAITheme.accent.gold_light} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 20px rgba(249, 168, 38, 0.3)'
            }}
          >
            <User className="mr-2 h-5 w-5" style={{ filter: 'drop-shadow(0 0 5px rgba(249, 168, 38, 0.3))' }} /> 
            Split Bill - Table {tableNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row h-[70vh] gap-4 overflow-hidden">
          {/* Left side - Bills */}
          <div className="md:w-1/3 flex flex-col h-full pr-4" 
            style={{ 
              borderRight: `1px solid ${QSAITheme.accent.gold}20`
            }}
          >
            <h3 className="text-md font-medium mb-2 text-white">Bills</h3>
            
            {/* Create new bill form */}
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <Label htmlFor="new-bill-name" className="mb-1 text-sm text-[#BBC3E1]">Add New Bill</Label>
                <Input
                  id="new-bill-name"
                  placeholder="Person's name"
                  value={newBillName}
                  onChange={(e) => setNewBillName(e.target.value)}
                  style={{  
                    background: 'rgba(21, 21, 21, 0.5)',
                    border: `1px solid rgba(124, 93, 250, 0.4)`,
                    color: '#FFFFFF',
                    backdropFilter: 'blur(4px)'
                  }}
                />
              </div>
              <motion.div 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  size="sm"
                  onClick={handleCreateBill}
                  disabled={!newBillName.trim()}
                  className="transition-all duration-300"
                  style={{ 
                    background: `linear-gradient(135deg, #7C5DFA 0%, #6B4DEA 100%)`,
                    color: 'white',
                    border: 'none',
                    boxShadow: `0 4px 12px rgba(124, 93, 250, 0.25)`,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" style={{ filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.5))' }} /> Add
                </Button>
              </motion.div>
            </div>
            
            {/* Bill list */}
            <ScrollArea className="flex-1 pr-3">
              {splitBills.length === 0 ? (
                <div className="text-center py-8 text-[#BBC3E1]/70">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No bills created yet</p>
                  <p className="text-xs mt-1">Create a bill for each person who wants to pay separately</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {splitBills.map(bill => {
                    const total = calculateBillTotal(bill.id);
                    const itemCount = assignedItems[bill.id]?.length || 0;
                    const isSelected = selectedBillId === bill.id;
                    
                    return (
                      <Card 
                        key={bill.id} 
                        className={`cursor-pointer transition-all ${bill.paid ? 'opacity-60' : ''}`}
                        style={{
                          background: isSelected 
                            ? `linear-gradient(135deg, rgba(124, 93, 250, 0.1) 0%, rgba(124, 93, 250, 0.05) 100%)` 
                            : 'rgba(21, 21, 21, 0.5)',
                          border: isSelected 
                            ? `1px solid rgba(124, 93, 250, 0.7)` 
                            : `1px solid rgba(124, 93, 250, 0.3)`,
                          backdropFilter: 'blur(4px)',
                          boxShadow: isSelected 
                            ? `0 0 15px rgba(124, 93, 250, 0.15)` 
                            : 'none',
                          transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                        onClick={() => setSelectedBillId(bill.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                <h4 className="font-medium text-[#E5E5E5]">{bill.name}</h4>
                                {bill.paid && (
                                  <Badge 
                                    className="ml-2 text-[10px] py-0"
                                    style={{
                                      background: `linear-gradient(135deg, rgba(107, 0, 0, 0.9) 0%, rgba(107, 0, 0, 0.9) 100%)`,
                                      border: `1px solid rgba(107, 0, 0, 0.4)`,
                                      color: '#FFFFFF',
                                      textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
                                      boxShadow: `0 0 10px rgba(107, 0, 0, 0.2)`,
                                    }}
                                  >
                                    Paid
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center mt-1 text-xs text-[#BBC3E1]">
                                <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                                <span className="mx-1">•</span>
                <span className="font-medium" style={{
                                  color: '#FFFFFF'
                                }}>
                                  £{total.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="flex">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                className="flex"
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-full transition-all duration-300"
                                  style={{
                                    background: bill.paid 
                                      ? `linear-gradient(135deg, rgba(32, 217, 207, 0.2) 0%, rgba(14, 186, 177, 0.2) 100%)`
                                      : 'rgba(21, 25, 42, 0.5)',
                                    border: bill.paid
                                      ? `1px solid ${QSAITheme.accent.turquoise}40`
                                      : `1px solid ${QSAITheme.accent.gold}30`,
                                    color: bill.paid ? QSAITheme.accent.turquoise : '#BBC3E1',
                                    backdropFilter: 'blur(4px)',
                                    boxShadow: bill.paid 
                                      ? `0 0 10px rgba(${hexToRgb(QSAITheme.accent.turquoise)}, 0.15)` 
                                      : 'none',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBillPaid(bill.id);
                                  }}
                                >
                                  {bill.paid ? 
                                    <X className="h-4 w-4" style={{ filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.3))' }} /> : 
                                    <Check className="h-4 w-4" style={{ filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.3))' }} />
                                  }
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-full transition-all duration-300"
                                  style={{
                                    background: 'rgba(21, 25, 42, 0.5)',
                                    border: `1px solid rgba(244, 63, 94, 0.3)`,
                                    color: '#BBC3E1',
                                    backdropFilter: 'blur(4px)',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBill(bill.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" style={{ filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.3))' }} />
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Right side - Items */}
          <div className="md:w-2/3 flex flex-col h-full overflow-hidden">
            <div className="mb-2 flex justify-between items-center">
              <h3 className="text-md font-medium text-white">Order Items</h3>
              {selectedBillId && (
                <p className="text-sm text-[#BBC3E1]">
                  Assigning items to: <span className="font-medium text-white">{splitBills.find(b => b.id === selectedBillId)?.name}</span>
                </p>
              )}
            </div>
            
              <ScrollArea 
              className="flex-1 pr-3 rounded-md" 
              style={{
                background: 'rgba(21, 21, 21, 0.3)',
                border: `1px solid rgba(124, 93, 250, 0.2)`,
                backdropFilter: 'blur(4px)',
              }}
            >
              {orderItems.length === 0 ? (
                <div className="text-center py-8 text-[#BBC3E1]/70">
                  <p className="text-sm">No order items</p>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {getOrderItemsWithAssignment().map((item, index) => {
                    const isAssignedToSelectedBill = selectedBillId && item.id 
                      ? assignedItems[selectedBillId]?.includes(item.id) 
                      : false;
                    
                    return (
                      <Card 
                        key={`item-${index}`}
                        className={`transition-all ${item.assigned && !isAssignedToSelectedBill ? 'opacity-50' : ''}`}
                        style={{
                          background: isAssignedToSelectedBill 
                            ? `linear-gradient(135deg, rgba(124, 93, 250, 0.1) 0%, rgba(124, 93, 250, 0.05) 100%)` 
                            : 'rgba(21, 21, 21, 0.5)',
                          border: isAssignedToSelectedBill 
                            ? `1px solid rgba(124, 93, 250, 0.7)` 
                            : `1px solid rgba(124, 93, 250, 0.3)`,
                          backdropFilter: 'blur(4px)',
                          boxShadow: isAssignedToSelectedBill 
                            ? `0 0 10px rgba(124, 93, 250, 0.15)` 
                            : 'none',
                        }}
                      >
                        <CardContent className="p-3 flex items-center">
                          {selectedBillId && (
                            <Checkbox
                              checked={isAssignedToSelectedBill}
                              onCheckedChange={() => item.id ? toggleItemAssignment(item.id) : null}
                              className="mr-3"
                              disabled={item.assigned && !isAssignedToSelectedBill}
                              style={{
                                background: isAssignedToSelectedBill ? 
                                  `linear-gradient(135deg, #7C5DFA 0%, #6B4DEA 100%)` : 
                                  'rgba(21, 21, 21, 0.5)',
                                border: isAssignedToSelectedBill ? 
                                  `1px solid #7C5DFA` : 
                                  `1px solid rgba(124, 93, 250, 0.4)`,
                                boxShadow: isAssignedToSelectedBill ? 
                                  `0 0 10px rgba(124, 93, 250, 0.2)` : 
                                  'none',
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium text-[#E5E5E5]">{item.name}</h4>
                                {item.variantName && (
                                  <p className="text-xs text-[#BBC3E1]">{item.variantName}</p>
                                )}
                              </div>
                              <p className="font-medium" style={{
                                color: '#FFFFFF'
                              }}>
                                £{(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex justify-between mt-1">
                              <div className="flex items-center text-xs text-[#BBC3E1]">
                                <span>Qty: {item.quantity}</span>
                                {item.notes && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <span>Note: {item.notes}</span>
                                  </>
                                )}
                              </div>
                              {item.assigned && !isAssignedToSelectedBill && (
                                    <Badge 
                                  variant="outline" 
                                  className="text-[10px] py-0"
                                  style={{
                                    background: 'rgba(21, 21, 21, 0.5)',
                                    border: `1px solid rgba(124, 93, 250, 0.3)`,
                                    color: '#BBC3E1',
                                    backdropFilter: 'blur(4px)',
                                  }}
                                >
                                  Assigned
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        
        {/* Footer actions */}
        <DialogFooter
          style={{
            borderTop: `1px solid ${QSAITheme.accent.gold}20`,
            marginTop: '1rem',
            paddingTop: '1rem'
          }}
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button 
              variant="outline" 
              onClick={onClose}
              className="transition-all duration-300"
              style={{ 
                background: 'rgba(21, 21, 21, 0.5)',
                border: `1px solid rgba(124, 93, 250, 0.4)`,
                color: '#E5E5E5',
                backdropFilter: 'blur(4px)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              Cancel
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button 
              onClick={handleSave}
              className="transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, #7C5DFA 0%, #6B4DEA 100%)`,
                color: 'white',
                border: 'none',
                boxShadow: `0 4px 12px rgba(124, 93, 250, 0.3)`,
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                fontWeight: 600,
                letterSpacing: '0.01em',
              }}
              disabled={splitBills.length === 0}
            >
              Save Split Bills
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
