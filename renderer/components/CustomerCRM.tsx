import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  ShoppingBag,
  Heart,
  Clock,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { colors, cardStyle } from '../utils/designSystem';
import { styles, globalColors } from '../utils/QSAIDesign';

// Types for customer data
interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  last_order_at: string | null;
  total_orders: number;
  total_spent: number;
  registered_via: string;
  customer_type: 'new' | 'returning' | 'vip';
  marketing_preferences: any;
  auth_id: string | null;
}

interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  vipCustomers: number;
  averageOrderValue: number;
  totalRevenue: number;
  growthRate: number;
}

const CustomerCRM: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    vipCustomers: 0,
    averageOrderValue: 0,
    totalRevenue: 0,
    growthRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'new' | 'returning' | 'vip'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Load customer data
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockCustomers: Customer[] = [
        {
          id: '1',
          full_name: 'John Smith',
          email: 'john@example.com',
          phone: '+44 7700 900123',
          address: '123 Main St, London SW1A 1AA',
          created_at: '2024-01-15T10:30:00Z',
          last_order_at: '2024-06-15T18:45:00Z',
          total_orders: 12,
          total_spent: 485.50,
          registered_via: 'website',
          customer_type: 'returning',
          marketing_preferences: { email: true, sms: false },
          auth_id: 'auth_123'
        },
        {
          id: '2',
          full_name: 'Sarah Johnson',
          email: 'sarah@example.com',
          phone: '+44 7700 900124',
          address: '456 Oak Ave, Manchester M1 1AA',
          created_at: '2024-06-10T14:20:00Z',
          last_order_at: '2024-06-16T19:30:00Z',
          total_orders: 3,
          total_spent: 89.75,
          registered_via: 'phone',
          customer_type: 'new',
          marketing_preferences: { email: true, sms: true },
          auth_id: null
        },
        {
          id: '3',
          full_name: 'David Thompson',
          email: 'david@example.com',
          phone: '+44 7700 900125',
          address: '789 Pine Rd, Birmingham B1 1AA',
          created_at: '2023-08-20T09:15:00Z',
          last_order_at: '2024-06-17T20:15:00Z',
          total_orders: 47,
          total_spent: 1247.25,
          registered_via: 'website',
          customer_type: 'vip',
          marketing_preferences: { email: true, sms: true },
          auth_id: 'auth_456'
        }
      ];

      setCustomers(mockCustomers);
      
      // Calculate stats
      const totalCustomers = mockCustomers.length;
      const newCustomers = mockCustomers.filter(c => c.customer_type === 'new').length;
      const returningCustomers = mockCustomers.filter(c => c.customer_type === 'returning').length;
      const vipCustomers = mockCustomers.filter(c => c.customer_type === 'vip').length;
      const totalRevenue = mockCustomers.reduce((sum, c) => sum + c.total_spent, 0);
      const totalOrders = mockCustomers.reduce((sum, c) => sum + c.total_orders, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      setStats({
        totalCustomers,
        newCustomers,
        returningCustomers,
        vipCustomers,
        averageOrderValue,
        totalRevenue,
        growthRate: 15.2 // Mock growth rate
      });
      
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  // Filter customers based on search and filter
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.phone && customer.phone.includes(searchTerm));
    
    const matchesFilter = filterType === 'all' || customer.customer_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get customer type badge color
  const getCustomerTypeBadge = (type: string) => {
    switch (type) {
      case 'vip':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">VIP</Badge>;
      case 'returning':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Returning</Badge>;
      case 'new':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">New</Badge>;
      default:
        return <Badge variant="outline">Customer</Badge>;
    }
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
      {/* Customer Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={cardStyle}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.text.secondary }}>Total Customers</p>
                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{stats.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8" style={{ color: colors.brand.purple }} />
            </div>
          </CardContent>
        </Card>

        <Card style={cardStyle}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.text.secondary }}>Total Revenue</p>
                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>£{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8" style={{ color: colors.brand.gold }} />
            </div>
          </CardContent>
        </Card>

        <Card style={cardStyle}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.text.secondary }}>Avg. Order Value</p>
                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>£{stats.averageOrderValue.toFixed(2)}</p>
              </div>
              <ShoppingBag className="h-8 w-8" style={{ color: colors.brand.turquoise }} />
            </div>
          </CardContent>
        </Card>

        <Card style={cardStyle}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.text.secondary }}>Growth Rate</p>
                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>+{stats.growthRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8" style={{ color: colors.brand.purple }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Management */}
      <Card style={cardStyle}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl" style={styles.purpleGradientText}>Customer Management</CardTitle>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: colors.text.secondary }} />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                All ({stats.totalCustomers})
              </Button>
              <Button
                variant={filterType === 'new' ? 'default' : 'outline'}
                onClick={() => setFilterType('new')}
                className={filterType === 'new' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                New ({stats.newCustomers})
              </Button>
              <Button
                variant={filterType === 'returning' ? 'default' : 'outline'}
                onClick={() => setFilterType('returning')}
                className={filterType === 'returning' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                Returning ({stats.returningCustomers})
              </Button>
              <Button
                variant={filterType === 'vip' ? 'default' : 'outline'}
                onClick={() => setFilterType('vip')}
                className={filterType === 'vip' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                VIP ({stats.vipCustomers})
              </Button>
            </div>
          </div>

          {/* Customer List */}
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-4 rounded-lg border transition-all hover:border-purple-500/30"
                style={{
                  backgroundColor: colors.background.tertiary,
                  borderColor: colors.border.light
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold" style={{ color: colors.text.primary }}>
                          {customer.full_name}
                        </h3>
                        {getCustomerTypeBadge(customer.customer_type)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" style={{ color: colors.text.secondary }}>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {customer.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Joined {formatDate(customer.created_at)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm" style={{ color: colors.text.secondary }}>
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          {customer.total_orders} orders
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          £{customer.total_spent.toFixed(2)} spent
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Last order: {formatDate(customer.last_order_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.secondary }} />
              <p style={{ color: colors.text.secondary }}>No customers found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerCRM;