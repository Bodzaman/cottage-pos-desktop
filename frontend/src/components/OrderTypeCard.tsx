import React from 'react';
import {
  UtensilsCrossed, Package, Truck, Globe, Phone, Receipt, ChefHat, Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OrderTypeCardProps {
  orderType: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

const OrderTypeCard: React.FC<OrderTypeCardProps> = ({
  orderType,
  selected,
  onClick,
  className = ''
}) => {
  // Order type data configuration
  const orderTypeData: Record<string, {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    features: string[];
  }> = {
    'dine-in': {
      title: 'Dine-In',
      description: 'Table service in restaurant',
      icon: <UtensilsCrossed className="h-10 w-10" />,
      color: 'bg-amber-500',
      features: ['Table numbers', 'Server details', 'Guest count']
    },
    'collection': {
      title: 'Collection',
      description: 'Customer pickup orders',
      icon: <Package className="h-10 w-10" />,
      color: 'bg-emerald-500',
      features: ['Customer name', 'Pickup time', 'Order notes']
    },
    'delivery': {
      title: 'Delivery',
      description: 'Orders delivered to customers',
      icon: <Truck className="h-10 w-10" />,
      color: 'bg-blue-500',
      features: ['Delivery address', 'Contact info', 'Driver notes']
    },
    'online': {
      title: 'Online',
      description: 'Web & app orders',
      icon: <Globe className="h-10 w-10" />,
      color: 'bg-purple-500',
      features: ['Order source', 'Payment method', 'Special requests']
    },
    'voice': {
      title: 'Voice Orders',
      description: 'AI Phone orders',
      icon: <Phone className="h-10 w-10" />,
      color: 'bg-red-500',
      features: ['Call details', 'Voice transcription', 'Auto-captured info']
    }
  };

  const data = orderTypeData[orderType] || orderTypeData['dine-in'];

  return (
    <div 
      className={`
        ${className}
        rounded-xl overflow-hidden cursor-pointer transition-all duration-200
        ${selected 
          ? 'ring-2 ring-purple-500 dark:ring-purple-400 shadow-lg transform scale-[1.02]' 
          : 'border dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800/40 shadow-sm'}
      `}
      onClick={onClick}
    >
      <div className="p-5 flex flex-col h-full">
        {/* Header with icon and title */}
        <div className="flex items-center mb-3">
          <div className={`p-2 rounded-lg ${data.color} bg-opacity-20 dark:bg-opacity-30 mr-3`}>
            {data.icon}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{data.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{data.description}</p>
          </div>
          {selected && (
            <Badge className="ml-auto bg-purple-500">
              <Check className="h-3 w-3 mr-1" /> Selected
            </Badge>
          )}
        </div>
        
        {/* Features list */}
        <ul className="mt-2 space-y-2 text-sm">
          {data.features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-600 dark:text-gray-300">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></span>
              {feature}
            </li>
          ))}
        </ul>
        
        {/* Print types */}
        <div className="mt-auto pt-4">
          <p className="text-xs font-medium mb-2">Available Print Types:</p>
          <div className="flex space-x-2">
            <div className="flex items-center text-xs bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
              <Receipt className="h-3 w-3 mr-1 text-emerald-500" />
              <span>Receipt</span>
            </div>
            <div className="flex items-center text-xs bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
              <ChefHat className="h-3 w-3 mr-1 text-orange-500" />
              <span>Kitchen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTypeCard;