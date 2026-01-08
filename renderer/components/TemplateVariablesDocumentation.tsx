import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { QuestionMarkCircle, FileText, User, ShoppingBag, Home, Calendar, Clock, CreditCard, Settings, Info, Cog } from "lucide-react";

// Comprehensive variable category list
const variableCategories = [
  {
    id: 'business',
    name: 'Business',
    icon: <Home className="h-4 w-4" />,
    variables: [
      { name: '{{business.name}}', description: 'Restaurant name', example: 'Cottage Tandoori' },
      { name: '{{business.address}}', description: 'Restaurant address', example: '123 High Street, London' },
      { name: '{{business.phone}}', description: 'Restaurant phone number', example: '020 1234 5678' },
      { name: '{{business.website}}', description: 'Restaurant website', example: 'www.cottagetandoori.com' },
      { name: '{{business.email}}', description: 'Restaurant email', example: 'info@cottagetandoori.com' },
      { name: '{{business.tax_number}}', description: 'Business tax ID', example: 'VAT: GB123456789' },
      { name: '{{business.logo}}', description: 'Restaurant logo (if available)', example: '[LOGO]' },
    ]
  },
  {
    id: 'order',
    name: 'Order',
    icon: <ShoppingBag className="h-4 w-4" />,
    variables: [
      { name: '{{order.id}}', description: 'Order ID/reference number', example: '#12345' },
      { name: '{{order.type}}', description: 'Order type', example: 'Dine-in, Delivery, Collection, etc.' },
      { name: '{{order.date}}', description: 'Order date and time', example: '2023-05-27 19:30' },
      { name: '{{order.source}}', description: 'Order source', example: 'POS, Online, Voice, etc.' },
      { name: '{{order.subtotal}}', description: 'Order subtotal amount', example: '£45.90' },
      { name: '{{order.tax}}', description: 'Tax amount', example: '£9.18' },
      { name: '{{order.discount}}', description: 'Discount amount', example: '£5.00' },
      { name: '{{order.total}}', description: 'Total order amount', example: '£54.67' },
      { name: '{{order.table_number}}', description: 'Table number (dine-in only)', example: '12' },
      { name: '{{order.guest_count}}', description: 'Number of guests (dine-in only)', example: '4' },
      { name: '{{order.payment_method}}', description: 'Payment method', example: 'Card, Cash, etc.' },
      { name: '{{order.payment_status}}', description: 'Payment status', example: 'Paid, Pending, etc.' },
      { name: '{{order.notes}}', description: 'Order-level notes', example: 'Birthday celebration' },
    ]
  },
  {
    id: 'customer',
    name: 'Customer',
    icon: <User className="h-4 w-4" />,
    variables: [
      { name: '{{customer.name}}', description: 'Customer name', example: 'John Smith' },
      { name: '{{customer.phone}}', description: 'Customer phone number', example: '07123 456789' },
      { name: '{{customer.email}}', description: 'Customer email', example: 'john@example.com' },
      { name: '{{customer.address}}', description: 'Customer delivery address', example: '456 Customer St, London, E1 6AN' },
      { name: '{{customer.notes}}', description: 'Customer-specific notes', example: 'Regular customer, prefers spicy food' },
      { name: '{{customer.id}}', description: 'Customer ID in system', example: 'CUST-789' },
    ]
  },
  {
    id: 'delivery',
    name: 'Delivery',
    icon: <Clock className="h-4 w-4" />,
    orderType: 'delivery',
    variables: [
      { name: '{{delivery.address}}', description: 'Delivery address', example: '456 Customer St, London, E1 6AN' },
      { name: '{{delivery.time}}', description: 'Requested delivery time', example: '19:45' },
      { name: '{{delivery.notes}}', description: 'Delivery instructions', example: 'Knock loudly, dog is friendly' },
      { name: '{{delivery.fee}}', description: 'Delivery fee amount', example: '£2.50' },
      { name: '{{delivery.driver}}', description: 'Assigned delivery driver name', example: 'Michael' },
      { name: '{{delivery.estimated_arrival}}', description: 'Estimated delivery arrival', example: '19:45-20:00' },
    ]
  },
  {
    id: 'collection',
    name: 'Collection',
    icon: <Clock className="h-4 w-4" />,
    orderType: 'collection',
    variables: [
      { name: '{{collection.time}}', description: 'Requested collection time', example: '19:30' },
      { name: '{{collection.notes}}', description: 'Collection instructions', example: 'Will send son to collect' },
      { name: '{{collection.ready_by}}', description: 'Time order should be ready by', example: '19:25' },
    ]
  },
  {
    id: 'item',
    name: 'Items',
    icon: <FileText className="h-4 w-4" />,
    variables: [
      { name: '{{each item}}...{{end each}}', description: 'Loop through all order items', example: 'Loop construct for items' },
      { name: '{{item.name}}', description: 'Item name', example: 'Chicken Tikka Masala' },
      { name: '{{item.quantity}}', description: 'Item quantity', example: '2' },
      { name: '{{item.price}}', description: 'Item unit price', example: '£12.95' },
      { name: '{{item.total}}', description: 'Item total price (quantity × price)', example: '£25.90' },
      { name: '{{item.code}}', description: 'Item code/SKU', example: 'CTM-01' },
      { name: '{{item.notes}}', description: 'Special instructions for this item', example: 'Extra spicy, no coriander' },
      { name: '{{item.allergies}}', description: 'Allergy information', example: 'Contains: Dairy' },
      { name: '{{item.customer_name}}', description: 'Customer name for this item (dine-in)', example: 'John' },
      { name: '{{item.customer_number}}', description: 'Customer number for this item (dine-in)', example: '1' },
      { name: '{{each item.modifiers}}...{{end each}}', description: 'Loop through item modifiers', example: 'Loop for modifiers' },
      { name: '{{modifier.name}}', description: 'Modifier name', example: 'Extra Rice' },
      { name: '{{modifier.price}}', description: 'Modifier price', example: '£1.50' },
    ]
  },
  {
    id: 'customer_tabs',
    name: 'Customer Tabs',
    icon: <User className="h-4 w-4" />,
    orderType: 'dine-in',
    templateType: 'kitchen',
    variables: [
      { name: '{{each customer_group}}...{{end each}}', description: 'Loop through customer groups at table', example: 'Loop construct for customer grouping' },
      { name: '{{customer_group.name}}', description: 'Customer name or identifier', example: 'John' },
      { name: '{{customer_group.number}}', description: 'Customer number at table', example: '1' },
      { name: '{{customer_group.items}}', description: 'Items for this customer', example: 'Array of order items' },
      { name: '{{item.customer_name}}', description: 'Customer name for individual item', example: 'Sarah' },
      { name: '{{item.customer_number}}', description: 'Customer number for individual item', example: '2' },
    ]
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: <Cog className="h-4 w-4" />,
    templateType: 'kitchen',
    variables: [
      { name: '{{kitchen.ready_by}}', description: 'Time food should be ready by', example: '19:25' },
      { name: '{{kitchen.priority}}', description: 'Order priority level', example: 'High' },
      { name: '{{kitchen.allergy_warning}}', description: 'Special allergy warning text', example: '⚠️ ALLERGEN ALERT ⚠️' },
      { name: '{{kitchen.cook_time}}', description: 'Estimated cooking time', example: '15 min' },
    ]
  },
  {
    id: 'server',
    name: 'Server',
    icon: <User className="h-4 w-4" />,
    orderType: 'dine-in',
    variables: [
      { name: '{{server.name}}', description: 'Server/staff name', example: 'Sarah' },
      { name: '{{server.id}}', description: 'Server ID', example: 'S-123' },
      { name: '{{server.section}}', description: 'Server section', example: 'Main Floor' },
    ]
  },
  {
    id: 'payment',
    name: 'Payment',
    icon: <CreditCard className="h-4 w-4" />,
    variables: [
      { name: '{{payment.method}}', description: 'Payment method used', example: 'Visa Card' },
      { name: '{{payment.amount}}', description: 'Amount paid', example: '£54.67' },
      { name: '{{payment.tip}}', description: 'Tip amount', example: '£5.50' },
      { name: '{{payment.reference}}', description: 'Payment reference number', example: 'TR-123456' },
      { name: '{{payment.change}}', description: 'Change given (for cash payments)', example: '£5.33' },
      { name: '{{payment.card_last4}}', description: 'Last 4 digits of card', example: '1234' },
    ]
  },
  {
    id: 'condition',
    name: 'Conditionals',
    icon: <QuestionMarkCircle className="h-4 w-4" />,
    variables: [
      { name: '{{if delivery}}...{{end if}}', description: 'Show content only for delivery orders', example: 'Conditional section' },
      { name: '{{if collection}}...{{end if}}', description: 'Show content only for collection orders', example: 'Conditional section' },
      { name: '{{if dine-in}}...{{end if}}', description: 'Show content only for dine-in orders', example: 'Conditional section' },
      { name: '{{if online}}...{{end if}}', description: 'Show content only for online orders', example: 'Conditional section' },
      { name: '{{if voice}}...{{end if}}', description: 'Show content only for voice orders', example: 'Conditional section' },
      { name: '{{if paid}}...{{end if}}', description: 'Show content only if order is paid', example: 'Conditional section' },
      { name: '{{if has_allergies}}...{{end if}}', description: 'Show content only if order has allergy notices', example: 'Conditional section' },
    ]
  }
];

interface TemplateVariablesDocumentationProps {
  openByDefault?: boolean;
  currentOrderType?: string;
  currentTemplateType?: string;
}

const TemplateVariablesDocumentation: React.FC<TemplateVariablesDocumentationProps> = ({ 
  openByDefault = false,
  currentOrderType = 'dine-in',
  currentTemplateType = 'receipt'
}) => {
  const [open, setOpen] = useState(openByDefault);
  const [selectedCategory, setSelectedCategory] = useState('business');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter variables that are relevant to the current order type and template type
  const filteredCategories = variableCategories.filter(category => {
    // Only show categories that are relevant to the current order type
    if (category.orderType && category.orderType !== currentOrderType) {
      return false;
    }
    
    // Only show categories that are relevant to the current template type
    if (category.templateType && category.templateType !== currentTemplateType) {
      return false;
    }
    
    // Filter based on search term
    if (searchTerm) {
      return category.variables.some(variable => 
        variable.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        variable.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return true;
  });



  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Template Variables
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Variables Documentation
              <Badge variant="outline" className="ml-2">
                {currentTemplateType === 'kitchen' ? 'Kitchen Ticket' : 'Receipt'}
              </Badge>
              <Badge variant="secondary" className="ml-1">
                {currentOrderType}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-between items-center gap-4 my-4">
            <div className="flex-1">
              <Input 
                placeholder="Search variables..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-4 flex-1 overflow-hidden">
            <div className="col-span-1 border-r pr-4 overflow-y-auto">
              <div className="space-y-1">
                {filteredCategories.map((category) => (
                  <Button 
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <span>{category.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="col-span-4 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <ScrollArea className="h-[60vh]">
                  {filteredCategories.map((category) => (
                    <div 
                      key={category.id} 
                      className={`space-y-4 ${selectedCategory === category.id ? '' : 'hidden'}`}
                    >
                      <div className="flex items-center gap-2">
                        {category.icon}
                        <h3 className="text-lg font-semibold">{category.name} Variables</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {category.variables.map((variable, index) => (
                          <div key={index} className="border rounded-md p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                {variable.name}
                              </code>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {variable.description}
                            </div>
                            
                            <div className="text-xs bg-muted/50 p-2 rounded">
                              <strong>Example:</strong> {variable.example}
                            </div>
                            
                            {variable.name.includes('{{each') && (
                              <div className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 p-2 rounded border border-amber-200 dark:border-amber-900">
                                <strong>Note:</strong> This is a loop variable. Use it to iterate through multiple items.
                              </div>
                            )}
                            
                            {variable.name.includes('{{if') && (
                              <div className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 p-2 rounded border border-blue-200 dark:border-blue-900">
                                <strong>Note:</strong> This is a conditional variable. Content will only appear when condition is met.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
              
              <Separator className="my-4" />
              
              <div className="p-3 bg-muted/30 rounded-md">
                <h4 className="text-sm font-medium mb-2">Using Variables in Templates</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Copy and paste variables exactly as shown including the curly braces</li>
                  <li>• For loops, make sure to include both opening and closing tags</li>
                  <li>• Test your template with different order types to ensure it works correctly</li>
                  <li>• For kitchen tickets, highlight important information like allergies</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TemplateVariablesDocumentation;
