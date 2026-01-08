import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Home, Check, MapPin, AlertCircle } from 'lucide-react';
// DeliveryAddress interface for local use
interface DeliveryAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  instructions?: string;
  isDefault: boolean;
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  selectedAddressId?: string;
  customAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    instructions?: string;
  };
  savedAddresses: DeliveryAddress[];
  onSelectAddress: (addressId: string) => void;
  onUpdateCustomAddress: (address: any) => void;
  isLoggedIn: boolean;
}

export function AddressSelection({ 
  selectedAddressId, 
  customAddress, 
  savedAddresses, 
  onSelectAddress, 
  onUpdateCustomAddress,
  isLoggedIn
}: Props) {
  const [activeTab, setActiveTab] = useState<string>(savedAddresses.length > 0 && isLoggedIn ? 'saved' : 'new');
  const [tempAddress, setTempAddress] = useState(customAddress || {
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    instructions: ''
  });
  
  // Update parent component when temp address changes
  useEffect(() => {
    if (activeTab === 'new') {
      onUpdateCustomAddress(tempAddress);
    }
  }, [tempAddress, activeTab, onUpdateCustomAddress]);
  
  // Handle input change for new address
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTempAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // When tab changes, update selection type
  useEffect(() => {
    if (activeTab === 'saved' && savedAddresses.length > 0) {
      // Select first address by default if none selected
      if (!selectedAddressId) {
        const defaultAddress = savedAddresses.find(addr => addr.is_default) || savedAddresses[0];
        onSelectAddress(defaultAddress.id);
      }
    } else if (activeTab === 'new') {
      // Clear selected address ID when switching to new address
      if (selectedAddressId) {
        onSelectAddress('');
      }
    }
  }, [activeTab, savedAddresses, selectedAddressId, onSelectAddress]);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-medium text-tandoor-platinum">Delivery Address</h2>
      
      <Alert className="bg-gray-800/40 border-tandoor-orange/30 mb-4">
        <MapPin className="h-4 w-4 text-tandoor-orange" />
        <AlertDescription className="text-sm text-tandoor-offwhite">
          We deliver to most locations within 5 miles of our restaurant.
        </AlertDescription>
      </Alert>
      
      {isLoggedIn && savedAddresses.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="saved">Saved Addresses</TabsTrigger>
            <TabsTrigger value="new">New Address</TabsTrigger>
          </TabsList>
          
          <TabsContent value="saved" className="space-y-4">
            <RadioGroup 
              value={selectedAddressId} 
              onValueChange={onSelectAddress}
              className="space-y-4"
            >
              {savedAddresses.map((address) => (
                <div key={address.id} className="relative">
                  <RadioGroupItem 
                    value={address.id} 
                    id={`address-${address.id}`} 
                    className="sr-only"
                  />
                  <Label 
                    htmlFor={`address-${address.id}`}
                    className={`flex items-start p-4 rounded-lg border-2 cursor-pointer
                      ${selectedAddressId === address.id 
                        ? 'bg-gray-800/80 border-tandoor-orange text-tandoor-platinum' 
                        : 'bg-gray-800/40 border-tandoor-platinum/20 text-tandoor-offwhite hover:bg-gray-800/60 hover:border-tandoor-platinum/40'}`}
                  >
                    <div className="mr-3 mt-0.5">
                      <Home className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{address.address_line1}</p>
                      {address.address_line2 && <p>{address.address_line2}</p>}
                      <p>{address.city}, {address.postal_code}</p>
                    </div>
                    {address.is_default && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-tandoor-orange/20 text-tandoor-orange">
                        Default
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </TabsContent>
          
          <TabsContent value="new">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1" className="text-tandoor-platinum">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    value={tempAddress.addressLine1 || ''}
                    onChange={handleInputChange}
                    placeholder="House number and street"
                    className="bg-gray-800/50 border-tandoor-platinum/30 text-tandoor-platinum"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="addressLine2" className="text-tandoor-platinum">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    name="addressLine2"
                    value={tempAddress.addressLine2 || ''}
                    onChange={handleInputChange}
                    placeholder="Apartment, suite, unit, etc. (optional)"
                    className="bg-gray-800/50 border-tandoor-platinum/30 text-tandoor-platinum"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-tandoor-platinum">City/Town *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={tempAddress.city || ''}
                    onChange={handleInputChange}
                    placeholder="City or town"
                    className="bg-gray-800/50 border-tandoor-platinum/30 text-tandoor-platinum"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postcode" className="text-tandoor-platinum">Postcode *</Label>
                  <Input
                    id="postcode"
                    name="postcode"
                    value={tempAddress.postcode || ''}
                    onChange={handleInputChange}
                    placeholder="Postcode"
                    className="bg-gray-800/50 border-tandoor-platinum/30 text-tandoor-platinum"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions" className="text-tandoor-platinum">Delivery Instructions</Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  value={tempAddress.instructions || ''}
                  onChange={handleInputChange}
                  placeholder="Add any special instructions for delivery (optional)"
                  className="bg-gray-800/50 border-tandoor-platinum/30 text-tandoor-platinum min-h-[100px]"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // For non-logged in users or users without saved addresses, show only the new address form
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1" className="text-tandoor-platinum">Address Line 1 *</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                value={tempAddress.addressLine1 || ''}
                onChange={handleInputChange}
                placeholder="House number and street"
                className="bg-gray-800/50 border-tandoor-platinum/30 text-tandoor-platinum"
                required
              />
              {!tempAddress.addressLine1 && (
                <p className="text-xs text-red-400 mt-1">Address line 1 is required</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="addressLine2" className="text-tandoor-platinum">Address Line 2</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                value={tempAddress.addressLine2 || ''}
                onChange={handleInputChange}
                placeholder="Apartment, suite, unit, etc. (optional)"
                className="bg-gray-800/50 border-tandoor-platinum/30 text-tandoor-platinum"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-tandoor-platinum">City/Town *</Label>
              <Input
                id="city"
                name="city"
                value={tempAddress.city || ''}
                onChange={handleInputChange}
                placeholder="City or town"
                className="bg-gray-800/50 border-tandoor-platinum/30 text-tandoor-platinum"
                required
              />
              {!tempAddress.city && (
                <p className="text-xs text-red-400 mt-1">City is required</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postcode" className="text-tandoor-platinum">Postcode *</Label>
              <Input
                id="postcode"
                name="postcode"
                value={tempAddress.postcode || ''}
                onChange={handleInputChange}
                placeholder="Postcode"
                className="bg-gray-800/50 border-tandoor-platinum/30 text-tandoor-platinum"
                required
              />
              {!tempAddress.postcode && (
                <p className="text-xs text-red-400 mt-1">Postcode is required</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-tandoor-platinum">Delivery Instructions</Label>
            <Textarea
              id="instructions"
              name="instructions"
              placeholder="Add any special instructions for delivery (optional)"
              value={tempAddress.instructions || ''}
              onChange={handleInputChange}
              className="bg-gray-800/50 border-tandoor-platinum/30 text-tandoor-platinum min-h-[100px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
