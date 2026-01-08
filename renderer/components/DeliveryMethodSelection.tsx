import React from 'react';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DeliveryMethod } from '../pages/Checkout';
import { Truck, Home } from 'lucide-react';

interface Props {
  value: DeliveryMethod;
  onChange: (method: DeliveryMethod) => void;
}

export function DeliveryMethodSelection({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-medium text-tandoor-platinum">How would you like to receive your order?</h2>
      
      <RadioGroup 
        value={value} 
        onValueChange={(val) => onChange(val as DeliveryMethod)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="relative">
          <RadioGroupItem 
            value="delivery" 
            id="delivery" 
            className="sr-only"
          />
          <Label 
            htmlFor="delivery"
            className={`flex flex-col items-center p-6 rounded-lg border-2 cursor-pointer h-full
              ${value === 'delivery' 
                ? 'bg-gray-800/80 border-tandoor-orange text-tandoor-platinum' 
                : 'bg-gray-800/40 border-tandoor-platinum/20 text-tandoor-offwhite hover:bg-gray-800/60 hover:border-tandoor-platinum/40'}`}
          >
            <Truck className="h-12 w-12 mb-4" />
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Delivery</h3>
              <p className="text-sm text-tandoor-offwhite">We'll deliver to your address</p>
              <p className="text-sm mt-4 font-medium">+ £2.50 delivery fee</p>
            </div>
          </Label>
        </div>
        
        <div className="relative">
          <RadioGroupItem 
            value="pickup" 
            id="pickup" 
            className="sr-only"
          />
          <Label 
            htmlFor="pickup"
            className={`flex flex-col items-center p-6 rounded-lg border-2 cursor-pointer h-full
              ${value === 'pickup' 
                ? 'bg-gray-800/80 border-tandoor-orange text-tandoor-platinum' 
                : 'bg-gray-800/40 border-tandoor-platinum/20 text-tandoor-offwhite hover:bg-gray-800/60 hover:border-tandoor-platinum/40'}`}
          >
            <Home className="h-12 w-12 mb-4" />
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Pickup</h3>
              <p className="text-sm text-tandoor-offwhite">Collect from our restaurant</p>
              <p className="text-sm mt-4 font-medium">No additional fee</p>
            </div>
          </Label>
        </div>
      </RadioGroup>
      
      <div className="mt-6 text-sm text-tandoor-offwhite">
        <p>
          {value === 'delivery' 
            ? 'We deliver to most locations within 5 miles of our restaurant.'
            : 'Please collect your order from our restaurant at 25 High Street, Tandoori Town.'}
        </p>
      </div>
    </div>
  );
}
