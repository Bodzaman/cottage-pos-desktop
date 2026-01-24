import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Save, 
  Loader2, 
  Database, 
  Settings, 
  HelpCircle, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Wrench,
  Edit3,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { colors, cardStyle } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';
// Local type definitions for corpus and tool creation
interface CorpusTemplate {
  type: 'faq' | 'promotions' | 'custom';
  name: string;
  description?: string;
  initial_content?: string;
}

interface ToolParameterCreate {
  name: string;
  location: string;
  schema: { type: string };
  required: boolean;
  value?: string;
}

interface ToolDefinition {
  modelToolName: string;
  description: string;
  dynamicParameters: ToolParameterCreate[];
  staticParameters: ToolParameterCreate[];
  automaticParameters: ToolParameterCreate[];
  http: {
    baseUrlPattern: string;
    httpMethod: string;
  };
}

interface ToolCreate {
  name: string;
  definition: ToolDefinition;
}

interface UltravoxTool {
  id: string;
  name: string;
  description: string;
  definition: any;
  createdAt?: string;
  updatedAt?: string;
}

interface CorpusToolCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTool?: UltravoxTool | null;
  mode?: 'create' | 'edit';
}

const CORPUS_TEMPLATES = [
  {
    type: 'faq' as const,
    icon: HelpCircle,
    title: 'FAQ Corpus',
    description: 'Frequently asked questions about the restaurant, policies, and services',
    example: 'Opening hours, dietary requirements, delivery information, etc.'
  },
  {
    type: 'promotions' as const,
    icon: Calendar,
    title: 'Promotions Corpus',
    description: 'Current promotions, special deals, and seasonal offers',
    example: 'Early bird specials, family meals, student discounts, etc.'
  },
  {
    type: 'custom' as const,
    icon: Database,
    title: 'Custom Corpus',
    description: 'Create a custom corpus with your own content',
    example: 'Custom knowledge base for specific business needs'
  }
];

const TOOL_PARAMETER_LOCATIONS = [
  { value: 'query', label: 'Query Parameter' },
  { value: 'header', label: 'Header' },
  { value: 'body', label: 'Request Body' }
];

const HTTP_METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'PATCH', label: 'PATCH' }
];

export function CorpusToolCreationForm({ isOpen, onClose, onSuccess, editingTool, mode = 'create' }: CorpusToolCreationFormProps) {
  const [activeTab, setActiveTab] = useState('corpus');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Corpus form state
  const [corpusForm, setCorpusForm] = useState({
    selectedTemplate: '',
    name: '',
    description: '',
    initialContent: ''
  });

  // Tool form state
  const [toolForm, setToolForm] = useState({
    name: '',
    modelToolName: '',
    description: '',
    baseUrl: '',
    httpMethod: 'GET' as const,
    dynamicParameters: [] as ToolParameterCreate[],
    staticParameters: [] as ToolParameterCreate[],
    automaticParameters: [] as ToolParameterCreate[]
  });

  // Load templates on mount and handle editing
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      if (mode === 'edit' && editingTool) {
        populateFormForEditing(editingTool);
        setActiveTab('tool'); // Switch to tool tab for editing
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, editingTool]);

  const populateFormForEditing = (tool: UltravoxTool) => {
    const def = tool.definition || {};
    setToolForm({
      name: tool.name,
      modelToolName: def.modelToolName || '',
      description: tool.description || '',
      baseUrl: def.http?.baseUrlPattern || '',
      httpMethod: def.http?.httpMethod || 'GET',
      dynamicParameters: def.dynamicParameters || [],
      staticParameters: def.staticParameters || [],
      automaticParameters: def.automaticParameters || []
    });
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await (brain as any).get_templates();
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates || []);
      } else {
        throw new Error(data.message || 'Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load corpus templates');
      // Use fallback templates
      setTemplates(CORPUS_TEMPLATES);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const validateForm = (type: 'corpus' | 'tool') => {
    const newErrors: Record<string, string> = {};
    
    if (type === 'corpus') {
      if (!corpusForm.selectedTemplate) {
        newErrors.template = 'Please select a template';
      }
      if (!corpusForm.name.trim()) {
        newErrors.corpusName = 'Corpus name is required';
      }
      if (corpusForm.name.length > 100) {
        newErrors.corpusName = 'Corpus name must be 100 characters or less';
      }
    }
    
    if (type === 'tool') {
      if (!toolForm.name.trim()) {
        newErrors.toolName = 'Tool name is required';
      }
      if (!toolForm.modelToolName.trim()) {
        newErrors.modelToolName = 'Model tool name is required';
      }
      if (!toolForm.description.trim()) {
        newErrors.toolDescription = 'Tool description is required';
      }
      if (!toolForm.baseUrl.trim()) {
        newErrors.baseUrl = 'Base URL is required';
      }
      if (toolForm.baseUrl && !isValidUrl(toolForm.baseUrl)) {
        newErrors.baseUrl = 'Please enter a valid URL';
      }
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(toolForm.modelToolName)) {
        newErrors.modelToolName = 'Model tool name must be a valid identifier (letters, numbers, underscores only)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleTemplateSelect = (templateType: string) => {
    const template = templates.find(t => t.type === templateType) || CORPUS_TEMPLATES.find(t => t.type === templateType);
    if (template) {
      setCorpusForm({
        selectedTemplate: templateType,
        name: template.title || template.name || '',
        description: template.description || '',
        initialContent: template.initial_content || template.example || ''
      });
      // Clear any previous errors
      setErrors(prev => ({ ...prev, template: '', corpusName: '' }));
    }
  };

  const createCorpus = async () => {
    if (!validateForm('corpus')) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);
    try {
      const templateData: CorpusTemplate = {
        type: corpusForm.selectedTemplate as 'faq' | 'promotions' | 'custom',
        name: corpusForm.name.trim(),
        description: corpusForm.description.trim() || undefined,
        initial_content: corpusForm.initialContent.trim() || undefined
      };

      const response = await (brain as any).create_corpus_from_template(templateData);
      const data = await response.json();

      if (data.success) {
        toast.success(`Corpus "${corpusForm.name}" created successfully`);
        resetForm();
        onSuccess();
        onClose();
      } else {
        throw new Error(data.message || 'Failed to create corpus');
      }
    } catch (error) {
      console.error('Error creating corpus:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create corpus: ${errorMessage}`);
      
      // Set specific error if it's a validation error
      if (errorMessage.includes('name already exists')) {
        setErrors(prev => ({ ...prev, corpusName: 'A corpus with this name already exists' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const addParameter = (type: 'dynamicParameters' | 'staticParameters' | 'automaticParameters') => {
    const newParam: ToolParameterCreate = {
      name: '',
      location: 'query',
      schema: { type: 'string' },
      required: false,
      value: undefined
    };

    setToolForm(prev => ({
      ...prev,
      [type]: [...prev[type], newParam]
    }));
  };

  const removeParameter = (type: 'dynamicParameters' | 'staticParameters' | 'automaticParameters', index: number) => {
    setToolForm(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const updateParameter = (
    type: 'dynamicParameters' | 'staticParameters' | 'automaticParameters',
    index: number,
    field: keyof ToolParameterCreate,
    value: any
  ) => {
    setToolForm(prev => ({
      ...prev,
      [type]: prev[type].map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  const createOrUpdateTool = async () => {
    if (!validateForm('tool')) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);
    try {
      const toolDefinition: ToolDefinition = {
        modelToolName: toolForm.modelToolName.trim(),
        description: toolForm.description.trim(),
        dynamicParameters: toolForm.dynamicParameters,
        staticParameters: toolForm.staticParameters,
        automaticParameters: toolForm.automaticParameters,
        http: {
          baseUrlPattern: toolForm.baseUrl.trim(),
          httpMethod: toolForm.httpMethod
        }
      };

      let response;
      let data;
      
      if (mode === 'edit' && editingTool) {
        // Update existing tool
        const updateData = {
          name: toolForm.name.trim(),
          definition: toolDefinition
        };
        response = await (brain as any).update_tool({ toolId: editingTool.id }, updateData);
        data = await response.json();
        
        if (data.success) {
          toast.success(`Tool "${toolForm.name}" updated successfully`);
        } else {
          throw new Error(data.message || 'Failed to update tool');
        }
      } else {
        // Create new tool
        const toolData: ToolCreate = {
          name: toolForm.name.trim(),
          definition: toolDefinition
        };

        response = await (brain as any).create_tool(toolData);
        data = await response.json();
        
        if (data.success) {
          toast.success(`Tool "${toolForm.name}" created successfully`);
        } else {
          throw new Error(data.message || 'Failed to create tool');
        }
      }
      
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} tool:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} tool: ${errorMessage}`);
      
      // Set specific errors if validation errors
      if (errorMessage.includes('name already exists')) {
        setErrors(prev => ({ ...prev, toolName: 'A tool with this name already exists' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCorpusForm({
      selectedTemplate: '',
      name: '',
      description: '',
      initialContent: ''
    });
    setToolForm({
      name: '',
      modelToolName: '',
      description: '',
      baseUrl: '',
      httpMethod: 'GET',
      dynamicParameters: [],
      staticParameters: [],
      automaticParameters: []
    });
    setErrors({});
  };

  const renderParameterSection = (
    title: string,
    description: string,
    type: 'dynamicParameters' | 'staticParameters' | 'automaticParameters',
    parameters: ToolParameterCreate[]
  ) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-white font-medium">{title}</h4>
          <p className="text-sm" style={{ color: colors.text.secondary }}>{description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addParameter(type)}
          className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {parameters.map((param, index) => (
        <Card key={index} style={{ ...cardStyle, backgroundColor: 'rgba(30, 30, 30, 0.5)' }}>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-white text-xs">Parameter Name</Label>
                <Input
                  value={param.name}
                  onChange={(e) => updateParameter(type, index, 'name', e.target.value)}
                  placeholder="e.g., item_id"
                  className="bg-[rgba(40,40,40,0.5)] border-[rgba(124,93,250,0.3)] text-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white text-xs">Location</Label>
                <Select 
                  value={param.location} 
                  onValueChange={(value) => updateParameter(type, index, 'location', value)}
                >
                  <SelectTrigger className="bg-[rgba(40,40,40,0.5)] border-[rgba(124,93,250,0.3)] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[rgba(124,93,250,0.3)]">
                    {TOOL_PARAMETER_LOCATIONS.map(loc => (
                      <SelectItem key={loc.value} value={loc.value} className="text-white">
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {type === 'staticParameters' && (
              <div className="space-y-1">
                <Label className="text-white text-xs">Static Value</Label>
                <Input
                  value={param.value || ''}
                  onChange={(e) => updateParameter(type, index, 'value', e.target.value)}
                  placeholder="Static value for this parameter"
                  className="bg-[rgba(40,40,40,0.5)] border-[rgba(124,93,250,0.3)] text-white text-sm"
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={param.required}
                  onChange={(e) => updateParameter(type, index, 'required', e.target.checked)}
                  className="w-4 h-4"
                />
                <Label className="text-white text-xs">Required</Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeParameter(type, index)}
                className="text-red-400 hover:bg-red-400/10 p-1 h-auto"
              >
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card 
        className="w-full max-w-4xl max-h-[90dvh] overflow-hidden"
        style={{
          ...cardStyle,
          borderColor: 'rgba(124, 93, 250, 0.3)',
          background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(26, 26, 26, 0.98) 100%)'
        }}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl">
              {mode === 'edit' ? `Edit Tool: ${editingTool?.name}` : 'Create New Corpus Tool'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90dvh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[rgba(30,30,30,0.5)]">
              <TabsTrigger 
                value="corpus" 
                disabled={mode === 'edit'}
                className="data-[state=active]:bg-[rgba(124,93,250,0.8)] data-[state=active]:text-white text-[#BBC3E1] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Database className="h-4 w-4 mr-2" />
                Create Corpus
              </TabsTrigger>
              <TabsTrigger 
                value="tool" 
                className="data-[state=active]:bg-[rgba(124,93,250,0.8)] data-[state=active]:text-white text-[#BBC3E1]"
              >
                <Wrench className="h-4 w-4 mr-2" />
                {mode === 'edit' ? 'Edit Tool' : 'Create Tool'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="corpus" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Select Corpus Template</h3>
                
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.brand.purpleLight }} />
                    <span className="ml-2 text-white">Loading templates...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(templates.length > 0 ? templates : CORPUS_TEMPLATES).map((template) => {
                      const Icon = template.icon || (CORPUS_TEMPLATES.find(t => t.type === template.type)?.icon) || Database;
                      const isSelected = corpusForm.selectedTemplate === template.type;
                      
                      return (
                        <Card
                          key={template.type}
                          className={`cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-[rgba(124,93,250,0.8)]' : ''}`}
                          style={{
                            ...cardStyle,
                            backgroundColor: isSelected ? 'rgba(124, 93, 250, 0.1)' : 'rgba(30, 30, 30, 0.5)',
                            borderColor: isSelected ? 'rgba(124, 93, 250, 0.8)' : 'rgba(124, 93, 250, 0.3)'
                          }}
                          onClick={() => handleTemplateSelect(template.type)}
                        >
                          <CardContent className="p-4 text-center space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center" style={{
                              backgroundColor: 'rgba(124, 93, 250, 0.2)'
                            }}>
                              <Icon className="h-6 w-6" style={{ color: colors.brand.purpleLight }} />
                            </div>
                            <div>
                              <h4 className="text-white font-medium">{template.title || template.name}</h4>
                              <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                                {template.description}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 mx-auto" style={{ color: globalColors.status.success }} />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {corpusForm.selectedTemplate && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Configure Corpus</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="corpus-name" className="text-white">Corpus Name *</Label>
                      <Input
                        id="corpus-name"
                        value={corpusForm.name}
                        onChange={(e) => {
                          setCorpusForm(prev => ({ ...prev, name: e.target.value }));
                          setErrors(prev => ({ ...prev, corpusName: '' }));
                        }}
                        placeholder="Enter corpus name"
                        className={`bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white ${
                          errors.corpusName ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.corpusName && (
                        <p className="text-red-400 text-sm flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.corpusName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="corpus-description" className="text-white">Description</Label>
                      <Input
                        id="corpus-description"
                        value={corpusForm.description}
                        onChange={(e) => setCorpusForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description"
                        className="bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="corpus-content" className="text-white">Initial Content</Label>
                    <Textarea
                      id="corpus-content"
                      value={corpusForm.initialContent}
                      onChange={(e) => setCorpusForm(prev => ({ ...prev, initialContent: e.target.value }))}
                      placeholder="Enter initial content for the corpus..."
                      rows={8}
                      className="bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={loading}
                      className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createCorpus}
                      disabled={loading || !corpusForm.name.trim() || !corpusForm.selectedTemplate}
                      className="bg-[rgba(124,93,250,0.8)] hover:bg-[rgba(124,93,250,1)] text-white disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {loading ? 'Creating...' : 'Create Corpus'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="tool" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basic Tool Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tool-name" className="text-white">Tool Name *</Label>
                    <Input
                      id="tool-name"
                      value={toolForm.name}
                      onChange={(e) => {
                        setToolForm(prev => ({ ...prev, name: e.target.value }));
                        setErrors(prev => ({ ...prev, toolName: '' }));
                      }}
                      placeholder="e.g., Order Status Checker"
                      className={`bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white ${
                        errors.toolName ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.toolName && (
                      <p className="text-red-400 text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.toolName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model-tool-name" className="text-white">Model Tool Name *</Label>
                    <Input
                      id="model-tool-name"
                      value={toolForm.modelToolName}
                      onChange={(e) => {
                        setToolForm(prev => ({ ...prev, modelToolName: e.target.value }));
                        setErrors(prev => ({ ...prev, modelToolName: '' }));
                      }}
                      placeholder="e.g., check_order_status"
                      className={`bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white ${
                        errors.modelToolName ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.modelToolName && (
                      <p className="text-red-400 text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.modelToolName}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tool-description" className="text-white">Description *</Label>
                  <Textarea
                    id="tool-description"
                    value={toolForm.description}
                    onChange={(e) => {
                      setToolForm(prev => ({ ...prev, description: e.target.value }));
                      setErrors(prev => ({ ...prev, toolDescription: '' }));
                    }}
                    placeholder="Describe what this tool does..."
                    rows={3}
                    className={`bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white ${
                      errors.toolDescription ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.toolDescription && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.toolDescription}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base-url" className="text-white">Base URL *</Label>
                    <Input
                      id="base-url"
                      value={toolForm.baseUrl}
                      onChange={(e) => {
                        setToolForm(prev => ({ ...prev, baseUrl: e.target.value }));
                        setErrors(prev => ({ ...prev, baseUrl: '' }));
                      }}
                      placeholder="https://api.example.com/orders"
                      className={`bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white ${
                        errors.baseUrl ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.baseUrl && (
                      <p className="text-red-400 text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.baseUrl}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="http-method" className="text-white">HTTP Method</Label>
                    <Select 
                      value={toolForm.httpMethod} 
                      onValueChange={(value) => setToolForm(prev => ({ ...prev, httpMethod: value as any }))}
                    >
                      <SelectTrigger className="bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-[rgba(124,93,250,0.3)]">
                        {HTTP_METHODS.map(method => (
                          <SelectItem key={method.value} value={method.value} className="text-white">
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Tool Parameters</h3>
                
                {renderParameterSection(
                  'Dynamic Parameters',
                  'Parameters that the model provides at runtime',
                  'dynamicParameters',
                  toolForm.dynamicParameters
                )}
                
                {renderParameterSection(
                  'Static Parameters',
                  'Fixed parameters with predefined values',
                  'staticParameters',
                  toolForm.staticParameters
                )}
                
                {renderParameterSection(
                  'Automatic Parameters',
                  'System-injected parameters (e.g., authentication)',
                  'automaticParameters',
                  toolForm.automaticParameters
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createOrUpdateTool}
                  disabled={loading || !toolForm.name.trim() || !toolForm.modelToolName.trim() || !toolForm.description.trim() || !toolForm.baseUrl.trim()}
                  className="bg-[rgba(124,93,250,0.8)] hover:bg-[rgba(124,93,250,1)] text-white disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : mode === 'edit' ? (
                    <Edit3 className="h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {loading 
                    ? (mode === 'edit' ? 'Updating...' : 'Creating...') 
                    : (mode === 'edit' ? 'Update Tool' : 'Create Tool')
                  }
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}