import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, Package, Truck, Globe, Phone, Receipt, ChefHat, Check, Printer, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OrderTypeSelectorCardProps {
  orderType: string;
  selectedOrderType: string;
  selectedPrintType: string;
  onSelect: (orderType: string, printType: string) => void;
}

const OrderTypeSelectorCard: React.FC<OrderTypeSelectorCardProps> = ({
  orderType,
  selectedOrderType,
  selectedPrintType,
  onSelect
}) => {
  // Define order type specific data
  const orderTypeData = {
    'dine-in': {
      title: 'Dine-In',
      description: 'For orders served at tables',
      icon: <UtensilsCrossed className="h-6 w-6" />,
      color: 'bg-amber-500',
      examples: [
        { label: 'Customer Receipt', description: 'With table numbers & server info', printType: 'receipt', icon: <Receipt className="h-4 w-4" />, highlights: ['Table numbers', 'Server info', 'Guest count'] },
        { label: 'Kitchen Ticket', description: 'Without prices, with cooking instructions', printType: 'kitchen', icon: <ChefHat className="h-4 w-4" />, highlights: ['Table numbers', 'Cooking preferences', 'Allergy info'] }
      ],
      features: [
        { icon: <Users className="h-4 w-4 text-amber-500" />, text: 'Includes table & guest info' },
        { icon: <Printer className="h-4 w-4 text-amber-500" />, text: 'Server details on receipts' }
      ]
    },
    'collection': {
      title: 'Collection',
      description: 'For orders picked up by customers',
      icon: <Package className="h-6 w-6" />,
      color: 'bg-emerald-500',
      examples: [
        { label: 'Customer Receipt', description: 'With pickup time & contact details', printType: 'receipt', icon: <Receipt className="h-4 w-4" />, highlights: ['Collection time', 'Order number', 'Customer name'] },
        { label: 'Kitchen Ticket', description: 'With collection time highlighted', printType: 'kitchen', icon: <ChefHat className="h-4 w-4" />, highlights: ['Collection time', 'Special requests', 'Prep priority'] }
      ],
      features: [
        { icon: <Clock className="h-4 w-4 text-emerald-500" />, text: 'Highlights collection time' },
        { icon: <Printer className="h-4 w-4 text-emerald-500" />, text: 'Customer name & contact' }
      ]
    },
    'delivery': {
      title: 'Delivery',
      description: 'For orders delivered to customers',
      icon: <Truck className="h-6 w-6" />,
      color: 'bg-blue-500',
      examples: [
        { label: 'Customer Receipt', description: 'With full delivery address & contact', printType: 'receipt', icon: <Receipt className="h-4 w-4" />, highlights: ['Delivery address', 'Customer phone', 'Driver notes'] },
        { label: 'Kitchen Ticket', description: 'With delivery notes & special instructions', printType: 'kitchen', icon: <ChefHat className="h-4 w-4" />, highlights: ['Delivery time', 'Packaging notes', 'Special requests'] }
      ],
      features: [
        { icon: <Truck className="h-4 w-4 text-blue-500" />, text: 'Full delivery address details' },
        { icon: <Printer className="h-4 w-4 text-blue-500" />, text: 'Driver instructions included' }
      ]
    },
    'online': {
      title: 'Online',
      description: 'For orders placed through website',
      icon: <Globe className="h-6 w-6" />,
      color: 'bg-purple-500',
      examples: [
        { label: 'Customer Receipt', description: 'With online payment confirmation', printType: 'receipt', icon: <Receipt className="h-4 w-4" />, highlights: ['Online order number', 'Payment details', 'Website branding'] },
        { label: 'Kitchen Ticket', description: 'With order source highlighted', printType: 'kitchen', icon: <ChefHat className="h-4 w-4" />, highlights: ['Online order source', 'Special notes', 'Item customizations'] }
      ],
      features: [
        { icon: <Globe className="h-4 w-4 text-purple-500" />, text: 'Online order identifiers' },
        { icon: <Printer className="h-4 w-4 text-purple-500" />, text: 'Website branding elements' }
      ]
    },
    'voice': {
      title: 'Voice Order',
      description: 'For orders placed through AI voice',
      icon: <Phone className="h-6 w-6" />,
      color: 'bg-rose-500',
      examples: [
        { label: 'Customer Receipt', description: 'With voice confirmation number', printType: 'receipt', icon: <Receipt className="h-4 w-4" />, highlights: ['AI voice confirmation', 'Order reference', 'Transcribed details'] },
        { label: 'Kitchen Ticket', description: 'With transcribed special requests', printType: 'kitchen', icon: <ChefHat className="h-4 w-4" />, highlights: ['AI source indicator', 'Transcribed instructions', 'Priority markers'] }
      ],
      features: [
        { icon: <Phone className="h-4 w-4 text-rose-500" />, text: 'Voice order identifiers' },
        { icon: <Printer className="h-4 w-4 text-rose-500" />, text: 'Transcribed customer requests' }
      ]
    }
  };

  const data = orderTypeData[orderType as keyof typeof orderTypeData];
  const isSelected = selectedOrderType === orderType;

  if (!data) return null;

  return (
    <div 
      className={cn(
        "border-2 rounded-lg overflow-hidden transition-all duration-200",
        isSelected ? "border-purple-500 shadow-md shadow-purple-500/20" : "border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700"
      )}
    >
      <div className={cn(
        "p-4 flex items-center justify-between", 
        isSelected ? "bg-purple-50 dark:bg-purple-900/20" : "bg-gray-50 dark:bg-gray-900/50"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center rounded-full p-2.5 w-12 h-12 text-white shadow-md transition-all",
            data.color,
            isSelected && "ring-2 ring-offset-2 ring-purple-300 dark:ring-purple-700"
          )}>
            {data.icon}
          </div>
          <div>
            <h3 className={cn(
              "font-medium text-lg transition-colors",
              isSelected ? "text-purple-700 dark:text-purple-400" : "text-gray-800 dark:text-gray-200"
            )}>{data.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{data.description}</p>
          </div>
        </div>
        {isSelected && (
          <Badge className="bg-purple-500 py-1.5 px-3">
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Selected
          </Badge>
        )}
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 flex items-center">
          <Printer className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
          Select print format:
        </p>

        {/* Show key features specific to this order type */}
        <div className="mb-2">
          <div className="flex flex-wrap gap-2 mb-2">
            {data.features?.map((feature, i) => (
              <div key={i} className="text-xs flex items-center bg-gray-100 dark:bg-gray-800 rounded-full py-1 px-2">
                {feature.icon}
                <span className="ml-1.5">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        {data.examples.map((example, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Button 
              variant={selectedPrintType === example.printType && selectedOrderType === orderType ? "default" : "outline"}
              size="sm"
              className={cn("justify-start gap-2 transition-all font-medium", 
                selectedPrintType === example.printType && selectedOrderType === orderType 
                  ? "bg-purple-500 hover:bg-purple-600 text-white shadow-md" 
                  : "hover:border-purple-300 dark:hover:border-purple-600"
              )}
              onClick={() => onSelect(orderType, example.printType)}
              aria-pressed={selectedPrintType === example.printType && selectedOrderType === orderType}
              aria-label={`${example.label} - ${example.description}`}
            >
              <div className="flex items-center gap-2">
                {example.icon}
                {example.label}
              </div>
            </Button>
            {selectedPrintType === example.printType && selectedOrderType === orderType && (
              <div className="text-xs text-purple-600 dark:text-purple-400 pl-2 mt-1.5">
                <p className="italic mb-1">{example.description}</p>
                
                {/* Show highlights as tooltip feature markers */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {example.highlights?.map((highlight, j) => (
                    <TooltipProvider key={j}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="border-purple-300 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 cursor-help">
                            {highlight}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Included in this template</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTypeSelectorCard;