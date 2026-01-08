import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  AVAILABLE_TEMPLATES, 
  TemplateSet, 
  CategoryTemplate,
  CategoryMapping,
  suggestCategoryMappings,
  applyTemplateStructure
} from '../utils/menuTemplates';
import { Category } from '../utils/menuTypes';
import { 
  Layout, 
  ListTree, 
  Wand2, 
  Check, 
  X, 
  ArrowRight, 
  Info,
  AlertTriangle,
  Plus
} from 'lucide-react';

interface TemplateManagerProps {
  categories: Category[];
  onApplyTemplate: (result: any) => Promise<void>;
  onClose: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  categories,
  onApplyTemplate,
  onClose
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSet | null>(null);
  const [mappings, setMappings] = useState<CategoryMapping[]>([]);
  const [createMissing, setCreateMissing] = useState(true);
  const [preserveCustomNames, setPreserveCustomNames] = useState(false);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState(false);

  // Update template and mappings when selection changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = AVAILABLE_TEMPLATES.find(t => t.id === selectedTemplateId);
      setSelectedTemplate(template || null);
      
      if (template) {
        // Get non-protein categories only
        const regularCategories = categories.filter(cat => !cat.is_protein_type);
        const suggestedMappings = suggestCategoryMappings(regularCategories, selectedTemplateId);
        setMappings(suggestedMappings);
        
        // Initialize custom names
        const initialCustomNames: Record<string, string> = {};
        suggestedMappings.forEach(mapping => {
          initialCustomNames[mapping.existingCategoryId] = mapping.existingCategoryName;
        });
        setCustomNames(initialCustomNames);
      }
    } else {
      setSelectedTemplate(null);
      setMappings([]);
      setCustomNames({});
    }
  }, [selectedTemplateId, categories]);

  const handleMappingChange = (existingCategoryId: string, templateCategoryId: string) => {
    setMappings(prev => {
      const updated = prev.filter(m => m.existingCategoryId !== existingCategoryId);
      
      if (templateCategoryId && templateCategoryId !== 'none' && selectedTemplate) {
        const templateCategory = selectedTemplate.categories.find(cat => cat.id === templateCategoryId);
        if (templateCategory) {
          const existingCategory = categories.find(cat => cat.id === existingCategoryId);
          if (existingCategory) {
            updated.push({
              existingCategoryId,
              existingCategoryName: existingCategory.name,
              templateCategoryId,
              templateCategoryName: templateCategory.name,
              confidence: 'medium'
            });
          }
        }
      }
      
      return updated;
    });
  };

  const handleCustomNameChange = (categoryId: string, newName: string) => {
    setCustomNames(prev => ({
      ...prev,
      [categoryId]: newName
    }));
    
    // Update mapping custom name
    setMappings(prev => prev.map(mapping => 
      mapping.existingCategoryId === categoryId 
        ? { ...mapping, customName: newName }
        : mapping
    ));
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      setIsApplying(true);
      
      // Apply custom names to mappings
      const updatedMappings = mappings.map(mapping => ({
        ...mapping,
        customName: preserveCustomNames ? customNames[mapping.existingCategoryId] : undefined
      }));
      
      const result = applyTemplateStructure(
        categories.filter(cat => !cat.is_protein_type),
        updatedMappings,
        selectedTemplateId,
        { createMissing, preserveCustomNames }
      );
      
      await onApplyTemplate(result);
      toast.success(`Applied ${selectedTemplate.name} template successfully`);
      onClose();
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template');
    } finally {
      setIsApplying(false);
    }
  };

  const getMappedTemplateCategories = () => {
    if (!selectedTemplate) return new Set();
    return new Set(mappings.map(m => m.templateCategoryId));
  };

  const getUnmappedTemplateCategories = () => {
    if (!selectedTemplate) return [];
    const mapped = getMappedTemplateCategories();
    return selectedTemplate.categories.filter(cat => !mapped.has(cat.id));
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Choose Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category template" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_TEMPLATES.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedTemplate && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">{selectedTemplate.description}</p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.categories.map(cat => (
                  <Badge key={cat.id} variant="secondary" className="text-xs">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Mapping */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Map Your Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.filter(cat => !cat.is_protein_type).map(category => {
              const mapping = mappings.find(m => m.existingCategoryId === category.id);
              const mappedTemplateId = mapping?.templateCategoryId || '';
              
              return (
                <div key={category.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{category.name}</div>
                    {mapping && (
                      <Badge className={`mt-1 text-xs ${getConfidenceColor(mapping.confidence)}`}>
                        {mapping.confidence} confidence
                      </Badge>
                    )}
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  
                  <div className="flex-1">
                    <Select value={mappedTemplateId} onValueChange={(value) => handleMappingChange(category.id, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No mapping</SelectItem>
                        {selectedTemplate.categories.map(templateCat => (
                          <SelectItem key={templateCat.id} value={templateCat.id}>
                            {templateCat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {preserveCustomNames && mapping && (
                    <div className="flex-1">
                      <Input
                        placeholder="Custom name"
                        value={customNames[category.id] || ''}
                        onChange={(e) => handleCustomNameChange(category.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Show unmapped template categories */}
            {getUnmappedTemplateCategories().length > 0 && (
              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-800">Unmapped Template Categories</span>
                </div>
                <div className="space-y-2">
                  {getUnmappedTemplateCategories().map(cat => (
                    <Badge key={cat.id} variant="outline" className="mr-2">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
                {createMissing && (
                  <p className="text-sm text-amber-700 mt-2">
                    These categories will be created automatically.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Options */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Template Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="create-missing">Create Missing Categories</Label>
                <p className="text-sm text-gray-600">Automatically create unmapped template categories</p>
              </div>
              <Switch
                id="create-missing"
                checked={createMissing}
                onCheckedChange={setCreateMissing}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="preserve-names">Preserve Custom Names</Label>
                <p className="text-sm text-gray-600">Keep your category names instead of template names</p>
              </div>
              <Switch
                id="preserve-names"
                checked={preserveCustomNames}
                onCheckedChange={setPreserveCustomNames}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleApplyTemplate} 
          disabled={!selectedTemplate || isApplying}
          className="min-w-32"
        >
          {isApplying ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Applying...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Apply Template
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TemplateManager;