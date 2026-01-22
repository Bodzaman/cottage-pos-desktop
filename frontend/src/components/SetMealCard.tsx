import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Eye, ImageOff, Trash2 } from 'lucide-react';
import { formatCurrency } from 'utils/formatUtils';
import { SetMealPreview } from 'components/SetMealPreview';
import { cn } from 'utils/cn';

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

interface SetMealCardProps {
  setMeal: SetMeal;
  onEdit: (setMeal: SetMeal) => void;
  onDelete: (setMealId: string) => void;
}

export function SetMealCard({ setMeal, onEdit, onDelete }: SetMealCardProps) {
  const [showPreview, setShowPreview] = React.useState(false);
  
  const totalItems = setMeal.set_meal_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <>
      <Card className="bg-[#1A1A1A] border-[rgba(124,93,250,0.2)] hover:border-[rgba(124,93,250,0.4)] transition-all duration-300 overflow-hidden group">
        {/* Status Badge - Top Right */}
        <div className="relative">
          <Badge 
            className={cn(
              "absolute top-3 right-3 z-10 flex items-center gap-1 text-xs px-2 py-1 font-medium",
              setMeal.active 
                ? 'bg-green-600/20 text-green-400 border-green-500/30' 
                : 'bg-red-600/20 text-red-400 border-red-500/30'
            )}
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              setMeal.active ? 'bg-green-400' : 'bg-red-400'
            )} />
            {setMeal.active ? 'Active' : 'Inactive'}
          </Badge>
          
          {/* Item Count Badge - Top Left */}
          {totalItems > 0 && (
            <Badge className="absolute top-3 left-3 z-10 bg-[#7C5DFA]/20 text-[#7C5DFA] border-[#7C5DFA]/30 text-xs px-2 py-1">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </Badge>
          )}
          
          {/* Image Section */}
          <div className="relative aspect-[4/3] bg-gray-800">
            {setMeal.image_url ? (
              <img
                src={setMeal.image_url}
                alt={setMeal.name}
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <ImageOff className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-500">No image</p>
                </div>
              </div>
            )}
            
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/20" />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="text-white font-semibold text-lg leading-tight flex-1 mr-2">{setMeal.name}</h3>
              {setMeal.code && (
                <Badge variant="outline" className="text-xs border-gray-500 text-gray-400 bg-gray-800/50">
                  {setMeal.code}
                </Badge>
              )}
            </div>
            
            {setMeal.description && (
              <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                {setMeal.description}
              </p>
            )}
          </div>

          {/* Price Display */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Set Price:</span>
            <span className="text-white font-bold text-xl">{formatCurrency(setMeal.set_price)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(setMeal)}
              className="flex-1 bg-[#7C5DFA]/10 border-[#7C5DFA]/30 text-[#7C5DFA] hover:bg-[#7C5DFA]/20 hover:border-[#7C5DFA]/50 hover:text-white transition-all duration-200"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-white transition-all duration-200"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(setMeal.id)}
              className="bg-red-600/10 border-red-600/30 text-red-400 hover:bg-red-600/20 hover:border-red-600/50 hover:text-red-300 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
      
      <SetMealPreview 
        setMeal={setMeal}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </>
  );
}

export default SetMealCard;
