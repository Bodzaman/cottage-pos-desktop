import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BatchPriceUpdateFormValues, batchPriceUpdateSchema } from '../utils/menuFormSchemas';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminSelect } from 'components/AdminSelect';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Loader2, PenLine, Cog } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../utils/supabaseClient';
import { menuKeys } from '../utils/menuQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Category } from '../utils/menuTypes';

interface Props {
  categories: Category[];
}

export default function BatchPriceUpdate({ categories }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // React Query: Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Initialize form with default values
  const form = useForm<BatchPriceUpdateFormValues>({
    resolver: zodResolver(batchPriceUpdateSchema),
    defaultValues: {
      priceType: 'takeaway',
      applyTo: 'all',
      categoryId: '',
      action: 'set',
      value: 0,
      percentage: false
    }
  });
  
  // Watch form values for conditional rendering
  const watchApplyTo = form.watch('applyTo');
  const watchAction = form.watch('action');
  const watchPercentage = form.watch('percentage');
  
  // Submit form
  const onSubmit = async (data: BatchPriceUpdateFormValues) => {
    if (data.action !== 'set' && data.percentage && data.value > 100) {
      toast.error('Percentage value cannot exceed 100%');
      return;
    }
    
    // Confirm before making changes
    const actionText = data.action === 'set' ? 'set' : 
                      data.action === 'increase' ? 'increase' : 'decrease';
    const valueText = data.percentage ? `${data.value}%` : `\u00a3${data.value.toFixed(2)}`;
    const scopeText = data.applyTo === 'all' ? 'all menu items' : 
                     `menu items in the ${categories.find(c => c.id === data.categoryId)?.name || 'selected'} category`;
    const priceTypeText = data.priceType === 'takeaway' ? 'takeaway prices' : 
                         data.priceType === 'dine_in' ? 'dine-in prices' : 'delivery prices';
                         
    if (!confirm(`Are you sure you want to ${actionText} ${priceTypeText} for ${scopeText} by ${valueText}?`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      // First get all variants that match our criteria
      let query = supabase.from('item_variants').select('id, price, price_dine_in, price_delivery');
      
      // Apply category filter if needed
      if (data.applyTo === 'category' && data.categoryId) {
        // Need to join with menu_items to filter by category
        query = supabase
          .from('item_variants')
          .select('id, price, price_dine_in, price_delivery, menu_item:menu_items!inner(category_id)')
          .eq('menu_item.category_id', data.categoryId);
      }
      
      const { data: variants, error } = await query;
      
      if (error) throw error;
      
      if (!variants || variants.length === 0) {
        toast.warning('No variants found matching your criteria');
        setIsLoading(false);
        return;
      }
      
      // Apply the price update to each variant
      const updates = variants.map(variant => {
        // Determine which price field to update
        const priceField = data.priceType === 'takeaway' ? 'price' : 
                          data.priceType === 'dine_in' ? 'price_dine_in' : 'price_delivery';
        
        // Get the current price (or base price if the field doesn't exist)
        let currentPrice = variant[priceField] !== null ? variant[priceField] : variant.price;
        
        // Calculate the new price based on the action
        let newPrice;
        if (data.action === 'set') {
          newPrice = data.value;
        } else {
          // For percentage changes
          if (data.percentage) {
            const percentageFactor = data.value / 100;
            newPrice = data.action === 'increase' ? 
              currentPrice * (1 + percentageFactor) : 
              currentPrice * (1 - percentageFactor);
          } else {
            // For fixed amount changes
            newPrice = data.action === 'increase' ? 
              currentPrice + data.value : 
              Math.max(0, currentPrice - data.value); // Ensure price doesn't go below 0
          }
        }
        
        // Round to 2 decimal places
        newPrice = parseFloat(newPrice.toFixed(2));
        
        // Return an object with the id and the field to update
        return {
          id: variant.id,
          [priceField]: newPrice
        };
      });
      
      // Batch update the variants
      // Since Supabase doesn't support bulk updates directly, we need to do sequential updates
      let successCount = 0;
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('item_variants')
          .update({ [Object.keys(update)[1]]: update[Object.keys(update)[1]] })
          .eq('id', update.id);
          
        if (!updateError) successCount++;
      }
      
      // Show success message
      toast.success(`Updated ${successCount} of ${updates.length} prices successfully`);
      
      // React Query: Invalidate affected caches to trigger refetch
      queryClient.invalidateQueries({ queryKey: menuKeys.itemVariants() });
      queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
      
      // Reset form and close dialog
      form.reset();
      setIsOpen(false);
      
    } catch (error: any) {
      toast.error('Error updating prices: ' + error.message);
      console.error('Error updating prices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-tandoor-gold hover:bg-tandoor-gold/80 text-tandoor-charcoal flex gap-2">
          <Cog className="h-4 w-4" />
          Bulk Price Update
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-tandoor-charcoal text-tandoor-platinum border-tandoor-red/20 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-tandoor-gold">
            Bulk Price Update
          </DialogTitle>
          <DialogDescription className="text-tandoor-platinum/70">
            Update multiple menu item prices at once.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Price Type */}
            <FormField
              control={form.control}
              name="priceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-tandoor-platinum">Price Type</FormLabel>
                  <AdminSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select a price type"
                    options={[
                      { value: "takeaway", label: "Takeaway/Collection Prices" },
                      { value: "dine_in", label: "Dine-in Prices" },
                      { value: "delivery", label: "Delivery Prices" }
                    ]}
                    variant="purple"
                  />
                  <FormDescription className="text-tandoor-platinum/60">
                    Select which type of price you want to update.
                  </FormDescription>
                </FormItem>
              )}
            />
            
            {/* Apply To */}
            <FormField
              control={form.control}
              name="applyTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-tandoor-platinum">Apply To</FormLabel>
                  <AdminSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select where to apply"
                    options={[
                      { value: "all", label: "All Menu Items" },
                      { value: "category", label: "Specific Category" }
                    ]}
                    variant="purple"
                  />
                </FormItem>
              )}
            />
            
            {/* Category ID - only show if applyTo is 'category' */}
            {watchApplyTo === 'category' && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-tandoor-platinum">Category</FormLabel>
                    <AdminSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a category"
                      options={categories.map(category => ({
                        value: category.id,
                        label: category.name
                      }))}
                      variant="purple"
                    />
                  </FormItem>
                )}
              />
            )}
            
            {/* Action */}
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-tandoor-platinum">Action</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="set" className="border-tandoor-red text-tandoor-red" />
                        </FormControl>
                        <FormLabel className="text-tandoor-platinum font-normal">
                          Set to exact value
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="increase" className="border-tandoor-red text-tandoor-red" />
                        </FormControl>
                        <FormLabel className="text-tandoor-platinum font-normal">
                          Increase prices
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="decrease" className="border-tandoor-red text-tandoor-red" />
                        </FormControl>
                        <FormLabel className="text-tandoor-platinum font-normal">
                          Decrease prices
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Percentage Switch - only show if action is not 'set' */}
            {watchAction !== 'set' && (
              <FormField
                control={form.control}
                name="percentage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-tandoor-red/20 p-3 shadow-sm bg-tandoor-black">
                    <div className="space-y-0.5">
                      <FormLabel className="text-tandoor-platinum">Use Percentage</FormLabel>
                      <FormDescription className="text-tandoor-platinum/60">
                        {watchAction === 'increase' ? 'Increase' : 'Decrease'} prices by percentage instead of fixed amount
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-tandoor-red"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            
            {/* Value */}
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-tandoor-platinum">
                    {watchAction === 'set' ? 'New Price Value' : 
                     watchPercentage ? 'Percentage Value' : 'Amount Value'}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tandoor-platinum/60">
                        {watchPercentage ? '%' : '£'}
                      </span>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="bg-tandoor-black border-tandoor-red/20 text-tandoor-platinum pl-8"
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-tandoor-platinum/60">
                    {watchAction === 'set' && 'The exact price value to set'}
                    {watchAction === 'increase' && watchPercentage && 'Percentage to increase prices by'}
                    {watchAction === 'increase' && !watchPercentage && 'Fixed amount to add to current prices'}
                    {watchAction === 'decrease' && watchPercentage && 'Percentage to decrease prices by'}
                    {watchAction === 'decrease' && !watchPercentage && 'Fixed amount to subtract from current prices'}
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="bg-tandoor-black border-tandoor-red/20 hover:bg-tandoor-red/20"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-tandoor-red hover:bg-tandoor-red/80 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PenLine className="mr-2 h-4 w-4" />
                    Update Prices
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
