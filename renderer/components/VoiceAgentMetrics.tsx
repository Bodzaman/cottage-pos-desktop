import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, BarChart2, Phone, RefreshCw, Headphones, UserCheck, Users, PoundSterling, Info, ArrowUpRight, ShoppingBag, Clock8, BookOpen, Server } from 'lucide-react';
import { apiClient } from 'app';
import { globalColors } from '../utils/QSAIDesign';

// Define types for our metrics data
interface CallMetrics {
  totalCalls: number;
  completedCalls: number;
  abandonedCalls: number;
  averageDuration: number;
  conversionRate: number;
}

interface OrderMetrics {
  totalOrders: number;
  avgOrderValue: number;
  completionRate: number;
  mostOrderedItems: Array<{name: string, count: number}>;
  ordersByType: Array<{type: string, count: number}>;
}

interface CallVolume {
  date: string;
  calls: number;
}

interface VoiceAgentMetricsProps {
  compact?: boolean;
}

export function VoiceAgentMetrics({ compact = false }: VoiceAgentMetricsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('7d'); // 24h, 7d, 30d, all
  const [activeTab, setActiveTab] = useState('overview');
  const [callMetrics, setCallMetrics] = useState<CallMetrics>({
    totalCalls: 0,
    completedCalls: 0,
    abandonedCalls: 0,
    averageDuration: 0,
    conversionRate: 0
  });
  const [orderMetrics, setOrderMetrics] = useState<OrderMetrics>({
    totalOrders: 0,
    avgOrderValue: 0,
    completionRate: 0,
    mostOrderedItems: [],
    ordersByType: []
  });
  const [callVolume, setCallVolume] = useState<CallVolume[]>([]);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Fetch metrics data
  useEffect(() => {
    fetchMetricsData();
  }, [dateRange]);

  const fetchMetricsData = async () => {
    setIsLoading(true);
    try {
      // Voice metrics are no longer available from the old voice_call_logs table
      // TODO: Implement new metrics based on Google Live Voice call data if needed
      
      setMetrics({
        totalCalls: 0,
        avgDuration: 0,
        successRate: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        peakHours: [],
        topOrderItems: []
      });
      
      setCallHistory([]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setIsLoading(false);
    }
  };

  // Format seconds to minutes:seconds
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (compact) {
    // Render a compact version for small spaces
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium">Voice Agent Metrics</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchMetricsData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gray-800/50">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">Total Calls</p>
                  <p className="text-xl font-bold">{callMetrics.totalCalls}</p>
                </div>
                <Phone className="h-8 w-8 text-indigo-400 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">Conversion Rate</p>
                  <p className="text-xl font-bold">{callMetrics.conversionRate}%</p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-green-400 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">Orders</p>
                  <p className="text-xl font-bold">{orderMetrics.totalOrders}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-purple-400 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">Avg. Value</p>
                  <p className="text-xl font-bold">£{orderMetrics.avgOrderValue.toFixed(2)}</p>
                </div>
                <PoundSterling className="h-8 w-8 text-emerald-400 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{
            background: `linear-gradient(to right, #FFFFFF, ${globalColors.purple.light})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Voice Agent Analytics
          </h2>
          <p className="text-gray-400">Metrics and insights for your AI voice ordering system</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onValueChange={setDateRange}
          >
            <SelectTrigger className="w-36">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetricsData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>
      
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Call Stats */}
        <Card className="bg-gray-800/50 border-indigo-900/50">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Calls</p>
                <p className="text-2xl font-bold">{callMetrics.totalCalls}</p>
              </div>
              <Phone className="h-10 w-10 text-indigo-400 opacity-70" />
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Completed</span>
                <span>{callMetrics.completedCalls} ({callMetrics.totalCalls > 0 ? Math.round((callMetrics.completedCalls / callMetrics.totalCalls) * 100) : 0}%)</span>
              </div>
              <Progress value={callMetrics.totalCalls > 0 ? (callMetrics.completedCalls / callMetrics.totalCalls) * 100 : 0} className="h-1 bg-gray-700" indicatorClassName="bg-indigo-500" />
            </div>
          </CardContent>
        </Card>
        
        {/* Conversion Rate */}
        <Card className="bg-gray-800/50 border-emerald-900/50">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Conversion Rate</p>
                <p className="text-2xl font-bold">{callMetrics.conversionRate}%</p>
              </div>
              <ArrowUpRight className="h-10 w-10 text-emerald-400 opacity-70" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Calls to Orders</span>
                <span className="text-emerald-400">{orderMetrics.totalOrders} / {callMetrics.totalCalls}</span>
              </div>
              <div className="relative h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-full" 
                  style={{ width: `${callMetrics.conversionRate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Order Value */}
        <Card className="bg-gray-800/50 border-purple-900/50">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. Order Value</p>
                <p className="text-2xl font-bold">£{orderMetrics.avgOrderValue.toFixed(2)}</p>
              </div>
              <PoundSterling className="h-10 w-10 text-purple-400 opacity-70" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Orders</span>
                <span>{orderMetrics.totalOrders}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Completion Rate</span>
                <span>{orderMetrics.completionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Call Duration */}
        <Card className="bg-gray-800/50 border-amber-900/50">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. Call Duration</p>
                <p className="text-2xl font-bold">{formatDuration(callMetrics.averageDuration)}</p>
              </div>
              <Clock className="h-10 w-10 text-amber-400 opacity-70" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Abandoned Calls</span>
                <span>{callMetrics.abandonedCalls} ({callMetrics.totalCalls > 0 ? Math.round((callMetrics.abandonedCalls / callMetrics.totalCalls) * 100) : 0}%)</span>
              </div>
              <div className="relative h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-amber-500 rounded-full" 
                  style={{ width: `${callMetrics.totalCalls > 0 ? (callMetrics.abandonedCalls / callMetrics.totalCalls) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed metrics */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>Calls</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Orders</span>
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>Diagnostics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Call Volume by Day</CardTitle>
              <CardDescription>Number of calls received per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callVolume}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#9CA3AF' }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={{ stroke: '#374151' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date);
                      }}
                    />
                    <YAxis 
                      tick={{ fill: '#9CA3AF' }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={{ stroke: '#374151' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                      itemStyle={{ color: '#F9FAFB' }}
                      formatter={(value) => [`${value} calls`, 'Volume']}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
                      }}
                    />
                    <Bar 
                      dataKey="calls" 
                      fill={globalColors.purple.primary} 
                      barSize={dateRange === '24h' ? 30 : dateRange === '7d' ? 20 : 10}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Order Type Distribution</CardTitle>
                <CardDescription>Breakdown of voice orders by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderMetrics.ordersByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        dataKey="count"
                        nameKey="type"
                        label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {orderMetrics.ordersByType.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? globalColors.purple.primary : globalColors.purple.light}
                            stroke="#1f2937"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        itemStyle={{ color: '#F9FAFB' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Most Ordered Items</CardTitle>
                <CardDescription>Top 5 menu items ordered through voice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      layout="vertical" 
                      data={orderMetrics.mostOrderedItems}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" />
                      <XAxis 
                        type="number" 
                        tick={{ fill: '#9CA3AF' }}
                        axisLine={{ stroke: '#374151' }}
                        tickLine={{ stroke: '#374151' }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fill: '#9CA3AF' }} 
                        width={120}
                        axisLine={{ stroke: '#374151' }}
                        tickLine={{ stroke: '#374151' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        itemStyle={{ color: '#F9FAFB' }}
                        formatter={(value) => [`${value} orders`, 'Count']}
                      />
                      <Bar 
                        dataKey="count" 
                        fill={globalColors.burgundy.primary}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
              <CardDescription>Latest voice interactions with the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-700">
                <div className="relative w-full overflow-auto max-h-[500px]">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-gray-800/80 sticky top-0">
                      <tr className="border-b border-gray-700">
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Call ID</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Date/Time</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Phone Number</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Duration</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Status</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {recentCalls.length > 0 ? (
                        recentCalls.map((call, index) => (
                          <tr 
                            key={call.call_id || index} 
                            className="border-b border-gray-700/50 hover:bg-gray-800/30"
                          >
                            <td className="p-3 align-middle text-sm">{call.call_id?.substring(0, 8) || '-'}</td>
                            <td className="p-3 align-middle text-sm">{formatDate(call.created_at)}</td>
                            <td className="p-3 align-middle text-sm">{call.caller_number || '-'}</td>
                            <td className="p-3 align-middle text-sm">{call.call_duration ? formatDuration(call.call_duration) : '-'}</td>
                            <td className="p-3 align-middle">
                              <Badge 
                                variant={call.call_status === 'completed' ? 'success' : 
                                         call.call_status === 'abandoned' ? 'destructive' : 'secondary'}
                                className="capitalize"
                              >
                                {call.call_status || 'unknown'}
                              </Badge>
                            </td>
                            <td className="p-3 align-middle">
                              {call.order_id ? (
                                <Badge variant="outline" className="text-purple-300 border-purple-500 bg-purple-950/30">
                                  Order Placed
                                </Badge>
                              ) : (
                                <span className="text-gray-500 text-xs">No order</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-500">
                            No call data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Voice-Generated Orders</CardTitle>
              <CardDescription>Orders created through the voice agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-700">
                <div className="relative w-full overflow-auto max-h-[500px]">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-gray-800/80 sticky top-0">
                      <tr className="border-b border-gray-700">
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Order ID</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Date/Time</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Customer</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Type</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Amount</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {recentOrders.length > 0 ? (
                        recentOrders.map((order, index) => (
                          <tr 
                            key={order.order_id || index} 
                            className="border-b border-gray-700/50 hover:bg-gray-800/30"
                          >
                            <td className="p-3 align-middle text-sm">{order.order_reference || order.order_id?.substring(0, 8) || '-'}</td>
                            <td className="p-3 align-middle text-sm">{formatDate(order.created_at)}</td>
                            <td className="p-3 align-middle text-sm">{order.customer_name || '-'}</td>
                            <td className="p-3 align-middle">
                              <Badge variant="outline" className="capitalize">
                                {order.order_type || 'unknown'}
                              </Badge>
                            </td>
                            <td className="p-3 align-middle text-sm">£{parseFloat(order.total_amount || 0).toFixed(2)}</td>
                            <td className="p-3 align-middle">
                              <Badge 
                                variant={
                                  order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'success' : 
                                  order.status === 'CANCELLED' ? 'destructive' : 
                                  'secondary'
                                }
                                className="capitalize"
                              >
                                {order.status || 'pending'}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-500">
                            No order data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Menu Corpus Status</CardTitle>
                <CardDescription>AI voice agent's menu knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-md">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-indigo-400" />
                      <div>
                        <p className="font-medium">Menu Corpus</p>
                        <p className="text-sm text-gray-400">Last synchronized 2 days ago</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Sync Now
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-gray-800 rounded-md">
                    <p className="font-medium mb-2">Corpus Health</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Items indexed</span>
                        <span>48 items</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Categories covered</span>
                        <span>8 categories</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Descriptions</span>
                        <span>94% complete</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Testing Tools</CardTitle>
                <CardDescription>Diagnostic tools for voice agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-800 rounded-md">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Headphones className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="font-medium">Test Voice Call</p>
                          <p className="text-sm text-gray-400">Generate a test voice call</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Run Test
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800 rounded-md">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="font-medium">Verify API Status</p>
                          <p className="text-sm text-gray-400">Check Ultravox API connection</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Verify
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800 rounded-md">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-emerald-400" />
                        <div>
                          <p className="font-medium">Call Simulator</p>
                          <p className="text-sm text-gray-400">Simulate specific call scenarios</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Open
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Agent Transcript Viewer</CardTitle>
              <CardDescription>View and search agent conversation transcripts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input placeholder="Search transcripts" className="max-w-sm" />
                  <Button variant="secondary">Search</Button>
                </div>
                
                <div className="p-4 bg-gray-800 rounded-md text-center">
                  <p className="text-gray-400">Select a call to view its transcript</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
