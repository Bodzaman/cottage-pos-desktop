import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Search,
  Calendar,
  CreditCard,
  FileText,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { globalColors as QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { apiClient } from 'app';
import { toast } from 'sonner';
import {
  RefundRequest,
  RefundResponse,
  RefundListResponse,
  RefundInfo
} from 'utils/refundTypes';

interface RefundManagementPanelProps {
  className?: string;
}

export function RefundManagementPanel({ className }: RefundManagementPanelProps) {
  const [refunds, setRefunds] = useState<RefundInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [totalRefunded, setTotalRefunded] = useState(0);
  
  // Refund creation form state
  const [newRefund, setNewRefund] = useState({
    order_id: '',
    refund_type: 'partial',
    refund_amount: '',
    reason: '',
    admin_notes: '',
    admin_user_id: 'admin' // In real app, get from auth context
  });

  // Load refunds on component mount
  useEffect(() => {
    loadRefunds();
  }, [statusFilter, searchOrderId]);

  const loadRefunds = async () => {
    try {
      setIsLoading(true);
      
      const params: any = {
        limit: 50
      };
      
      if (searchOrderId.trim()) {
        params.order_id = searchOrderId.trim();
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await apiClient.list_refunds(params);
      const data: RefundListResponse = await response.json();
      
      if (data.success) {
        setRefunds(data.refunds);
        setTotalRefunded(data.total_refunded);
      } else {
        toast.error('Failed to load refunds');
      }
    } catch (error) {
      console.error('Error loading refunds:', error);
      toast.error('Error loading refunds');
    } finally {
      setIsLoading(false);
    }
  };

  const createRefund = async () => {
    try {
      setIsProcessing(true);
      
      const refundData: RefundRequest = {
        order_id: newRefund.order_id,
        refund_type: newRefund.refund_type,
        refund_amount: newRefund.refund_amount ? parseFloat(newRefund.refund_amount) : undefined,
        reason: newRefund.reason,
        admin_notes: newRefund.admin_notes,
        notify_customer: true,
        admin_user_id: newRefund.admin_user_id
      };
      
      const response = await apiClient.create_refund(refundData);
      const result: RefundResponse = await response.json();
      
      if (result.success) {
        toast.success(`Refund processed: £${result.refund_amount?.toFixed(2)}`);
        setIsCreateModalOpen(false);
        resetForm();
        loadRefunds(); // Refresh the list
      } else {
        toast.error(result.message || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error creating refund:', error);
      toast.error('Error processing refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setNewRefund({
      order_id: '',
      refund_type: 'partial',
      refund_amount: '',
      reason: '',
      admin_notes: '',
      admin_user_id: 'admin'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { color: QSAITheme.success, icon: CheckCircle, label: 'Completed' },
      processing: { color: QSAITheme.warning, icon: Clock, label: 'Processing' },
      failed: { color: QSAITheme.danger, icon: AlertCircle, label: 'Failed' },
      cancelled: { color: QSAITheme.muted, icon: X, label: 'Cancelled' }
    };
    
    const variant = variants[status as keyof typeof variants] || variants.processing;
    const Icon = variant.icon;
    
    return (
      <Badge 
        className="flex items-center gap-1.5 px-2.5 py-1"
        style={{ backgroundColor: `${variant.color}20`, color: variant.color }}
      >
        <Icon className="w-3 h-3" />
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={className}>
      <Card 
        className="border-0 shadow-lg backdrop-blur-sm"
        style={{ backgroundColor: `${QSAITheme.surface}95` }}
      >
        <CardHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" style={{ color: QSAITheme.primary }} />
                Refund Management
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Process and track payment refunds • Total Refunded: £{totalRefunded.toFixed(2)}
              </CardDescription>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Process Refund
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5" style={{ color: QSAITheme.primary }} />
                    Process New Refund
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Create a refund for an order. Full or partial refunds supported.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="order_id" className="text-white">Order ID</Label>
                      <Input
                        id="order_id"
                        placeholder="Enter order ID"
                        value={newRefund.order_id}
                        onChange={(e) => setNewRefund(prev => ({ ...prev, order_id: e.target.value }))}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="refund_type" className="text-white">Refund Type</Label>
                      <Select
                        value={newRefund.refund_type}
                        onValueChange={(value) => setNewRefund(prev => ({ ...prev, refund_type: value }))}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Refund</SelectItem>
                          <SelectItem value="partial">Partial Refund</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {newRefund.refund_type === 'partial' && (
                    <div className="space-y-2">
                      <Label htmlFor="refund_amount" className="text-white">Refund Amount (£)</Label>
                      <Input
                        id="refund_amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newRefund.refund_amount}
                        onChange={(e) => setNewRefund(prev => ({ ...prev, refund_amount: e.target.value }))}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-white">Refund Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Enter reason for refund..."
                      value={newRefund.reason}
                      onChange={(e) => setNewRefund(prev => ({ ...prev, reason: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admin_notes" className="text-white">Admin Notes (Optional)</Label>
                    <Textarea
                      id="admin_notes"
                      placeholder="Internal notes..."
                      value={newRefund.admin_notes}
                      onChange={(e) => setNewRefund(prev => ({ ...prev, admin_notes: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white resize-none"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      resetForm();
                    }}
                    className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createRefund}
                    disabled={isProcessing || !newRefund.order_id || !newRefund.reason}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Process Refund
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by Order ID..."
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                className="w-64 bg-slate-800 border-slate-600 text-white"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={loadRefunds}
              disabled={isLoading}
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Refunds Table */}
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 bg-slate-800/50">
                  <TableHead className="text-slate-300 font-medium">Order ID</TableHead>
                  <TableHead className="text-slate-300 font-medium">Amount</TableHead>
                  <TableHead className="text-slate-300 font-medium">Type</TableHead>
                  <TableHead className="text-slate-300 font-medium">Status</TableHead>
                  <TableHead className="text-slate-300 font-medium">Reason</TableHead>
                  <TableHead className="text-slate-300 font-medium">Created</TableHead>
                  <TableHead className="text-slate-300 font-medium">Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Loading refunds...
                      </TableCell>
                    </TableRow>
                  ) : refunds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No refunds found
                      </TableCell>
                    </TableRow>
                  ) : (
                    refunds.map((refund, index) => (
                      <motion.tr
                        key={refund.refund_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-slate-700 hover:bg-slate-800/30 transition-colors"
                      >
                        <TableCell className="text-white font-mono text-sm">
                          #{refund.order_id}
                        </TableCell>
                        <TableCell className="text-white font-semibold">
                          £{refund.refund_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="capitalize border-slate-600 text-slate-300"
                          >
                            {refund.refund_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(refund.status)}
                        </TableCell>
                        <TableCell className="text-slate-300 max-w-xs truncate">
                          {refund.reason}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {formatDate(refund.created_at)}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {refund.admin_user_id}
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
          
          {refunds.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
              <span>Showing {refunds.length} refunds</span>
              <span>Total refunded: £{totalRefunded.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
