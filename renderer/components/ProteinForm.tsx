

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateKitchenDisplayName } from 'utils/smartAbbreviationSystem';
import { Lightbulb } from 'lucide-react';

interface ProteinType {
  id: string;
  name: string;
  description?: string;
  short_display_name?: string;
}

interface ProteinFormProps {
  protein?: ProteinType;
  onSave: (proteinData: {
    name: string;
    description?: string;
    short_display_name?: string;
  }) => void;
  onCancel: () => void;
}

const ProteinForm: React.FC<ProteinFormProps> = ({ protein, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: protein?.name || '',
    description: protein?.description || '',
    short_display_name: protein?.short_display_name || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate smart suggestion for short display name
  const suggestedShortName = formData.name ? generateKitchenDisplayName(formData.name) : '';
  const showSuggestion = formData.name && !formData.short_display_name && suggestedShortName !== formData.name;

  const applySuggestion = () => {
    setFormData(prev => ({ ...prev, short_display_name: suggestedShortName }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Protein name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        short_display_name: formData.short_display_name.trim() || undefined
      });
    } catch (error) {
      console.error('Error saving protein:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="protein-name" className="text-white">Protein Name *</Label>
        <Input
          id="protein-name"
          value={formData.name}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, name: e.target.value }));
            setErrors(prev => ({ ...prev, name: '' }));
          }}
          placeholder="e.g., Chicken, Lamb, Prawns"
          className="bg-[#1A1A1A] border-[rgba(124,93,250,0.2)] text-white"
        />
        {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
      </div>

      {/* Short Display Name Field */}
      <div className="space-y-2">
        <Label htmlFor="protein-short-name" className="text-white">Short Display Name</Label>
        <div className="space-y-2">
          <Input
            id="protein-short-name"
            value={formData.short_display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, short_display_name: e.target.value }))}
            placeholder="Abbreviated name for kitchen receipts"
            className="bg-[#1A1A1A] border-[rgba(124,93,250,0.2)] text-white"
          />
          {showSuggestion && (
            <div className="flex items-center gap-2 p-2 bg-[rgba(124,93,250,0.1)] border border-[rgba(124,93,250,0.2)] rounded-md">
              <Lightbulb className="h-4 w-4 text-[#7C5DFA]" />
              <span className="text-sm text-gray-300">Suggested: "{suggestedShortName}"</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applySuggestion}
                className="ml-auto h-6 px-2 text-xs border-[rgba(124,93,250,0.3)] hover:bg-[rgba(124,93,250,0.2)]"
              >
                Use This
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400">
          Optional abbreviated name for thermal receipt printing. Falls back to full name if not provided.
        </p>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="protein-description" className="text-white">Description</Label>
        <Textarea
          id="protein-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Optional description for this protein type"
          className="bg-[#1A1A1A] border-[rgba(124,93,250,0.2)] text-white min-h-[80px]"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 border-[rgba(124,93,250,0.3)] hover:bg-[rgba(124,93,250,0.1)]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.name.trim()}
          className="flex-1 bg-[#7C5DFA] hover:bg-[#6B4DEA] text-white"
        >
          {isSubmitting ? 'Saving...' : protein ? 'Update Protein' : 'Create Protein'}
        </Button>
      </div>
    </form>
  );
};

export default ProteinForm;
export type { ProteinType, ProteinFormProps };
