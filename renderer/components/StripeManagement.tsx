import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, CreditCard, Users, Package, Percent, BarChart3, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';

interface StripeHealthData {
  status: string;
  environment: string;
  account_id?: string;
  business_name?: string;
  country?: string;
  default_currency?: string;
  charges_enabled?: boolean;
  details_submitted?: boolean;
}

interface StripeResponse {
  success: boolean;
  data?: any;
  error?: string;
  environment?: string;
}

export function StripeManagement() {
  const [healthData, setHealthData] = useState<StripeHealthData | null>(null);
  const [isTestMode, setIsTestMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);

  // Product creation form
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: ''
  });

  // Customer creation form
  const [customerForm, setCustomerForm] = useState({
    email: '',
    name: '',
    phone: ''
  });

  // Coupon creation form
  const [couponForm, setCouponForm] = useState({
    name: '',
    percentOff: '',
    amountOff: '',
    duration: 'once'
  });

  // Payment test form
  const [paymentAmount, setPaymentAmount] = useState('25.00');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const response = await apiClient.check_stripe_health();
      const result: StripeResponse = await response.json();
      
      if (result.success && result.data) {
        setHealthData(result.data);
        setIsTestMode(result.environment === 'test');
        toast.success(`Stripe connected - ${result.environment} mode`);
      } else {
        toast.error(result.error || 'Failed to connect to Stripe');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Health check failed');
    } finally {
      setLoading(false);
    }
  };

  const switchEnvironment = async () => {
    try {
      setLoading(true);
      const newEnv = isTestMode ? 'live' : 'test';
      
      const response = await apiClient.switch_environment({ environment: newEnv });
      const result: StripeResponse = await response.json();
      
      if (result.success) {
        setIsTestMode(newEnv === 'test');
        setHealthData(result.data?.health_check || null);
        toast.success(`Switched to ${newEnv} mode`);
        
        // Refresh data after environment switch
        loadAllData();
      } else {
        toast.error(result.error || 'Failed to switch environment');
      }
    } catch (error) {
      console.error('Environment switch failed:', error);
      toast.error('Failed to switch environment');
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    await Promise.all([
      loadProducts(),
      loadCharges(),
      loadBalance()
    ]);
  };

  const loadProducts = async () => {
    try {
      const response = await apiClient.list_products({ limit: 20 });
      const result: StripeResponse = await response.json();
      
      if (result.success && result.data) {
        setProducts(result.data.products || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadCharges = async () => {
    try {
      const response = await apiClient.list_charges({ limit: 10 });
      const result: StripeResponse = await response.json();
      
      if (result.success && result.data) {
        setCharges(result.data.charges || []);
      }
    } catch (error) {
      console.error('Failed to load charges:', error);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await apiClient.get_balance();
      const result: StripeResponse = await response.json();
      
      if (result.success && result.data) {
        setBalance(result.data);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const createProduct = async () => {
    try {
      if (!productForm.name || !productForm.price) {
        toast.error('Name and price are required');
        return;
      }

      setLoading(true);
      
      // Create product
      const productResponse = await apiClient.create_product({
        name: productForm.name,
        description: productForm.description || undefined
      });
      const productResult: StripeResponse = await productResponse.json();
      
      if (!productResult.success) {
        throw new Error(productResult.error);
      }
      
      // Create price
      const priceResponse = await apiClient.create_price({
        product_id: productResult.data.id,
        unit_amount: Math.round(parseFloat(productForm.price) * 100), // Convert to pence
        currency: 'gbp'
      });
      const priceResult: StripeResponse = await priceResponse.json();
      
      if (priceResult.success) {
        toast.success(`Product created: ${productForm.name}`);
        setProductForm({ name: '', description: '', price: '' });
        loadProducts();
      } else {
        throw new Error(priceResult.error);
      }
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    try {
      if (!customerForm.email) {
        toast.error('Email is required');
        return;
      }

      setLoading(true);
      const response = await apiClient.create_customer(customerForm);
      const result: StripeResponse = await response.json();
      
      if (result.success) {
        toast.success(`Customer created: ${customerForm.email}`);
        setCustomerForm({ email: '', name: '', phone: '' });
      } else {
        toast.error(result.error || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast.error('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async () => {
    try {
      if (!couponForm.name || (!couponForm.percentOff && !couponForm.amountOff)) {
        toast.error('Name and discount amount are required');
        return;
      }

      setLoading(true);
      const response = await apiClient.create_coupon({
        name: couponForm.name,
        percent_off: couponForm.percentOff ? parseInt(couponForm.percentOff) : undefined,
        amount_off: couponForm.amountOff ? Math.round(parseFloat(couponForm.amountOff) * 100) : undefined,
        currency: 'gbp',
        duration: couponForm.duration
      });
      const result: StripeResponse = await response.json();
      
      if (result.success) {
        toast.success(`Coupon created: ${couponForm.name}`);
        setCouponForm({ name: '', percentOff: '', amountOff: '', duration: 'once' });
      } else {
        toast.error(result.error || 'Failed to create coupon');
      }
    } catch (error) {
      console.error('Failed to create coupon:', error);
      toast.error('Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  const createTestPayment = async () => {
    try {
      if (!isTestMode) {
        toast.error('Test payments only available in sandbox mode');
        return;
      }

      setLoading(true);
      const response = await apiClient.create_sample_payment({
        amount: Math.round(parseFloat(paymentAmount) * 100)
      });
      const result: StripeResponse = await response.json();
      
      if (result.success) {
        toast.success(`Test payment created: £${paymentAmount}`);
        loadCharges();
      } else {
        toast.error(result.error || 'Failed to create test payment');
      }
    } catch (error) {
      console.error('Failed to create test payment:', error);
      toast.error('Failed to create test payment');
    } finally {
      setLoading(false);
    }
  };

  const createSampleProduct = async () => {
    try {
      if (!isTestMode) {
        toast.error('Sample data only available in sandbox mode');
        return;
      }

      setLoading(true);
      const response = await apiClient.create_sample_product();
      const result: StripeResponse = await response.json();
      
      if (result.success) {
        toast.success('Sample product created');
        loadProducts();
      } else {
        toast.error(result.error || 'Failed to create sample product');
      }
    } catch (error) {
      console.error('Failed to create sample product:', error);
      toast.error('Failed to create sample product');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header & Environment Control */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stripe Management</h2>
          <p className="text-muted-foreground">Complete programmatic control over payments and financial operations</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="environment-toggle">Environment:</Label>
            <Badge variant={isTestMode ? "secondary" : "destructive"}>
              {isTestMode ? "Sandbox" : "Live"}
            </Badge>
            <Switch
              id="environment-toggle"
              checked={!isTestMode}
              onCheckedChange={switchEnvironment}
              disabled={loading}
            />
          </div>
          
          <Button onClick={checkHealth} disabled={loading}>
            {loading ? "Checking..." : "Health Check"}
          </Button>
        </div>
      </div>

      {/* Health Status */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {healthData.status === 'connected' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Stripe Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Account ID</Label>
                <p className="font-mono text-sm">{healthData.account_id}</p>
              </div>
              <div>
                <Label>Business Name</Label>
                <p className="text-sm">{healthData.business_name || 'N/A'}</p>
              </div>
              <div>
                <Label>Country</Label>
                <p className="text-sm">{healthData.country}</p>
              </div>
              <div>
                <Label>Currency</Label>
                <p className="text-sm">{healthData.default_currency?.toUpperCase()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Management Interface */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Products</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Customers</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Payments</span>
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex items-center space-x-2">
            <Percent className="h-4 w-4" />
            <span>Coupons</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Product</CardTitle>
              <CardDescription>Add new menu items to your Stripe catalog</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Chicken Tikka Masala"
                  />
                </div>
                <div>
                  <Label htmlFor="product-price">Price (£)</Label>
                  <Input
                    id="product-price"
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="12.50"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={createProduct} disabled={loading} className="w-full">
                    Create Product
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Product description..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Products ({products.length})</CardTitle>
              <div className="flex space-x-2">
                <Button onClick={loadProducts} variant="outline" size="sm">
                  Refresh
                </Button>
                {isTestMode && (
                  <Button onClick={createSampleProduct} variant="outline" size="sm">
                    <TestTube className="h-4 w-4 mr-2" />
                    Create Sample
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {products.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                    <Badge variant="outline">{product.id}</Badge>
                  </div>
                ))}
                {products.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No products found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Customer</CardTitle>
              <CardDescription>Add new customers to your Stripe database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-name">Name</Label>
                  <Input
                    id="customer-name"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone</Label>
                  <Input
                    id="customer-phone"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+44 7123 456789"
                  />
                </div>
              </div>
              <Button onClick={createCustomer} disabled={loading}>
                Create Customer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          {isTestMode && (
            <Card>
              <CardHeader>
                <CardTitle>Test Payment</CardTitle>
                <CardDescription>Create test payments in sandbox mode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="payment-amount">Amount (£)</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="25.00"
                    />
                  </div>
                  <Button onClick={createTestPayment} disabled={loading}>
                    <TestTube className="h-4 w-4 mr-2" />
                    Create Test Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Charges ({charges.length})</CardTitle>
              <Button onClick={loadCharges} variant="outline" size="sm">
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {charges.map((charge: any) => (
                  <div key={charge.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{formatCurrency(charge.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(charge.created * 1000).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={charge.paid ? "default" : "secondary"}>
                      {charge.paid ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                ))}
                {charges.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No charges found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Coupon</CardTitle>
              <CardDescription>Create discount coupons and promotional codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="coupon-name">Coupon Name</Label>
                  <Input
                    id="coupon-name"
                    value={couponForm.name}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="WELCOME10"
                  />
                </div>
                <div>
                  <Label htmlFor="coupon-duration">Duration</Label>
                  <select
                    id="coupon-duration"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    value={couponForm.duration}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, duration: e.target.value }))}
                  >
                    <option value="once">Once</option>
                    <option value="forever">Forever</option>
                    <option value="repeating">Repeating</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="coupon-percent">Percent Off (%)</Label>
                  <Input
                    id="coupon-percent"
                    type="number"
                    value={couponForm.percentOff}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, percentOff: e.target.value, amountOff: '' }))}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="coupon-amount">Amount Off (£)</Label>
                  <Input
                    id="coupon-amount"
                    type="number"
                    step="0.01"
                    value={couponForm.amountOff}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, amountOff: e.target.value, percentOff: '' }))}
                    placeholder="5.00"
                  />
                </div>
              </div>
              <Button onClick={createCoupon} disabled={loading}>
                Create Coupon
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Balance</CardTitle>
              <Button onClick={loadBalance} variant="outline" size="sm">
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {balance ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {balance.available?.map((bal: any, index: number) => (
                    <div key={index} className="p-4 border rounded">
                      <p className="text-sm text-muted-foreground">Available</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(bal.amount)} {bal.currency.toUpperCase()}
                      </p>
                    </div>
                  ))}
                  {balance.pending?.map((bal: any, index: number) => (
                    <div key={index} className="p-4 border rounded">
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(bal.amount)} {bal.currency.toUpperCase()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No balance data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
