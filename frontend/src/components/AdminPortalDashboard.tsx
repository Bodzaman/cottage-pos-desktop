
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  PoundSterling,
  Package,
  Calculator,
  Calendar,
  ArrowUpRight,
  Download,
} from "lucide-react";
import { toast } from 'sonner';
import { colors, cardStyle } from '../utils/designSystem';

// Interfaces for the Dashboard component
interface SalesData {
  date: string;
  totalSales: number;
  orders: number;
  average: number;
}

interface OrderSummary {
  totalOrders: number;
  averageValue: number;
  pendingOrders: number;
  completedOrders: number;
}

interface TopSellingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  percentageOfSales: number;
}

interface TimeSlot {
  hour: string;
  orders: number;
  revenue: number;
}

interface CustomerData {
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  growthRate: number;
  averageOrdersPerCustomer: number;
}

interface ReservationData {
  upcomingReservations: number;
  totalCovers: number;
  averagePartySize: number;
  maxCapacity: number;
  utilizationPercentage: number;
}

// Sample data
const sampleSalesData: SalesData[] = [
  { date: "Mon", totalSales: 2400, orders: 24, average: 100 },
  { date: "Tue", totalSales: 1800, orders: 18, average: 100 },
  { date: "Wed", totalSales: 3200, orders: 30, average: 106.67 },
  { date: "Thu", totalSales: 2800, orders: 25, average: 112 },
  { date: "Fri", totalSales: 4500, orders: 40, average: 112.5 },
  { date: "Sat", totalSales: 5200, orders: 45, average: 115.56 },
  { date: "Sun", totalSales: 4900, orders: 43, average: 113.95 }
];

const sampleOrderSummary: OrderSummary = {
  totalOrders: 225,
  averageValue: 110.5,
  pendingOrders: 12,
  completedOrders: 213
};

const sampleTopSellingItems: TopSellingItem[] = [
  { id: "1", name: "Chicken Tikka Masala", category: "Main Course", quantity: 78, revenue: 1170, percentageOfSales: 15.6 },
  { id: "2", name: "Garlic Naan", category: "Bread", quantity: 125, revenue: 625, percentageOfSales: 8.3 },
  { id: "3", name: "Lamb Biryani", category: "Rice", quantity: 62, revenue: 992, percentageOfSales: 13.2 },
  { id: "4", name: "Onion Bhaji", category: "Starter", quantity: 92, revenue: 460, percentageOfSales: 6.1 },
  { id: "5", name: "Mango Lassi", category: "Drink", quantity: 86, revenue: 344, percentageOfSales: 4.6 }
];

const samplePeakHours: TimeSlot[] = [
  { hour: "12:00", orders: 12, revenue: 1320 },
  { hour: "13:00", orders: 18, revenue: 1980 },
  { hour: "14:00", orders: 15, revenue: 1650 },
  { hour: "15:00", orders: 8, revenue: 880 },
  { hour: "16:00", orders: 5, revenue: 550 },
  { hour: "17:00", orders: 11, revenue: 1210 },
  { hour: "18:00", orders: 20, revenue: 2200 },
  { hour: "19:00", orders: 32, revenue: 3520 },
  { hour: "20:00", orders: 38, revenue: 4180 },
  { hour: "21:00", orders: 25, revenue: 2750 },
  { hour: "22:00", orders: 15, revenue: 1650 }
];

const sampleCustomerData: CustomerData = {
  newCustomers: 45,
  returningCustomers: 180,
  totalCustomers: 225,
  growthRate: 8.5,
  averageOrdersPerCustomer: 1.8
};

const sampleReservationData: ReservationData = {
  upcomingReservations: 28,
  totalCovers: 112,
  averagePartySize: 4,
  maxCapacity: 150,
  utilizationPercentage: 74.7
};

const AdminPortalDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [salesData, setSalesData] = useState<SalesData[]>(sampleSalesData || []);
  const [orderSummary, setOrderSummary] = useState<OrderSummary>(sampleOrderSummary);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>(sampleTopSellingItems);
  const [peakHours, setPeakHours] = useState<TimeSlot[]>(samplePeakHours);
  const [customerData, setCustomerData] = useState<CustomerData>(sampleCustomerData);
  const [reservationData, setReservationData] = useState<ReservationData>(sampleReservationData);
  const [loading, setLoading] = useState(false);
  
  // Load dashboard data
  useEffect(() => {
    if (!salesData) setSalesData([]);
    if (!orderSummary) setOrderSummary(sampleOrderSummary || { totalOrders: 0, averageValue: 0, pendingOrders: 0, completedOrders: 0 });
    if (!topSellingItems) setTopSellingItems([]);
    if (!peakHours) setPeakHours([]);
    if (!customerData) setCustomerData(sampleCustomerData || { newCustomers: 0, returningCustomers: 0, totalCustomers: 0, growthRate: 0, averageOrdersPerCustomer: 0 });
    if (!reservationData) setReservationData(sampleReservationData || { upcomingReservations: 0, totalCovers: 0, averagePartySize: 0, maxCapacity: 0, utilizationPercentage: 0 });
    
    loadDashboardData();
  }, [timeRange]);
  
  // Load dashboard data based on timeRange
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // In a real implementation, we would fetch from Supabase or API
      // For now, we'll use the sample data with slight variations based on timeRange
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Just use sample data for now
      setSalesData(sampleSalesData);
      setOrderSummary(sampleOrderSummary);
      setTopSellingItems(sampleTopSellingItems);
      setPeakHours(samplePeakHours);
      setCustomerData(sampleCustomerData);
      setReservationData(sampleReservationData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  // Export report to CSV
  const exportReportToCsv = () => {
    // In a real implementation, we would generate a CSV/Excel report
    toast.success('Exporting report... This might take a few moments.');
    setTimeout(() => {
      toast.success('Report ready. Download starting...');
    }, 2000);
  };
  
  // Calculate sales metrics for the summary cards
  const totalSales = salesData?.reduce((acc, day) => acc + day.totalSales, 0) || 0;
  const totalOrders = salesData?.reduce((acc, day) => acc + day.orders, 0) || 0;
  const averageOrderValue = totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.brand.purple }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Dashboard Overview</h2>
          <p className="text-sm" style={{ color: colors.text.secondary }}>Restaurant performance and analytics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: "daily" | "weekly" | "monthly") => setTimeRange(value)}>
            <SelectTrigger className="w-[140px]" style={{ background: colors.background.tertiary, border: `1px solid rgba(255,255,255,0.1)` }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportReportToCsv} style={{ border: `1px solid rgba(255,255,255,0.1)` }}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-0" style={cardStyle}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-md font-medium" style={{ color: colors.text.primary }}>Total Sales</CardTitle>
              <div className="p-1.5 rounded-full" style={{ backgroundColor: "rgba(99, 226, 183, 0.2)" }}>
                <PoundSterling className="h-4 w-4" style={{ color: colors.status.success }} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>{formatCurrency(totalSales)}</div>
            <div className="flex items-center text-xs" style={{ color: colors.status.success }}>
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+12.5% from previous period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0" style={cardStyle}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-md font-medium" style={{ color: colors.text.primary }}>Total Orders</CardTitle>
              <div className="p-1.5 rounded-full" style={{ backgroundColor: "rgba(192, 192, 192, 0.2)" }}> {/* Silver background */}
                <Package className="h-4 w-4" style={{ color: colors.brand.silver }} /> {/* Silver icon */}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>{totalOrders}</div>
            <div className="flex items-center text-xs" style={{ color: colors.status.success }}>
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+8.3% from previous period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0" style={cardStyle}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-md font-medium" style={{ color: colors.text.primary }}>Average Order</CardTitle>
              <div className="p-1.5 rounded-full" style={{ backgroundColor: "rgba(124, 93, 250, 0.2)" }}>
                <Calculator className="h-4 w-4" style={{ color: colors.brand.purple }} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>{formatCurrency(averageOrderValue)}</div>
            <div className="flex items-center text-xs" style={{ color: colors.status.success }}>
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+5.2% from previous period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0" style={cardStyle}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-md font-medium" style={{ color: colors.text.primary }}>Reservations</CardTitle>
              <div className="p-1.5 rounded-full" style={{ backgroundColor: "rgba(14, 186, 177, 0.2)" }}>
                <Calendar className="h-4 w-4" style={{ color: colors.brand.turquoise }} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>{reservationData.upcomingReservations}</div>
            <div className="flex items-center text-xs" style={{ color: colors.text.secondary }}>
              <span>Upcoming bookings</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Sales Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0" style={cardStyle}>
          <CardHeader>
            <CardTitle style={{ color: colors.text.primary }}>Sales Trend</CardTitle>
            <CardDescription style={{ color: colors.text.secondary }}>Daily sales performance over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke={colors.text.secondary} />
                  <YAxis stroke={colors.text.secondary} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.background.secondary,
                      border: `1px solid rgba(255,255,255,0.1)`,
                      borderRadius: '8px',
                      color: colors.text.primary
                    }}
                  />
                  <Line type="monotone" dataKey="totalSales" stroke={colors.brand.purple} strokeWidth={2} dot={{ fill: colors.brand.purple }} />
                  <Line type="monotone" dataKey="orders" stroke={colors.brand.gold} strokeWidth={2} dot={{ fill: colors.brand.gold }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0" style={cardStyle}>
          <CardHeader>
            <CardTitle style={{ color: colors.text.primary }}>Peak Hours</CardTitle>
            <CardDescription style={{ color: colors.text.secondary }}>Order volume by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="hour" stroke={colors.text.secondary} />
                  <YAxis stroke={colors.text.secondary} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.background.secondary,
                      border: `1px solid rgba(255,255,255,0.1)`,
                      borderRadius: '8px',
                      color: colors.text.primary
                    }}
                  />
                  <Bar dataKey="orders" fill={colors.brand.turquoise} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Selling Items Table */}
      <Card className="border-0" style={cardStyle}>
        <CardHeader>
          <CardTitle style={{ color: colors.text.primary }}>Top Selling Items</CardTitle>
          <CardDescription style={{ color: colors.text.secondary }}>Best performing menu items this period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ color: colors.text.secondary }}>Item</TableHead>
                <TableHead style={{ color: colors.text.secondary }}>Category</TableHead>
                <TableHead className="text-right" style={{ color: colors.text.secondary }}>Qty Sold</TableHead>
                <TableHead className="text-right" style={{ color: colors.text.secondary }}>Revenue</TableHead>
                <TableHead className="text-right" style={{ color: colors.text.secondary }}>% of Sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSellingItems?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium" style={{ color: colors.text.primary }}>{item.name}</TableCell>
                  <TableCell style={{ color: colors.text.secondary }}>{item.category}</TableCell>
                  <TableCell className="text-right" style={{ color: colors.text.primary }}>{item.quantity}</TableCell>
                  <TableCell className="text-right" style={{ color: colors.text.primary }}>{formatCurrency(item.revenue)}</TableCell>
                  <TableCell className="text-right" style={{ color: colors.text.primary }}>{item.percentageOfSales}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPortalDashboard;
