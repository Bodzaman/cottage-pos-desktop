

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import brain from 'brain';
import { Save } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';

export interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentDesign: any;
  onTemplateSaved?: () => void;
}

export const SaveTemplateDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  currentDesign,
  onTemplateSaved
}) => {
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setIsSaving(true);
    try {
      const response = await brain.create_receipt_template({
        name: templateName.trim(),
        description: description.trim(),
        sections: currentDesign.sections || [],
        settings: currentDesign.settings || {}
      });

      if (response.ok) {
        toast.success(`Template "${templateName}" saved successfully!`);
        setTemplateName('');
        setDescription('');
        onClose();
        onTemplateSaved?.();
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      console.error('Save template error:', error);
      toast.error('Failed to save template. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setTemplateName('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" style={{ backgroundColor: QSAITheme.background.secondary }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: QSAITheme.text.primary }}>
            <Save className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
            Save Template
          </DialogTitle>
          <DialogDescription style={{ color: QSAITheme.text.secondary }}>
            Save your current receipt design as a reusable template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="templateName" style={{ color: QSAITheme.text.primary }}>
              Template Name *
            </Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Dine In Receipt v1"
              style={{
                backgroundColor: QSAITheme.background.primary,
                color: QSAITheme.text.primary,
                border: `1px solid ${QSAITheme.border.primary}`
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" style={{ color: QSAITheme.text.primary }}>
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template..."
              rows={3}
              style={{
                backgroundColor: QSAITheme.background.primary,
                color: QSAITheme.text.primary,
                border: `1px solid ${QSAITheme.border.primary}`
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            style={{
              backgroundColor: 'transparent',
              color: QSAITheme.text.secondary,
              border: `1px solid ${QSAITheme.border.primary}`
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !templateName.trim()}
            style={{
              backgroundColor: QSAITheme.purple.primary,
              color: QSAITheme.text.primary,
              border: 'none'
            }}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
