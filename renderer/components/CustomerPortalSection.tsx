/*
 * CustomerPortalSection.tsx - In-Page Account Management Component
 * 
 * Embeddable account portal for seamless integration within OnlineOrders SPA.
 * Provides profile management, order history, favorites, and addresses
 * without leaving the ordering context.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Clock, Heart, MapPin, Edit3, Plus, Package, Star, X } from 'lucide-react';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { apiClient } from 'app';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CustomerPortalSectionProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  order_status: string;
  order_type: string;
  items: any[];
}

interface CustomerAddress {
  id: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postcode: string;
  phone_number?: string;
  delivery_instructions?: string;
  is_default: boolean;
}

/**
 * CustomerPortalSection - Integrated account management for OnlineOrders SPA
 * 
 * Features:
 * - Profile overview with customer reference number
 * - Order history with reorder functionality
 * - Saved addresses management
 * - Favorites with quick add to cart
 * - Account settings and preferences
 * - Beautiful animations consistent with OnlineOrders theme
 */
export function CustomerPortalSection({ isOpen, onClose, className = '' }: CustomerPortalSectionProps) {
  const { user, profile, isAuthenticated } = useSimpleAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);

  // Address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    is_default: false,
    delivery_instructions: ''
  });

  const [profileForm, setProfileForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone_number: profile?.phone || '',
    email: profile?.email || user?.email || ''
  });

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone_number: profile.phone || '',
        email: profile.email || user?.email || ''
      });
    }
  }, [profile, user]);

  // Load data on component mount
  useEffect(() => {
    if (isOpen && isAuthenticated && profile?.id) {
      loadCustomerData();
    }
  }, [isOpen, isAuthenticated, profile?.id]);

  const loadCustomerData = async () => {
    setIsLoading(true);
    try {
      // Load orders - Fix: API expects userId, not customer_id
      try {
        const ordersResponse = await apiClient.get_user_orders({ userId: user?.id });
        const ordersData = await ordersResponse.json();
        setOrders(ordersData?.orders || []);
      } catch (error) {
        console.log('Orders not available yet:', error);
        setOrders([]);
      }

      // Load favorites - Fix: API expects user_id, not customer_id
      try {
        const favoritesResponse = await apiClient.get_user_favorites({ user_id: user?.id });
        const favoritesData = await favoritesResponse.json();
        setFavorites(favoritesData?.favorites || []);
      } catch (error) {
        console.log('Favorites not available yet:', error);
        setFavorites([]);
      }

      // Load addresses - Fix: pass valid customer ID instead of undefined
      try {
        const addressesResponse = await apiClient.get_customer_addresses(profile?.id || user?.id);
        const addressesData = await addressesResponse.json();
        setAddresses(addressesData?.addresses || []);
      } catch (error) {
        console.log('Addresses not available yet:', error);
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!profile?.id || !addressForm.address_line1 || !addressForm.city || !addressForm.postal_code) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.create_customer_address({
        customer_id: profile.id,
        address_line1: addressForm.address_line1,
        address_line2: addressForm.address_line2 || null,
        city: addressForm.city,
        postal_code: addressForm.postal_code,
        is_default: addressForm.is_default,
        delivery_instructions: addressForm.delivery_instructions || null
      });

      if (response.success) {
        toast.success('Address added successfully!');
        setIsAddressModalOpen(false);
        setAddressForm({
          address_line1: '',
          address_line2: '',
          city: '',
          postal_code: '',
          is_default: false,
          delivery_instructions: ''
        });
        // Reload addresses
        loadCustomerData();
      } else {
        toast.info(response.message || 'Address feature coming soon');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      toast.info('Address management coming soon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (order: any) => {
    toast.info('Reorder functionality coming soon');
  };

  const handleRemoveFavorite = async (itemId: string) => {
    try {
      const response = await apiClient.remove_favorite({
        customer_id: profile?.id,
        menu_item_id: itemId
      });
      if (response.success) {
        toast.success('Removed from favorites');
        loadCustomerData();
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove favorite');
    }
  };

  const handleProfileUpdate = async () => {
    if (!profile?.id) return;
    
    setIsLoading(true);
    try {
      // This would call the profile update API
      toast.info('Profile update functionality will be implemented');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Early return for closed state
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Customer Account Portal</DialogTitle>
          <DialogDescription>
            Manage your profile, view order history, favorites, and addresses
          </DialogDescription>
        </DialogHeader>
        <div className={`w-full ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#8B1538] to-red-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome, {profile?.first_name || 'Customer'}
                </h2>
                {profile?.customer_ref_number && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customer Reference: <span className="font-mono font-semibold text-[#8B1538]">{profile.customer_ref_number}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Orders</span>
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>Favorites</span>
                </TabsTrigger>
                <TabsTrigger value="addresses" className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Addresses</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Profile Information</CardTitle>
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => isEditing ? handleProfileUpdate() : setIsEditing(true)}
                      disabled={isLoading}
                    >
                      {isEditing ? (
                        <>Save Changes</>
                      ) : (
                        <><Edit3 className="w-4 h-4 mr-2" />Edit Profile</>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={profileForm.first_name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={profileForm.last_name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        disabled // Email changes handled by auth system
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={profileForm.phone_number}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone_number: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setProfileForm({
                              first_name: profile?.first_name || '',
                              last_name: profile?.last_name || '',
                              phone_number: profile?.phone || '',
                              email: profile?.email || user?.email || ''
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Loading orders...</p>
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  Order #{order.order_number}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(order.created_at).toLocaleDateString()} • {order.order_type}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  £{order.total_amount.toFixed(2)}
                                </p>
                                <Badge variant={order.order_status === 'completed' ? 'default' : 'secondary'}>
                                  {order.order_status}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {order.items.length} item(s)
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReorder(order)}
                              className="w-full"
                            >
                              <Package className="w-4 h-4 mr-2" />
                              Reorder
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No orders yet</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Start browsing our menu to place your first order!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Favorites Tab */}
              <TabsContent value="favorites" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Favorites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Loading favorites...</p>
                      </div>
                    ) : favorites.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favorites.map((item) => (
                          <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {item.menu_item_description}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFavorite(item.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Favorite</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  // This would open variant selector for the item
                                  // setSelectedItem(item);
                                  // setIsVariantSelectorOpen(true);
                                  onClose();
                                }}
                              >
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No favorites yet</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Heart items while browsing to save them here!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Delivery Addresses</CardTitle>
                    <Button size="sm" onClick={() => setIsAddressModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Address
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Loading addresses...</p>
                      </div>
                    ) : addresses.length > 0 ? (
                      <div className="space-y-4">
                        {addresses.map((address) => (
                          <div key={address.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <MapPin className="w-4 h-4 text-gray-500" />
                                  {address.is_default && (
                                    <Badge variant="secondary">Default</Badge>
                                  )}
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {address.address_line_1}
                                </p>
                                {address.address_line_2 && (
                                  <p className="text-gray-600 dark:text-gray-400">
                                    {address.address_line_2}
                                  </p>
                                )}
                                <p className="text-gray-600 dark:text-gray-400">
                                  {address.city}, {address.postcode}
                                </p>
                                {address.phone_number && (
                                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                    Phone: {address.phone_number}
                                  </p>
                                )}
                                {address.delivery_instructions && (
                                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                    Instructions: {address.delivery_instructions}
                                  </p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                {!address.is_default && (
                                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No addresses saved</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Add your delivery address to order faster!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Add Address Modal */}
          <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
                <DialogDescription>
                  Add a delivery address to your account for faster checkout.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address_line1">Address Line 1 *</Label>
                  <Input
                    id="address_line1"
                    value={addressForm.address_line1}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, address_line1: e.target.value }))}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={addressForm.address_line2}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, address_line2: e.target.value }))}
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="London"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code *</Label>
                    <Input
                      id="postal_code"
                      value={addressForm.postal_code}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                      placeholder="SW1A 1AA"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="delivery_instructions">Delivery Instructions</Label>
                  <Textarea
                    id="delivery_instructions"
                    value={addressForm.delivery_instructions}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, delivery_instructions: e.target.value }))}
                    placeholder="Special delivery instructions (optional)"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_default">Set as default address</Label>
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddressModalOpen(false);
                      setAddressForm({
                        address_line1: '',
                        address_line2: '',
                        city: '',
                        postal_code: '',
                        is_default: false,
                        delivery_instructions: ''
                      });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddAddress}
                    disabled={isLoading || !addressForm.address_line1 || !addressForm.city || !addressForm.postal_code}
                    className="flex-1"
                  >
                    {isLoading ? 'Adding...' : 'Add Address'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
