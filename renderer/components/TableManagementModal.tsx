import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Users, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { globalColors } from '../utils/QSAIDesign';

// Types
interface Table {
  table_number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'unavailable';
  last_updated?: string;
}

interface TableManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTablesUpdate?: () => void;
}

interface TableFormData {
  table_number?: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'unavailable';
}

const TableManagementModal: React.FC<TableManagementModalProps> = ({
  isOpen,
  onClose,
  onTablesUpdate
}) => {
  // State management
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deleteTableNumber, setDeleteTableNumber] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<TableFormData>({
    capacity: 4,
    status: 'available'
  });

  // Load tables when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get_tables();
      const data = await response.json();
      
      if (data.success && data.tables) {
        setTables(data.tables.sort((a: Table, b: Table) => a.table_number - b.table_number));
      } else {
        toast.error('Failed to load tables');
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Error loading tables');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTable = async () => {
    try {
      const response = await apiClient.create_table({
        table_number: formData.table_number,
        capacity: formData.capacity,
        status: formData.status
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Table ${data.table.table_number} created successfully`);
        await loadTables();
        setShowAddForm(false);
        resetForm();
        onTablesUpdate?.();
      } else {
        toast.error(data.message || 'Failed to create table');
      }
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Error creating table');
    }
  };

  const handleEditTable = async () => {
    if (!editingTable) return;
    
    try {
      const response = await apiClient.update_pos_table(
        { table_number: editingTable.table_number },
        {
          capacity: formData.capacity,
          status: formData.status
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Table ${editingTable.table_number} updated successfully`);
        await loadTables();
        setEditingTable(null);
        resetForm();
        onTablesUpdate?.();
      } else {
        toast.error('Failed to update table');
      }
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error('Error updating table');
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteTableNumber) return;
    
    try {
      const response = await apiClient.delete_pos_table({ table_number: deleteTableNumber });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Table ${deleteTableNumber} deleted successfully`);
        await loadTables();
        setDeleteTableNumber(null);
        onTablesUpdate?.();
      } else {
        toast.error(data.message || 'Failed to delete table');
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Error deleting table');
    }
  };

  const resetForm = () => {
    setFormData({
      capacity: 4,
      status: 'available'
    });
  };

  const startEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      capacity: table.capacity,
      status: table.status
    });
    setShowAddForm(false);
  };

  const startAdd = () => {
    setShowAddForm(true);
    setEditingTable(null);
    resetForm();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <XCircle className="h-4 w-4" />;
      case 'reserved': return <Clock className="h-4 w-4" />;
      case 'unavailable': return <AlertCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return { bg: 'bg-green-900', text: 'text-green-300' };
      case 'occupied': return { bg: 'bg-red-900', text: 'text-red-300' };
      case 'reserved': return { bg: 'bg-yellow-900', text: 'text-yellow-300' };
      case 'unavailable': return { bg: 'bg-gray-700', text: 'text-gray-300' };
      default: return { bg: 'bg-green-900', text: 'text-green-300' };
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          style={{
            background: globalColors.background.card,
            border: `1px solid ${globalColors.border.light}`,
            color: globalColors.text.primary
          }}
        >
          <DialogHeader>
            <DialogTitle 
              className="text-2xl font-semibold flex items-center gap-2"
              style={{ color: globalColors.text.primary }}
            >
              <Users className="h-6 w-6" style={{ color: globalColors.purple.primary }} />
              Table Management
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p style={{ color: globalColors.text.muted }}>Manage restaurant tables for dine-in orders</p>
                <p className="text-sm" style={{ color: globalColors.text.muted }}>Total tables: {tables.length}</p>
              </div>
              <Button
                onClick={startAdd}
                className="flex items-center gap-2"
                style={{
                  background: globalColors.purple.primary,
                  color: globalColors.text.primary
                }}
              >
                <Plus className="h-4 w-4" />
                Add Table
              </Button>
            </div>

            {/* Add/Edit Form */}
            {(showAddForm || editingTable) && (
              <div
                className="rounded-lg p-6 mb-6"
                style={{
                  background: globalColors.background.secondary,
                  border: `1px solid ${globalColors.border.medium}`
                }}
              >
                <h3 className="text-lg font-medium mb-4" style={{ color: globalColors.text.primary }}>
                  {editingTable ? `Edit Table ${editingTable.table_number}` : 'Add New Table'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {showAddForm && (
                    <div>
                      <Label htmlFor="table-number" className="text-sm font-medium" style={{ color: globalColors.text.secondary }}>Table Number (Optional)</Label>
                      <Input
                        id="table-number"
                        type="number"
                        value={formData.table_number || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, table_number: e.target.value ? parseInt(e.target.value) : undefined }))}
                        placeholder="Auto-generated if empty"
                        className="mt-1"
                        style={{
                          background: globalColors.background.tertiary,
                          border: `1px solid ${globalColors.border.medium}`,
                          color: globalColors.text.primary
                        }}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="capacity" className="text-sm font-medium" style={{ color: globalColors.text.secondary }}>Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                      className="mt-1"
                      style={{
                        background: globalColors.background.tertiary,
                        border: `1px solid ${globalColors.border.medium}`,
                        color: globalColors.text.primary
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium" style={{ color: globalColors.text.secondary }}>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                      <SelectTrigger 
                        className="mt-1"
                        style={{
                          background: globalColors.background.tertiary,
                          border: `1px solid ${globalColors.border.medium}`,
                          color: globalColors.text.primary
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={editingTable ? handleEditTable : handleAddTable}
                    className="flex items-center gap-2"
                    style={{
                      background: globalColors.purple.primary,
                      color: globalColors.text.primary
                    }}
                  >
                    {editingTable ? 'Update Table' : 'Create Table'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingTable(null);
                      resetForm();
                    }}
                    style={{
                      borderColor: globalColors.border.medium,
                      color: globalColors.text.muted
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Tables Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <p style={{ color: globalColors.text.muted }}>Loading tables...</p>
              </div>
            ) : tables.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => {
                  const statusColor = getStatusColor(table.status);
                  return (
                    <div
                      key={table.table_number}
                      className="p-4 rounded-lg border transition-all hover:border-purple-500"
                      style={{
                        background: globalColors.background.secondary,
                        borderColor: globalColors.border.medium
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-lg" style={{ color: globalColors.text.primary }}>
                          Table {table.table_number}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColor.bg} ${statusColor.text}`}>
                          {getStatusIcon(table.status)}
                          {table.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-4" style={{ color: globalColors.text.muted }}>
                        <Users className="h-4 w-4 mr-2" />
                        <span>Capacity: {table.capacity} people</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(table)}
                          className="flex items-center gap-1"
                          style={{
                            borderColor: globalColors.border.accent,
                            color: globalColors.text.primary
                          }}
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTableNumber(table.table_number)}
                          className="flex items-center gap-1"
                          style={{
                            borderColor: globalColors.status.error,
                            color: globalColors.status.error
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4" style={{ color: globalColors.text.muted }} />
                <p className="text-lg" style={{ color: globalColors.text.primary }}>No tables found</p>
                <p className="text-sm" style={{ color: globalColors.text.muted }}>Add your first table to get started</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              style={{
                borderColor: globalColors.border.medium,
                color: globalColors.text.muted
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTableNumber} onOpenChange={() => setDeleteTableNumber(null)}>
        <AlertDialogContent style={{
          background: globalColors.background.card,
          border: `1px solid ${globalColors.border.light}`,
          color: globalColors.text.primary
        }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: globalColors.text.primary }}>
              Delete Table {deleteTableNumber}
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: globalColors.text.muted }}>
              Are you sure you want to delete this table? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              style={{
                borderColor: globalColors.border.medium,
                color: globalColors.text.muted
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTable}
              style={{
                background: globalColors.status.error,
                color: globalColors.text.primary
              }}
            >
              Delete Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TableManagementModal;
