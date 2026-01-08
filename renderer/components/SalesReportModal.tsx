import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart3, TrendingUp, DollarSign, Users, Clock, Download, FileText, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { colors, cardStyle } from '../utils/designSystem';
import { SafeDate } from '../utils';

interface SalesData {
  dailyTotal: number;
  onlineSales: {
    count: number;
    revenue: number;
  };
  voiceAgentSales: {
    count: number;
    revenue: number;
  };
  paymentMethods: {
    cash: number;
    card: number;
    other: number;
  };
  orderTypes: {
    dineIn: number;
    takeaway: number;
    delivery: number;
  };
  topItems: {
    name: string;
    count: number;
    revenue: number;
  }[];
}

// Mock data to display in the report
const mockSalesData: SalesData = {
  dailyTotal: 2580,
  onlineSales: {
    count: 24,
    revenue: 975
  },
  voiceAgentSales: {
    count: 8,
    revenue: 312
  },
  paymentMethods: {
    cash: 825,
    card: 1650,
    other: 105
  },
  orderTypes: {
    dineIn: 18,
    takeaway: 14,
    delivery: 12
  },
  topItems: [
    { name: 'Chicken Tikka Masala', count: 22, revenue: 286 },
    { name: 'Garlic Naan', count: 18, revenue: 63 },
    { name: 'Lamb Biryani', count: 15, revenue: 225 },
    { name: 'Vegetable Samosa', count: 12, revenue: 48 },
    { name: 'Mango Lassi', count: 10, revenue: 45 }
  ]
};

interface SalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SalesReportModal({ isOpen, onClose }: SalesReportModalProps) {
  const [stage, setStage] = useState<'password' | 'report'>('password');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get the password from settings store
  const [correctPassword, setCorrectPassword] = useState('Noor'); // Default fallback
  
  useEffect(() => {
    // Get the password from the settings store
    const storePassword = useSettingsStore.getState().settings.salesReportPassword;
    if (storePassword) {
      setCorrectPassword(storePassword);
    }
    
    // Subscribe to settings changes
    const unsubscribe = useSettingsStore.subscribe(
      state => state.settings.salesReportPassword,
      password => {
        if (password) setCorrectPassword(password);
      }
    );
    
    return () => unsubscribe();
  }, []);
  
  const handlePasswordSubmit = () => {
    if (password === correctPassword) {
      setErrorMessage('');
      setStage('report');
    } else {
      setErrorMessage('Incorrect password');
      toast.error('Access denied - incorrect password');
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleClose = () => {
    // Reset state when closing
    setStage('password');
    setPassword('');
    setErrorMessage('');
    onClose();
  };

  return (
    <StrictDialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(false); }}>
      <div className="max-w-4xl bg-gray-900 border-gray-800 text-white print:bg-white print:text-black" id="sales-report-printable">
        {stage === 'password' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-rose-500" />
                <span>Secure Sales Report</span>
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Please enter your manager password to view the sales report.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                className="bg-black/20 border-white/10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
              />
              {errorMessage && (
                <p className="text-rose-500 text-sm">{errorMessage}</p>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handlePasswordSubmit} 
                className="bg-rose-800 hover:bg-rose-700"
              >
                Access Report
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="print:pb-6 print:border-b print:border-gray-200">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-rose-500 print:text-gray-800" />
                  <span>Sales Summary Report</span>
                </DialogTitle>
                <div className="flex items-center gap-2 print:hidden">
                  <Button 
                    onClick={handlePrint} 
                    variant="outline" 
                    size="sm"
                    className="bg-transparent border-gray-700 hover:bg-gray-800"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button 
                    onClick={() => handleClose(false)}
                    variant="ghost" 
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
              <DialogDescription className="text-gray-400 print:text-gray-600">
                <span className="print:hidden">Detailed breakdown of today's sales figures</span>
                <span className="hidden print:block">
                  Generated on <SafeDate date={new Date()} format="date" /> at <SafeDate date={new Date()} format="time" />
                </span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-6 space-y-6 print:mt-0">
              {/* Top level summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors shadow-lg print:bg-white print:border print:shadow-none">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 print:text-gray-600">Total Sales</p>
                      <p className="text-2xl font-bold print:text-black">£{mockSalesData.dailyTotal.toLocaleString()}</p>
                      <div className="flex items-center text-sm text-green-500 mt-1">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        12% from yesterday
                      </div>
                    </div>
                    <CreditCard className="h-8 w-8 text-emerald-500 print:text-gray-800" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </StrictDialog>
  );
}
