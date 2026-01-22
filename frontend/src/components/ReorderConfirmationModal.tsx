
import React from 'react';
import { DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  RefreshCw,
  ChefHat,
  X
} from 'lucide-react';
import { ValidationResult, ReorderValidationResponse } from '../utils/reorderTypes';
import StrictDialog from './StrictDialog';

interface ReorderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (validItems: ValidationResult[]) => void;
  validationData: ReorderValidationResponse | null;
  isLoading?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'available':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'price_changed':
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    case 'unavailable':
    case 'variant_unavailable':
      return <XCircle className="w-4 h-4 text-red-400" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'available':
      return (
        <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
          Available
        </Badge>
      );
    case 'price_changed':
      return (
        <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
          Price Changed
        </Badge>
      );
    case 'unavailable':
      return (
        <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
          Unavailable
        </Badge>
      );
    case 'variant_unavailable':
      return (
        <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">
          Variant Changed
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">
          Unknown
        </Badge>
      );
  }
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
};

const PriceChangeIndicator = ({ 
  originalPrice, 
  currentPrice, 
  quantity 
}: { 
  originalPrice: number; 
  currentPrice: number; 
  quantity: number; 
}) => {
  const difference = currentPrice - originalPrice;
  const totalDifference = difference * quantity;
  
  if (Math.abs(difference) < 0.01) {
    return <span className="text-gray-400">{formatPrice(currentPrice)}</span>;
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 line-through">{formatPrice(originalPrice)}</span>
      <span className={difference > 0 ? 'text-red-400' : 'text-green-400'}>
        {formatPrice(currentPrice)}
      </span>
      <div className={`flex items-center gap-1 text-xs ${
        difference > 0 ? 'text-red-400' : 'text-green-400'
      }`}>
        {difference > 0 ? 
          <TrendingUp className="w-3 h-3" /> : 
          <TrendingDown className="w-3 h-3" />
        }
        {formatPrice(Math.abs(totalDifference))}
      </div>
    </div>
  );
};

export function ReorderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  validationData,
  isLoading = false
}: ReorderConfirmationModalProps) {
  if (!validationData) return null;

  const validItems = validationData.validation_results.filter(
    result => result.status === 'available' || result.status === 'price_changed' || result.status === 'variant_unavailable'
  );
  
  const unavailableItems = validationData.validation_results.filter(
    result => result.status === 'unavailable'
  );

  const handleConfirm = () => {
    onConfirm(validItems);
  };

  return (
    <StrictDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <div className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-amber-500" />
              Reorder Confirmation
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] text-amber-500"></div>
            <p className="mt-2 text-gray-400">Validating order items...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {validationData.available_items}
                  </div>
                  <div className="text-sm text-gray-400">Available</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {validationData.price_changed_items}
                  </div>
                  <div className="text-sm text-gray-400">Price Changed</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {validationData.unavailable_items}
                  </div>
                  <div className="text-sm text-gray-400">Unavailable</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${
                    validationData.total_difference > 0 ? 'text-red-400' : 
                    validationData.total_difference < 0 ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {validationData.total_difference > 0 ? '+' : ''}{formatPrice(validationData.total_difference)}
                  </div>
                  <div className="text-sm text-gray-400">Price Difference</div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            {validationData.recommendations.length > 0 && (
              <Alert className="bg-blue-900/20 border-blue-700">
                <AlertTriangle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  <ul className="space-y-1">
                    {validationData.recommendations.map((rec, idx) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Available and Price Changed Items */}
            {validItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Items Ready to Add ({validItems.length})
                </h3>
                
                <div className="space-y-3">
                  {validItems.map((item, idx) => (
                    <Card key={`${item.item_id}-${idx}`} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(item.status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">
                                  {item.quantity}x {item.name}
                                </span>
                                {item.variant_name && (
                                  <span className="text-gray-400 text-sm">({item.variant_name})</span>
                                )}
                                {getStatusBadge(item.status)}
                              </div>
                              {item.suggestion && (
                                <p className="text-sm text-gray-400 mt-1">{item.suggestion}</p>
                              )}
                              {item.notes && (
                                <p className="text-sm text-gray-500 mt-1 italic">Note: {item.notes}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {item.current_price && (
                              <PriceChangeIndicator
                                originalPrice={item.original_price}
                                currentPrice={item.current_price}
                                quantity={item.quantity}
                              />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Unavailable Items */}
            {unavailableItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  Unavailable Items ({unavailableItems.length})
                </h3>
                
                <div className="space-y-3">
                  {unavailableItems.map((item, idx) => (
                    <Card key={`unavailable-${item.item_id}-${idx}`} className="bg-gray-800 border-gray-700 opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(item.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-300 line-through">
                                {item.quantity}x {item.name}
                              </span>
                              {item.variant_name && (
                                <span className="text-gray-500 text-sm">({item.variant_name})</span>
                              )}
                              {getStatusBadge(item.status)}
                            </div>
                            {item.suggestion && (
                              <p className="text-sm text-gray-400 mt-1">{item.suggestion}</p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <span className="text-gray-500 line-through">
                              {formatPrice(item.original_price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Total Summary */}
            <Separator className="bg-gray-700" />
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Original Total:</span>
                  <span>{formatPrice(validationData.original_total)}</span>
                </div>
                
                <div className="flex justify-between text-white font-semibold">
                  <span>New Total:</span>
                  <span>{formatPrice(validationData.new_total)}</span>
                </div>
                
                {Math.abs(validationData.total_difference) > 0.01 && (
                  <div className={`flex justify-between font-medium ${
                    validationData.total_difference > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    <span>Difference:</span>
                    <span>
                      {validationData.total_difference > 0 ? '+' : ''}
                      {formatPrice(validationData.total_difference)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          
          {!isLoading && validItems.length > 0 && (
            <Button
              onClick={handleConfirm}
              className="bg-amber-600 hover:bg-amber-500"
            >
              Confirm Reorder ({validItems.length})
            </Button>
          )}
          
          {!isLoading && validItems.length === 0 && (
            <Button
              variant="secondary"
              disabled
            >
              No Items Available
            </Button>
          )}
        </DialogFooter>
      </div>
    </StrictDialog>
  );
}
