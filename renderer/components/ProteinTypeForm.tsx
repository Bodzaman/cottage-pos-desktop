import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AdminInput } from '../components/AdminInput';
import { OrderNumberInput } from '../components/OrderNumberInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '../utils/supabaseClient';
import { menuKeys } from '../utils/menuQueries';
import { useQueryClient } from '@tanstack/react-query';

// Schema for protein type form validation
const proteinTypeSchema = z.object({
  name: z.string().min(2, { message: 'Protein type name must be at least 2 characters' }),
  display_order: z.coerce.number().int().nonnegative().default(0),
});

type ProteinTypeFormValues = z.infer<typeof proteinTypeSchema>;

interface ProteinTypeFormProps {
  onSuccess: () => void;
  initialData?: ProteinTypeFormValues & { id?: string };
  isEditing?: boolean;
}

export default function ProteinTypeForm({ onSuccess, initialData, isEditing = false }: ProteinTypeFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // React Query: Query client for cache invalidation
  const queryClient = useQueryClient();

  const form = useForm<ProteinTypeFormValues>({
    resolver: zodResolver(proteinTypeSchema),
    defaultValues: initialData || {
      name: '',
      display_order: 0,
    }
  });

  const onSubmit = async (data: ProteinTypeFormValues) => {
    setIsLoading(true);
    try {
      if (isEditing && initialData?.id) {
        // Update existing protein type
        const { error } = await supabase
          .from('menu_protein_types')
          .update(data)
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success('Protein type updated successfully');
        
        // React Query: Invalidate protein types cache
        queryClient.invalidateQueries({ queryKey: menuKeys.proteinTypes() });
      } else {
        // Create new protein type
        const { error } = await supabase
          .from('menu_protein_types')
          .insert([data]);

        if (error) throw error;
        toast.success('Protein type created successfully');
        
        // React Query: Invalidate protein types cache
        queryClient.invalidateQueries({ queryKey: menuKeys.proteinTypes() });
      }

      // Reset form and close dialog
      form.reset();
      setIsOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error('Error saving protein type: ' + error.message);
      console.error('Error saving protein type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        ) : (
          <Button>
            + Add Protein Type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[rgba(21, 25, 42, 0.95)] text-white border-[rgba(124, 93, 250, 0.2)] max-w-md backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-[#7C5DFA]">
            {isEditing ? 'Edit Protein Type' : 'Add New Protein Type'}
          </DialogTitle>
          <DialogDescription className="text-[#BBC3E1]">
            {isEditing ? 'Update the protein type details below.' : 'Add a new protein or size option for menu items.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#FFFFFF]">Name</FormLabel>
                  <FormControl>
                    <AdminInput 
                      placeholder="e.g. Chicken, Lamb, Large, Small" 
                      {...field} 
                      variant="purple"
                    />
                  </FormControl>
                  <FormDescription className="text-[#BBC3E1]">
                    The name of the protein or size option.
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="display_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#FFFFFF]">Display Order</FormLabel>
                  <FormControl>
                    <OrderNumberInput
                      value={field.value || 0}
                      onChange={field.onChange}
                      placeholder="Select display order..."
                      helpText="Protein types are sorted by this number (lower numbers first)."
                    />
                  </FormControl>
                  <FormDescription className="text-[#BBC3E1]">
                    Protein types are sorted by this number (lower numbers first).
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-[#7C5DFA] hover:bg-[#9277FF] text-white w-full mt-2 transition-colors duration-200"
              >
                {isLoading ? 'Saving...' : isEditing ? 'Update Protein Type' : 'Add Protein Type'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
