import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, ImageOff } from 'lucide-react';
import { formatCurrency } from 'utils/formatUtils';
import { OptimizedImage } from 'components/OptimizedImage';

interface SetMeal {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  set_price: number;
  active: boolean;
  code?: string;
  set_meal_items?: SetMealItem[];
}

interface SetMealItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  name: string;
  price: number;
}

interface SetMealPreviewProps {
  setMeal: SetMeal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SetMealPreview({ setMeal, isOpen, onClose }: SetMealPreviewProps) {
  if (!setMeal) return null;

  // Calculate pricing breakdown
  const individualItemsTotal = setMeal.set_meal_items?.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0) || 0;
  
  const savings = individualItemsTotal - setMeal.set_price;
  const totalItems = setMeal.set_meal_items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-[#1E1E1E] border-gray-600 text-white overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-2xl font-bold text-white">{setMeal.name}</DialogTitle>
            {setMeal.code && (
              <Badge variant="outline" className="text-xs border-[#7C5DFA] text-[#7C5DFA]">
                {setMeal.code}
              </Badge>
            )}
            <Badge 
              className={`text-xs ${
                setMeal.active 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              {setMeal.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Hero Image and Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Set Meal Image</h3>
              <div className="relative aspect-[4/3] bg-[#2A2A2A] rounded-lg overflow-hidden">
                {setMeal.image_url ? (
                  <OptimizedImage
                    fallbackUrl={setMeal.image_url}
                    variant="widescreen"
                    alt={setMeal.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <ImageOff className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">No image available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description and Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Description</h3>
              <div className="bg-[#2A2A2A] rounded-lg p-4">
                <p className="text-gray-300 leading-relaxed">
                  {setMeal.description || 'No description available'}
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#2A2A2A] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-[#7C5DFA]">{totalItems}</p>
                  <p className="text-sm text-gray-400">Total Items</p>
                </div>
                <div className="bg-[#2A2A2A] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(setMeal.set_price)}</p>
                  <p className="text-sm text-gray-400">Set Price</p>
                </div>
              </div>
            </div>
          </div>

          {/* Included Menu Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Included Menu Items</h3>
            {setMeal.set_meal_items && setMeal.set_meal_items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {setMeal.set_meal_items.map((item) => (
                  <Card key={item.id} className="bg-[#2A2A2A] border-gray-600 p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="text-white font-medium text-sm leading-tight">{item.name}</h4>
                        <Badge className="bg-[#7C5DFA] text-white text-xs ml-2 flex-shrink-0">
                          x{item.quantity}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Individual Price:</span>
                        <span className="text-[#7C5DFA] text-sm font-semibold">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-600 pt-2">
                        <span className="text-gray-400 text-xs">Subtotal:</span>
                        <span className="text-white text-sm font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-[#2A2A2A] rounded-lg p-8 text-center">
                <p className="text-gray-400">No menu items added to this set meal</p>
              </div>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Pricing Breakdown</h3>
            <Card className="bg-[#2A2A2A] border-gray-600 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Individual Items Total:</span>
                  <span className="font-mono">{formatCurrency(individualItemsTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-white font-semibold text-lg">
                  <span>Set Meal Price:</span>
                  <span className="font-mono">{formatCurrency(setMeal.set_price)}</span>
                </div>
                <div className="border-t border-gray-600 pt-4">
                  {savings > 0 ? (
                    <div className="flex items-center justify-between text-green-500 font-semibold text-lg">
                      <span>Customer Saves:</span>
                      <span className="font-mono">{formatCurrency(savings)}</span>
                    </div>
                  ) : savings < 0 ? (
                    <div className="flex items-center justify-between text-red-400 font-semibold text-lg">
                      <span>Premium Charge:</span>
                      <span className="font-mono">{formatCurrency(Math.abs(savings))}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-gray-400 font-semibold text-lg">
                      <span>No Price Difference</span>
                      <span className="font-mono">{formatCurrency(0)}</span>
                    </div>
                  )}
                </div>
                
                {/* Savings Percentage */}
                {individualItemsTotal > 0 && (
                  <div className="bg-[#3A3A3A] rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-400 mb-1">Savings Percentage</p>
                    <p className="text-xl font-bold text-[#7C5DFA]">
                      {((savings / individualItemsTotal) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
