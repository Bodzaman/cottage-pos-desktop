import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { ThermalTemplate } from '../utils/thermalTypes';
import { 
  Eye, 
  Save, 
  RotateCcw, 
  Copy, 
  Trash2, 
  FileText,
  Printer,
  Cog,
  Plus,
  Info
} from 'lucide-react';
import { colors, cardStyle } from '../utils/designSystem';

// Template types
interface PrintTemplateSettings {
  paper_width: number;
  font_size: string;
  font_weight: string;
  text_align: string;
  line_spacing: number;
  cut_paper: boolean;
  open_drawer: boolean;
  beep_count: number;
}

interface PrintTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: string;
  template_content: string;
  settings: PrintTemplateSettings;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateEditorProps {
  templateId?: string;
  templateType?: string;
  onSave?: (template: PrintTemplate) => void;
  onCancel?: () => void;
}

// Template variable categories with descriptions
const TEMPLATE_VARIABLES = {
  'Business Information': [
    { var: '{{business.name}}', desc: 'Restaurant name' },
    { var: '{{business.address}}', desc: 'Restaurant address' },
    { var: '{{business.phone}}', desc: 'Restaurant phone number' },
    { var: '{{business.email}}', desc: 'Restaurant email' }
  ],
  'Order Information': [
    { var: '{{order.order_id}}', desc: 'Unique order number' },
    { var: '{{order.date}}', desc: 'Order date' },
    { var: '{{order.time}}', desc: 'Order time' },
    { var: '{{order.table_number}}', desc: 'Table number (if applicable)' },
    { var: '{{order.guest_count}}', desc: 'Number of guests' },
    { var: '{{order.order_type}}', desc: 'Order type (dine-in, delivery, etc.)' },
    { var: '{{order.source}}', desc: 'Order source (POS, Online, Phone)' }
  ],
  'Customer Information': [
    { var: '{{customer.name}}', desc: 'Customer name' },
    { var: '{{customer.phone}}', desc: 'Customer phone number' },
    { var: '{{customer.email}}', desc: 'Customer email' }
  ],
  'Order Items': [
    { var: '{% for item in order.items %}', desc: 'Start loop for order items' },
    { var: '{{item.name}}', desc: 'Item name' },
    { var: '{{item.quantity}}', desc: 'Item quantity' },
    { var: '{{item.price}}', desc: 'Item price' },
    { var: '{{item.total}}', desc: 'Item total (quantity × price)' },
    { var: '{{item.variant}}', desc: 'Item variant (if any)' },
    { var: '{{item.notes}}', desc: 'Special notes for item' },
    { var: '{% endfor %}', desc: 'End loop for order items' }
  ],
  'Pricing & Totals': [
    { var: '{{order.subtotal}}', desc: 'Order subtotal' },
    { var: '{{order.tax}}', desc: 'VAT amount' },
    { var: '{{order.service_charge}}', desc: 'Service charge' },
    { var: '{{order.discount}}', desc: 'Discount amount' },
    { var: '{{order.total}}', desc: 'Final total' }
  ],
  'Payment Information': [
    { var: '{{payment.method}}', desc: 'Payment method' },
    { var: '{{payment.amount}}', desc: 'Payment amount' },
    { var: '{{payment.tip}}', desc: 'Tip amount' }
  ],
  'Formatting': [
    { var: '{{separator}}', desc: 'Horizontal line separator' },
    { var: '{{thick_separator}}', desc: 'Thick horizontal line' }
  ]
};

// Default template content for different types
const DEFAULT_TEMPLATES = {
  customer_receipt: `{{business.name}}
{{business.address}}
{{business.phone}}

{{separator}}
RECEIPT
{{separator}}

Order #: {{order.order_id}}
Date: {{order.date}}
Time: {{order.time}}
{% if order.table_number %}Table: {{order.table_number}}{% endif %}

{{separator}}
ORDER DETAILS
{{separator}}

{% for item in order.items %}
{{item.name}}
  Qty: {{item.quantity}} x £{{item.price}}
                        £{{item.total}}
{% endfor %}

{{separator}}
SUMMARY
{{separator}}

Subtotal:               £{{order.subtotal}}
VAT (20%):              £{{order.tax}}
TOTAL:                  £{{order.total}}

{{separator}}
PAYMENT
{{separator}}

Method: {{payment.method}}
Amount: £{{payment.amount}}

{{separator}}
Thank you for dining with us!
{{separator}}`,

  kitchen_copy: `=== KITCHEN COPY ===

Order #: {{order.order_id}}
Time: {{order.time}}
{% if order.table_number %}TABLE {{order.table_number}}{% endif %}

{{thick_separator}}
ORDER ITEMS
{{thick_separator}}

{% for item in order.items %}
{{item.quantity}}x {{item.name}}
{% if item.variant %}   [{{item.variant}}]{% endif %}
{% if item.notes %}
   *** {{item.notes}} ***
{% endif %}

{% endfor %}

{% if order.notes %}
{{thick_separator}}
SPECIAL INSTRUCTIONS:
{{order.notes}}
{{thick_separator}}
{% endif %}

Guest Count: {{order.guest_count}}
Order Source: {{order.source}}

{{thick_separator}}`
};

export default function TemplateEditor({ templateId, templateType = 'customer_receipt', onSave, onCancel }: TemplateEditorProps) {
  // State for template data
  const [template, setTemplate] = useState<PrintTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  // State for template settings
  const [settings, setSettings] = useState<PrintTemplateSettings>({
    paper_width: 48,
    font_size: 'normal',
    font_weight: 'normal',
    text_align: 'left',
    line_spacing: 1,
    cut_paper: true,
    open_drawer: false,
    beep_count: 0
  });
  
  // State for preview
  const [previewContent, setPreviewContent] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // State for UI
  const [activeTab, setActiveTab] = useState('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load template if editing existing one
  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else {
      // Initialize with default template for type
      setTemplateContent(DEFAULT_TEMPLATES[templateType as keyof typeof DEFAULT_TEMPLATES] || DEFAULT_TEMPLATES.customer_receipt);
      setTemplateName(`New ${templateType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    }
  }, [templateId, templateType]);

  // Auto-generate preview when content or settings change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generatePreview();
    }, 500); // Debounce preview generation
    
    return () => clearTimeout(timeoutId);
  }, [templateContent, settings]);

  const loadTemplate = async () => {
    if (!templateId) return;
    
    try {
      setIsLoading(true);
      const response = await apiClient.get_template({ templateId });
      const result = await response.json();
      
      if (result.success && result.template) {
        const tmpl = result.template;
        setTemplate(tmpl);
        setTemplateContent(tmpl.template_content);
        setTemplateName(tmpl.name);
        setTemplateDescription(tmpl.description || '');
        setSettings(tmpl.settings);
        setIsDefault(tmpl.is_default);
      } else {
        toast.error('Failed to load template');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Error loading template');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!templateContent.trim()) {
      setPreviewContent('');
      return;
    }
    
    try {
      setIsLoadingPreview(true);
      const response = await apiClient.preview_template({
        template_content: templateContent,
        settings: settings,
        sample_order_type: 'dine-in'
      });
      const result = await response.json();
      
      if (result.success) {
        setPreviewContent(result.rendered_content);
      } else {
        setPreviewContent(`Preview Error: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewContent('Error generating preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    
    if (!templateContent.trim()) {
      toast.error('Please enter template content');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const templateData = {
        name: templateName,
        description: templateDescription,
        template_type: templateType,
        template_content: templateContent,
        settings: settings,
        is_default: isDefault
      };
      
      let response;
      if (templateId) {
        // Update existing template
        response = await apiClient.update_template({ templateId }, templateData);
      } else {
        // Create new template
        response = await apiClient.create_template(templateData);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(templateId ? 'Template updated successfully' : 'Template created successfully');
        if (onSave && result.template) {
          onSave(result.template);
        }
      } else {
        toast.error(result.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error saving template');
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = templateContent.substring(0, start) + variable + templateContent.substring(end);
      setTemplateContent(newContent);
      
      // Reset cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const loadDefaultTemplate = () => {
    const defaultContent = DEFAULT_TEMPLATES[templateType as keyof typeof DEFAULT_TEMPLATES];
    if (defaultContent) {
      setTemplateContent(defaultContent);
      toast.success('Default template loaded');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            {templateId ? 'Edit Template' : 'Create Template'}
          </h2>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            Design your {templateType.replace('_', ' ')} layout and formatting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Template'}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Template Basic Info */}
      <Card style={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            <div>
              <Label htmlFor="template-type">Template Type</Label>
              <Input
                id="template-type"
                value={templateType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                disabled
              />
            </div>
          </div>
          <div>
            <Label htmlFor="template-description">Description (Optional)</Label>
            <Input
              id="template-description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Brief description of this template"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is-default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
            <Label htmlFor="is-default">Set as default template for this type</Label>
          </div>
        </CardContent>
      </Card>

      {/* Main Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor & Variables */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor">Template Editor</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="settings">Print Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="space-y-4">
              <Card style={cardStyle}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Template Content</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={loadDefaultTemplate}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Load Default
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="template-content"
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    placeholder="Enter your template content here..."
                    className="min-h-[400px] font-mono text-sm"
                    style={{ 
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                      border: `1px solid ${colors.border.primary}`
                    }}
                  />
                  <div className="mt-2 text-xs" style={{ color: colors.text.secondary }}>
                    Use template variables like order total and customer name to insert dynamic data.
                    Click variables from the Variables tab to insert them.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="variables">
              <Card style={cardStyle}>
                <CardHeader>
                  <CardTitle>Available Variables</CardTitle>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    Click any variable to insert it at your cursor position
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {Object.entries(TEMPLATE_VARIABLES).map(([category, variables]) => (
                      <div key={category}>
                        <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>
                          {category}
                        </h4>
                        <div className="grid gap-2">
                          {variables.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-purple-500/10 border"
                              style={{ borderColor: colors.border.primary }}
                              onClick={() => insertVariable(item.var)}
                            >
                              <div>
                                <code className="text-sm text-purple-400">{item.var}</code>
                                <p className="text-xs" style={{ color: colors.text.secondary }}>
                                  {item.desc}
                                </p>
                              </div>
                              <Plus className="h-4 w-4" style={{ color: colors.text.secondary }} />
                            </div>
                          ))}
                        </div>
                        {category !== 'Formatting' && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card style={cardStyle}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cog className="h-5 w-5" />
                    Print Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Paper Width</Label>
                      <Select value={settings.paper_width.toString()} onValueChange={(value) => setSettings({...settings, paper_width: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="32">32 characters (2 inch)</SelectItem>
                          <SelectItem value="48">48 characters (3 inch)</SelectItem>
                          <SelectItem value="80">80 characters (4 inch)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Font Size</Label>
                      <Select value={settings.font_size} onValueChange={(value) => setSettings({...settings, font_size: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Font Weight</Label>
                      <Select value={settings.font_weight} onValueChange={(value) => setSettings({...settings, font_weight: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Text Alignment</Label>
                      <Select value={settings.text_align} onValueChange={(value) => setSettings({...settings, text_align: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.cut_paper}
                        onCheckedChange={(checked) => setSettings({...settings, cut_paper: checked})}
                      />
                      <Label>Cut paper after printing</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.open_drawer}
                        onCheckedChange={(checked) => setSettings({...settings, open_drawer: checked})}
                      />
                      <Label>Open cash drawer after printing</Label>
                    </div>
                    <div>
                      <Label>Beep Count (0-9)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="9"
                        value={settings.beep_count}
                        onChange={(e) => setSettings({...settings, beep_count: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div>
          <Card style={cardStyle}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
                {isLoadingPreview && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                )}
              </CardTitle>
              <p className="text-xs" style={{ color: colors.text.secondary }}>
                Preview updates automatically as you edit
              </p>
            </CardHeader>
            <CardContent>
              <div 
                className="bg-white text-black p-4 rounded font-mono text-xs min-h-[400px] max-h-[600px] overflow-y-auto"
                style={{
                  width: `${settings.paper_width * 8}px`, // Approximate character width
                  fontSize: settings.font_size === 'small' ? '10px' : settings.font_size === 'large' ? '14px' : '12px',
                  fontWeight: settings.font_weight,
                  textAlign: settings.text_align as any,
                  lineHeight: settings.line_spacing,
                  borderLeft: '3px solid #ddd',
                  margin: '0 auto'
                }}
              >
                {previewContent ? (
                  <pre className="whitespace-pre-wrap">{previewContent}</pre>
                ) : (
                  <div className="text-gray-400 italic">
                    {isLoadingPreview ? 'Generating preview...' : 'Preview will appear here'}
                  </div>
                )}
              </div>
              
              {/* Print Settings Summary */}
              <div className="mt-4 p-3 rounded" style={{ backgroundColor: colors.background.secondary }}>
                <div className="text-xs space-y-1" style={{ color: colors.text.secondary }}>
                  <div>Paper: {settings.paper_width} chars ({settings.paper_width === 32 ? '2"' : settings.paper_width === 48 ? '3"' : '4"'})</div>
                  <div>Font: {settings.font_size} {settings.font_weight}</div>
                  <div>Align: {settings.text_align}</div>
                  <div className="flex gap-4">
                    <span>Cut: {settings.cut_paper ? '✓' : '✗'}</span>
                    <span>Drawer: {settings.open_drawer ? '✓' : '✗'}</span>
                    <span>Beeps: {settings.beep_count}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
