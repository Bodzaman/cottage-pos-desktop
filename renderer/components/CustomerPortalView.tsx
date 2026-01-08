
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShoppingBag,
  Heart,
  Edit3,
  Trash2,
  Plus,
  Check,
  X
} from 'lucide-react';

// Store Integration
import { useSimpleAuth } from '../utils/simple-auth-context';

// Theme
import { PremiumTheme } from '../utils/premiumTheme';
import { cn } from '../utils/cn';

interface CustomerPortalViewProps {
  onNavigateToMenu: () => void;
  className?: string;
}

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  postcode: string;
  isDefault: boolean;
}

interface OrderHistory {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  type: 'delivery' | 'collection';
}

/**
 * CustomerPortalView - Customer account management interface
 * 
 * Integrates with existing useSimpleAuth store
 * Provides account management, order history, favorites, addresses
 * Matches OnlineOrders premium styling
 */
export function CustomerPortalView({ onNavigateToMenu, className }: CustomerPortalViewProps) {
  // Auth integration
  const { user, isAuthenticated, signOut, updateProfile } = useSimpleAuth();
  
  // State
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile editing state
  const [profileData, setProfileData] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    phone: user?.user_metadata?.phone || '',
    email: user?.email || ''
  });
  
  // Addresses state (mock data for now - would integrate with Supabase)
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Home',
      street: '123 Main Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      isDefault: true
    }
  ]);
  
  // Order history state (mock data for now - would integrate with Supabase)
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([
    {
      id: '1',
      orderNumber: 'CT-2024-001',
      date: '2024-08-28T19:30:00Z',
      status: 'delivered',
      items: [
        { name: 'Chicken Tikka Masala', quantity: 1, price: 14.95 },
        { name: 'Pilau Rice', quantity: 2, price: 3.50 }
      ],
      total: 21.95,
      type: 'delivery'
    }
  ]);
  
  // Favorites state (would integrate with existing favorites system)
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        phone: user.user_metadata?.phone || '',
        email: user.email || ''
      });
    }
  }, [user]);
  
  // Handle profile save
  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    try {
      await updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone
      });
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('❌ CustomerPortalView: Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      onNavigateToMenu();
    } catch (error) {
      console.error('❌ CustomerPortalView: Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };
  
  // Get status badge color
  const getStatusBadgeVariant = (status: OrderHistory['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'preparing': return 'default';
      case 'ready': return 'default';
      case 'delivered': case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };
  
  if (!isAuthenticated || !user) {
    return (
      <div 
        className="flex-1 flex items-center justify-center"
        style={{ background: PremiumTheme.colors.background.primary }}
      >
        <Card className="p-8 text-center border-gray-800" style={{ background: PremiumTheme.colors.background.secondary }}>
          <p className="text-gray-400 mb-4">Please sign in to access your account</p>
          <Button onClick={onNavigateToMenu} variant="outline" className="border-silver-500 text-silver-500">
            Back to Menu
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div 
      className={cn("flex-1 overflow-hidden", className)}
      style={{ background: PremiumTheme.colors.background.primary }}
    >
      {/* Header */}
      <div 
        className="border-b border-gray-800 px-6 py-8"
        style={{ background: PremiumTheme.colors.background.secondary }}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-burgundy-500 to-burgundy-700 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-serif">
                  Welcome, {profileData.firstName || 'Customer'}
                </h1>
                <p className="text-gray-400">
                  Manage your account and view order history
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={onNavigateToMenu}
                variant="outline"
                className="border-silver-500 text-silver-500 hover:bg-silver-500 hover:text-black"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
              
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-6 py-8 h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            {/* Tab Navigation */}
            <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto mb-8 bg-gray-800">
              <TabsTrigger value="profile" className="data-[state=active]:bg-burgundy-500">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-burgundy-500">
                <Clock className="w-4 h-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="addresses" className="data-[state=active]:bg-burgundy-500">
                <MapPin className="w-4 h-4 mr-2" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="favorites" className="data-[state=active]:bg-burgundy-500">
                <Heart className="w-4 h-4 mr-2" />
                Favorites
              </TabsTrigger>
            </TabsList>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {/* Profile Tab */}
              <TabsContent value="profile" className="h-full">
                <Card 
                  className="max-w-2xl mx-auto border-gray-800"
                  style={{ background: PremiumTheme.colors.background.secondary }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white font-serif">Profile Information</CardTitle>
                      {!isEditing ? (
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          size="sm"
                          className="border-silver-500 text-silver-500 hover:bg-silver-500 hover:text-black"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleSaveProfile}
                            size="sm"
                            disabled={isSaving}
                            className="bg-burgundy-500 hover:bg-burgundy-600"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            onClick={() => {
                              setIsEditing(false);
                              // Reset form data
                              setProfileData({
                                firstName: user?.user_metadata?.first_name || '',
                                lastName: user?.user_metadata?.last_name || '',
                                phone: user?.user_metadata?.phone || '',
                                email: user?.email || ''
                              });
                            }}
                            variant="ghost"
                            size="sm"
                            disabled={isSaving}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">First Name</Label>
                        {isEditing ? (
                          <Input
                            value={profileData.firstName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                            className="bg-gray-800 border-gray-700 text-white"
                            disabled={isSaving}
                          />
                        ) : (
                          <p className="text-white bg-gray-800 px-3 py-2 rounded border border-gray-700">
                            {profileData.firstName || 'Not set'}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Last Name</Label>
                        {isEditing ? (
                          <Input
                            value={profileData.lastName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                            className="bg-gray-800 border-gray-700 text-white"
                            disabled={isSaving}
                          />
                        ) : (
                          <p className="text-white bg-gray-800 px-3 py-2 rounded border border-gray-700">
                            {profileData.lastName || 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-300">Email Address</Label>
                      <p className="text-white bg-gray-800 px-3 py-2 rounded border border-gray-700 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {profileData.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Contact support to change your email address
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-300">Phone Number</Label>
                      {isEditing ? (
                        <Input
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          className="bg-gray-800 border-gray-700 text-white"
                          disabled={isSaving}
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <p className="text-white bg-gray-800 px-3 py-2 rounded border border-gray-700 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {profileData.phone || 'Not set'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Orders Tab */}
              <TabsContent value="orders" className="h-full">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-xl font-bold text-white font-serif mb-6">Order History</h2>
                  
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {orderHistory.map((order) => (
                        <Card 
                          key={order.id}
                          className="border-gray-800"
                          style={{ background: PremiumTheme.colors.background.secondary }}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-white">
                                  Order #{order.orderNumber}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  {new Date(order.date).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <Badge 
                                  variant={getStatusBadgeVariant(order.status)}
                                  className="capitalize"
                                >
                                  {order.status}
                                </Badge>
                                <Badge variant="outline" className="border-gray-600 text-gray-300">
                                  {order.type}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-300">
                                    {item.quantity}x {item.name}
                                  </span>
                                  <span className="text-white">
                                    £{item.price.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            <Separator className="bg-gray-700 mb-4" />
                            
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-white">
                                Total: £{order.total.toFixed(2)}
                              </span>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Reorder functionality - would integrate with cart
                                  toast.info('Reorder functionality coming soon');
                                }}
                                className="border-silver-500 text-silver-500 hover:bg-silver-500 hover:text-black"
                              >
                                Reorder
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
              
              {/* Addresses Tab */}
              <TabsContent value="addresses" className="h-full">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white font-serif">Delivery Addresses</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-silver-500 text-silver-500 hover:bg-silver-500 hover:text-black"
                      onClick={() => {
                        toast.info('Add address functionality coming soon');
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Address
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <Card 
                        key={address.id}
                        className="border-gray-800"
                        style={{ background: PremiumTheme.colors.background.secondary }}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-white">{address.label}</h3>
                                {address.isDefault && (
                                  <Badge className="bg-burgundy-500">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <div className="text-gray-400 space-y-1">
                                <p>{address.street}</p>
                                <p>{address.city}</p>
                                <p>{address.postcode}</p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                                onClick={() => {
                                  toast.info('Edit address functionality coming soon');
                                }}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300"
                                onClick={() => {
                                  toast.info('Delete address functionality coming soon');
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              {/* Favorites Tab */}
              <TabsContent value="favorites" className="h-full">
                <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-xl font-bold text-white font-serif mb-6">Favorite Items</h2>
                  
                  <div className="py-12">
                    <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      No favorites yet
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Start building your collection of favorite dishes
                    </p>
                    <Button
                      onClick={onNavigateToMenu}
                      className="bg-burgundy-500 hover:bg-burgundy-600"
                    >
                      Browse Menu
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
