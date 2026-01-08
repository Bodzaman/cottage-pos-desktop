

import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCheck, RefreshCw, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { apiClient } from 'app';
import StrictDialog from './StrictDialog';

interface QSAIButtonProps {
  fieldName: string;
  currentValue: string;
  itemName: string;
  itemDescription?: string;
  onUpdate: (value: string) => void;
  context?: Record<string, any>;
  variant?: 'ghost' | 'outline' | 'link';
  size?: 'sm' | 'icon' | 'default';
  iconOnly?: boolean;
  buttonText?: string;
}

  // Need to map field names to the API expected field types
  const fieldTypeMap: Record<string, string> = {
    description: 'item_description',
    menu_item_description: 'item_description',
    long_description: 'item_description',
    name: 'item_name'
  };

export default function QSAIButton({
  fieldName,
  currentValue,
  itemName,
  itemDescription = '',
  onUpdate,
  context = {},
  variant = 'ghost',
  size = 'sm',
  iconOnly = false,
  buttonText = 'QSAI'
}: QSAIButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [editedValue, setEditedValue] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState('suggestions');
  
  const generateSuggestions = async () => {
    setLoading(true);
    try {
      // Map the field name to the expected API field type
      const fieldType = fieldTypeMap[fieldName] || 'item_description';
      
      // Generate a temporary menu_item_id if none exists in context
      const menuItemId = context.menu_item_id || 'temp-' + Date.now();
      
      // Add customizations data to the context if available
      const customizationsData = context.customizations || [];
      
      const response = await apiClient.generate_ai_content_suggestion({
        menu_item_id: menuItemId,
        name: itemName,
        description: itemDescription || '',
        categories: context.categories || [],
        field_type: fieldType,
        // Include customizations data if available
        customizations: customizationsData
      });
      
      const data = await response.json();
      
      if (data.voice_description || data.spoken_alias || data.status === 'success') {
        // Format suggestions based on field type
        let suggestionResults = [];
        
        if (fieldName === 'name') {
          // Use spoken_alias for name field
          suggestionResults = data.spoken_alias || [];
        } else if (fieldName === 'menu_item_description' || fieldName === 'description') {
          // Use voice_description for description fields, split into paragraphs
          const desc = data.voice_description || '';
          suggestionResults = [desc];
        } else if (fieldName === 'long_description') {
          // Generate longer content from voice_description
          const desc = data.voice_description || '';
          suggestionResults = [desc];
        } else {
          // For other fields, use the first suggestion or empty array
          suggestionResults = data.suggestions || [];
        }
        
        setSuggestions(suggestionResults);
        setReasoning(data.reasoning || '');
        setSelectedTab('suggestions');
      } else {
        toast.error('Failed to generate suggestions');
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpen = () => {
    setOpen(true);
    // Clear previous state
    setSuggestions([]);
    setReasoning('');
    // Generate new suggestions
    generateSuggestions();
  };
  
  const handleAccept = (suggestion: string) => {
    onUpdate(suggestion);
    setOpen(false);
    toast.success('Content applied successfully');
  };
  
  const handleEdit = (suggestion: string) => {
    setEditedValue(suggestion);
    setSelectedTab('edit');
  };
  
  const handleSaveEdit = () => {
    onUpdate(editedValue);
    setOpen(false);
    toast.success('Edited content applied successfully');
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={handleOpen} 
              variant={variant === 'ghost' ? 'default' : variant}
              size={size === 'sm' ? 'default' : size}
              className={`ai-enhance-button relative overflow-hidden ${loading ? 'ai-processing' : ''} transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(159,133,255,0.7)] bg-[#7C5DFA40]`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#7C5DFA60] to-[#7C5DFA80] backdrop-blur-[8px] rounded-md z-0 border-2 border-white/30"></div>
              {loading && (
                <div className="absolute inset-0 border-2 border-[#9F85FF] rounded-md z-0 animate-pulse shadow-[0_0_20px_rgba(159,133,255,0.8)]" 
                  style={{ boxShadow: '0 0 20px rgba(159,133,255,0.8), inset 0 0 15px rgba(159,133,255,0.6)' }}
                ></div>
              )}
              <div className="relative z-10 flex items-center justify-center">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Sparkles className="h-5 w-5 text-white animate-pulse" style={{ animationDuration: '1.5s' }} />
                )}
                {!iconOnly && <span className="ml-2 font-medium text-white">{buttonText}</span>}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={5} align="center" className="bg-[#2A2A2A] border-2 border-white/30 shadow-lg shadow-[#7C5DFA20] text-white font-medium max-w-[200px] z-50">
            <p>AI content generator</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <StrictDialog open={open} onOpenChange={setOpen}>
        <div className="sm:max-w-[600px] bg-[#121212] text-white border-[rgba(124,93,250,0.2)]">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2 text-[#7C5DFA]">
               <Sparkles className="h-5 w-5 text-[#7C5DFA]" />
               AI Content Suggestions
             </DialogTitle>
           </DialogHeader>
           
           <Tabs value={selectedTab} onValueChange={setSelectedTab}>
             <TabsList className="grid w-full grid-cols-2">
               <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
               <TabsTrigger value="edit">Edit</TabsTrigger>
             </TabsList>
             
             <TabsContent value="suggestions" className="pt-2">
               {loading ? (
                 <div className="flex flex-col items-center justify-center py-8">
                   <Loader2 className="h-6 w-6 animate-spin text-[#7C5DFA]" />
                   <p className="mt-2 text-sm text-muted-foreground">Generating suggestions...</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {suggestions.map((s, idx) => (
                     <Card key={idx} className="bg-[#1a1a1a] border-[rgba(124,93,250,0.2)]">
                       <CardContent className="p-3 flex items-start justify-between gap-3">
                         <div className="text-sm whitespace-pre-wrap">{s}</div>
                         <div className="flex gap-2">
                           <Button size="sm" variant="secondary" onClick={() => handleUseSuggestion(s)}>
                             Use
                           </Button>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               )}
             </TabsContent>
           </Tabs>
           
           <DialogFooter className="sm:justify-start">
             <div className="text-xs text-muted-foreground">
               Powered by OpenAI's GPT models
             </div>
           </DialogFooter>
        </div>
      </StrictDialog>
    </>
  );
}
