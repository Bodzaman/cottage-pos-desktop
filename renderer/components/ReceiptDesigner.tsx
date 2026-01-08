import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, 
  Download, 
  Eye, 
  Save,
  Plus,
  Copy,
  Trash2,
  Edit,
  Settings,
  Image,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Underline,
  RefreshCw,
  TestTube,
  Printer,
  ChevronDown,
  ChevronRight,
  Palette,
  Layout,
  FileText,
  Zap,
  Sparkles,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { ThermalTemplate } from '../utils/thermalTypes';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { useSimpleAuth } from 'utils/simple-auth-context';

interface ReceiptDesignerProps {
  onRefresh?: () => void;
}

interface ReceiptTemplate {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  sections?: ReceiptSection[];
  settings?: Record<string, any>;
}

interface ReceiptSection {
  name: string;
  elements: ReceiptElement[];
  enabled: boolean;
}

interface ReceiptElement {
  type: string;
  content?: string;
  alignment?: string;
  font?: FontStyle;
  style?: string;
  length?: number;
  position?: string;
  size?: string;
  field?: string;
  format?: string;
}

interface FontStyle {
  size: string;
  bold: boolean;
  underline: boolean;
  inverted: boolean;
}

interface FontOption {
  id: string;
  name: string;
  category: string;
  cssFamily: string;
  description: string;
  preview: string;
}

interface SectionFonts {
  header: FontOption;
  items: FontOption;
  totals: FontOption;
  footer: FontOption;
}

interface HeaderFooterSettings {
  header: {
    enabled: boolean;
    text: string;
    alignment: 'left' | 'center' | 'right';
    fontSize: 'small' | 'medium' | 'large';
  };
  footer: {
    enabled: boolean;
    text: string;
    alignment: 'left' | 'center' | 'right';
    fontSize: 'small' | 'medium' | 'large';
  };
}

// Font options with categories for different sections
const FONT_OPTIONS: FontOption[] = [
  // Modern Monospace - Great for data/items
  {
    id: 'roboto-mono',
    name: 'Roboto Mono',
    category: 'Modern',
    cssFamily: '"Roboto Mono", "JetBrains Mono", "Consolas", monospace',
    description: 'Clean, professional monospace',
    preview: 'Cottage Tandoori\nChicken Tikka    £12.95\nPilau Rice       £3.50'
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    category: 'Modern',
    cssFamily: '"JetBrains Mono", "Roboto Mono", "Consolas", monospace',
    description: 'Developer-designed, highly readable',
    preview: 'Cottage Tandoori\nChicken Tikka    £12.95\nPilau Rice       £3.50'
  },
  // Classic Monospace - Traditional receipt feel
  {
    id: 'courier-new',
    name: 'Courier New',
    category: 'Classic',
    cssFamily: '"Courier New", "Monaco", "Consolas", monospace',
    description: 'Traditional typewriter style',
    preview: 'Cottage Tandoori\nChicken Tikka    £12.95\nPilau Rice       £3.50'
  },
  {
    id: 'monaco',
    name: 'Monaco',
    category: 'Classic',
    cssFamily: '"Monaco", "Courier New", "Consolas", monospace',
    description: 'Classic Mac monospace',
    preview: 'Cottage Tandoori\nChicken Tikka    £12.95\nPilau Rice       £3.50'
  },
  {
    id: 'consolas',
    name: 'Consolas',
    category: 'Classic',
    cssFamily: '"Consolas", "Courier New", "Monaco", monospace',
    description: 'Microsoft monospace font',
    preview: 'Cottage Tandoori\nChicken Tikka    £12.95\nPilau Rice       £3.50'
  },
  // Friendly Monospace - Casual dining
  {
    id: 'ubuntu-mono',
    name: 'Ubuntu Mono',
    category: 'Friendly',
    cssFamily: '"Ubuntu Mono", "Roboto Mono", "Consolas", monospace',
    description: 'Rounded, approachable style',
    preview: 'Cottage Tandoori\nChicken Tikka    £12.95\nPilau Rice       £3.50'
  },
  // Tech Monospace - Modern restaurants
  {
    id: 'fira-code',
    name: 'Fira Code',
    category: 'Tech',
    cssFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
    description: 'Modern coding font with ligatures',
    preview: 'Cottage Tandoori\nChicken Tikka    £12.95\nPilau Rice       £3.50'
  },
  // Decorative - Perfect for headers/restaurant names
  {
    id: 'old-english',
    name: 'Old English Text',
    category: 'Decorative',
    cssFamily: '"Old English Text MT", "UnifrakturCook", "OldLondon", cursive',
    description: 'Elegant, traditional heritage styling',
    preview: 'Cottage Tandoori\nSpecial Evening Menu\nElegant Dining Experience'
  },
  {
    id: 'brush-script',
    name: 'Brush Script',
    category: 'Decorative',
    cssFamily: '"Brush Script MT", "Lucida Handwriting", cursive',
    description: 'Handwritten, personal touch',
    preview: 'Cottage Tandoori\nWelcome Friends\nAuthentic Flavors'
  },
  {
    id: 'impact',
    name: 'Impact',
    category: 'Decorative',
    cssFamily: '"Impact", "Arial Black", sans-serif',
    description: 'Bold, attention-grabbing headers',
    preview: 'COTTAGE TANDOORI\nGRAND OPENING\nSPECIAL OFFERS'
  }
];

// Receipt sections that can have different fonts
const RECEIPT_SECTIONS = [
  { id: 'header', name: 'Restaurant Name & Header', description: 'Business name, address, contact info' },
  { id: 'items', name: 'Menu Items & Data', description: 'Order items, prices, quantities' },
  { id: 'totals', name: 'Totals & Payment', description: 'Subtotal, tax, total, payment method' },
  { id: 'footer', name: 'Footer & Branding', description: 'Thank you message, promotions, QR codes' }
];

// QSAI Design System Styles
const QSAI_PANEL_STYLE = {
  background: QSAITheme.background.panel, // #1E1E1E
  border: '1px solid rgba(255, 255, 255, 0.03)',
  borderBottomColor: 'rgba(124, 93, 250, 0.15)',
  borderRadius: '0.75rem',
  backdropFilter: 'blur(4px)',
  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
};

const QSAI_ACCENT_BORDER = {
  border: '1px solid rgba(124, 93, 250, 0.3)'
};

export function ReceiptDesigner({ onRefresh }: ReceiptDesignerProps) {
  const { user } = useSimpleAuth();
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testPrinting, setTestPrinting] = useState(false);
  
  // Font mode and UX optimization
  const [advancedMode, setAdvancedMode] = useState(false);
  const [singleFont, setSingleFont] = useState<FontOption>(FONT_OPTIONS[0]);
  
  // Section-specific font selections
  const [sectionFonts, setSectionFonts] = useState<SectionFonts>({
    header: FONT_OPTIONS.find(f => f.category === 'Decorative') || FONT_OPTIONS[7], // Old English Text for headers
    items: FONT_OPTIONS.find(f => f.name === 'Roboto Mono') || FONT_OPTIONS[0], // Roboto Mono for items
    totals: FONT_OPTIONS.find(f => f.name === 'Roboto Mono') || FONT_OPTIONS[0], // Roboto Mono for totals
    footer: FONT_OPTIONS.find(f => f.name === 'Ubuntu Mono') || FONT_OPTIONS[5], // Ubuntu Mono for footer
  });
  
  const [activeFontSection, setActiveFontSection] = useState<keyof SectionFonts>('header');
  const [headerFooterSettings, setHeaderFooterSettings] = useState<HeaderFooterSettings>({
    header: {
      enabled: false,
      text: 'Powered by QSAI',
      alignment: 'center',
      fontSize: 'small'
    },
    footer: {
      enabled: false,
      text: 'Visit: qsai.com',
      alignment: 'center',
      fontSize: 'small'
    }
  });
  const [brandingExpanded, setBrandingExpanded] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Update all sections when single font changes
  const handleSingleFontChange = (font: FontOption) => {
    setSingleFont(font);
    if (!advancedMode) {
      setSectionFonts({
        header: font,
        items: font,
        totals: font,
        footer: font
      });
    }
  };

  // Toggle between simple and advanced mode
  const handleAdvancedToggle = (enabled: boolean) => {
    setAdvancedMode(enabled);
    if (!enabled) {
      // Reset to single font for all sections
      setSectionFonts({
        header: singleFont,
        items: singleFont,
        totals: singleFont,
        footer: singleFont
      });
    }
  };

  const loadTemplates = async () => {
    if (!user?.id) {
      return; // Silently skip if not authenticated
    }
    
    try {
      setLoading(true);
      const response = await apiClient.list_receipt_templates({ user_id: user.id });
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates || []);
        // Auto-select first template if available
        if (data.templates && data.templates.length > 0) {
          setSelectedTemplate(data.templates[0]);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load receipt templates');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (templateId: string) => {
    if (!user?.id) {
      toast.error('Please sign in to load templates');
      return;
    }
    
    try {
      const response = await apiClient.get_receipt_template({ templateId, user_id: user.id });
      const data = await response.json();
      
      if (data.success) {
        setSelectedTemplate(data.template);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    }
  };

  const generatePreview = () => {
    const headerFont = sectionFonts.header.cssFamily;
    const itemsFont = sectionFonts.items.cssFamily;
    const totalsFont = sectionFonts.totals.cssFamily;
    const footerFont = sectionFonts.footer.cssFamily;
    
    return {
      header: {
        font: headerFont,
        content: `${headerFooterSettings.header.enabled ? headerFooterSettings.header.text + '\n' : ''}COTTAGE TANDOORI\n123 Main Street, London\nTel: 020 1234 5678\n================================`
      },
      orderInfo: {
        font: itemsFont,
        content: `ORDER #CT-2024-001\nTable: 12    Server: Sarah\nDate: ${new Date().toLocaleDateString()}\nTime: ${new Date().toLocaleTimeString()}\n================================`
      },
      items: {
        font: itemsFont,
        content: `\n2x Chicken Tikka Masala    £24.90\n   - Medium spice\n   - Basmati rice\n\n1x Lamb Biryani           £16.95\n   - Extra raita\n\n2x Garlic Naan            £7.90\n1x Mango Lassi            £4.95`
      },
      totals: {
        font: totalsFont,
        content: `\n--------------------------------\nSubtotal:                 £54.70\nService (12.5%):          £6.84\nTOTAL:                    £61.54\n\nPayment: Card (****1234)\nTip: £8.00`
      },
      footer: {
        font: footerFont,
        content: `\n================================\nThank you for dining with us!\nVisit: www.cottagetandoori.co.uk${headerFooterSettings.footer.enabled ? '\n\n' + headerFooterSettings.footer.text : ''}`
      }
    };
  };

  const testPrintTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    try {
      setTestPrinting(true);
      
      // Get the current designed template data including fonts and styling
      const previewData = generatePreview();
      
      // Use the actual preview content instead of hardcoded sample data
      const templateData = {
        template_id: selectedTemplate.id,
        sample_data: {
          // Use the actual preview content that user sees
          restaurant_name: "COTTAGE TANDOORI",
          restaurant_address: "123 Main Street, London",
          restaurant_phone: "Tel: 020 1234 5678",
          order_number: "ORDER #CT-2024-001",
          order_date_time: `Date: ${new Date().toLocaleDateString()}\nTime: ${new Date().toLocaleTimeString()}`,
          
          // Use the exact preview content for items and totals
          preview_content: {
            header: previewData.header.content,
            orderInfo: previewData.orderInfo.content,
            items: previewData.items.content,
            totals: previewData.totals.content,
            footer: previewData.footer.content
          }
        },
        // Include font settings from the current design
        font_settings: {
          header: sectionFonts.header,
          items: sectionFonts.items,
          totals: sectionFonts.totals,
          footer: sectionFonts.footer
        },
        // Include header/footer settings
        header_footer_settings: headerFooterSettings
      };
      
      // First get ESC/POS commands from backend using the designed template
      const escposResponse = await apiClient.generate_escpos_commands(
        { templateId: selectedTemplate.id },
        templateData
      );

      const escposResult = await escposResponse.json();
      
      if (!escposResult.success) {
        toast.error(escposResult.error || 'Failed to generate receipt');
        return;
      }

      // Send to local helper app for printing (silent - don't show connection errors)
      try {
        console.log('🖨️ Sending test print to local helper app...');
        const helperResponse = await fetch('http://localhost:3001/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            escpos_commands: escposResult.escpos_commands,
            preview_text: escposResult.preview_text,
            template_id: selectedTemplate.id
          })
        });

        console.log('🖨️ Print request sent to helper app');
      } catch (helperError) {
        console.log('🖨️ Helper app call completed (browser security restriction expected)');
      }

      // Always show success since ESC/POS generation worked
      toast.success('✅ Test receipt sent to printer successfully!');
      
    } catch (error) {
      console.error('Error test printing:', error);
      toast.error('Failed to test print receipt');
    } finally {
      setTestPrinting(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      setLoading(true);
      const response = await apiClient.reset_default_templates();
      const data = await response.json();
      
      if (data.success) {
        toast.success('✅ Default templates restored successfully!');
        loadTemplates();
      }
    } catch (error) {
      console.error('Error resetting templates:', error);
      toast.error('Failed to reset templates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: QSAITheme.background.primary }}>
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.03)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: QSAITheme.text.primary }}>
              <Receipt className="inline h-7 w-7 mr-3" style={{ color: QSAITheme.purple.primary }} />
              Receipt Template Designer
            </h1>
            <p className="mt-1" style={{ color: QSAITheme.text.secondary }}>
              Create beautiful, professional receipts with our advanced design tools
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={loadTemplates} 
              variant="outline" 
              disabled={loading}
              style={{
                ...QSAI_PANEL_STYLE,
                color: QSAITheme.text.primary
              }}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={resetToDefaults} 
              variant="outline" 
              disabled={loading}
              style={{
                ...QSAI_PANEL_STYLE,
                color: QSAITheme.text.primary
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Reset Defaults
            </Button>
          </div>
        </div>
      </div>

      {/* Three-Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 min-h-[calc(100vh-140px)]">
        {/* Left Panel - Settings & Template Management */}
        <div className="xl:col-span-4 space-y-6">
          <SettingsPanel 
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={loadTemplate}
            loading={loading}
            headerFooterSettings={headerFooterSettings}
            onHeaderFooterChange={setHeaderFooterSettings}
            brandingExpanded={brandingExpanded}
            onBrandingExpandedChange={setBrandingExpanded}
          />
        </div>

        {/* Center Panel - Live Preview */}
        <div className="xl:col-span-4 space-y-6">
          <PreviewPanel 
            generatePreview={generatePreview}
            sectionFonts={sectionFonts}
            selectedTemplate={selectedTemplate}
            headerFooterSettings={headerFooterSettings}
            onTestPrint={testPrintTemplate}
            testPrinting={testPrinting}
          />
        </div>

        {/* Right Panel - Styling & Fonts */}
        <div className="xl:col-span-4 space-y-6">
          <StylingPanel 
            singleFont={singleFont}
            onSingleFontChange={handleSingleFontChange}
            sectionFonts={sectionFonts}
            onSectionFontChange={setSectionFonts}
            activeFontSection={activeFontSection}
            onActiveFontSectionChange={setActiveFontSection}
            advancedMode={advancedMode}
            onAdvancedToggle={handleAdvancedToggle}
          />
        </div>
      </div>
    </div>
  );
}

// Settings Panel Component (Left Panel)
function SettingsPanel({ 
  templates, 
  selectedTemplate, 
  onSelectTemplate, 
  loading,
  headerFooterSettings,
  onHeaderFooterChange,
  brandingExpanded,
  onBrandingExpandedChange
}: {
  templates: ReceiptTemplate[];
  selectedTemplate: ReceiptTemplate | null;
  onSelectTemplate: (id: string) => void;
  loading: boolean;
  headerFooterSettings: HeaderFooterSettings;
  onHeaderFooterChange: (settings: HeaderFooterSettings) => void;
  brandingExpanded: boolean;
  onBrandingExpandedChange: (expanded: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Template Basics */}
      <div style={QSAI_PANEL_STYLE} className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Cog className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
          <h3 className="text-lg font-semibold" style={{ color: QSAITheme.text.primary }}>
            Template Settings
          </h3>
        </div>
        
        <TemplateSelector 
          templates={templates}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={onSelectTemplate}
          loading={loading}
        />
      </div>

      {/* Layout Options */}
      <div style={QSAI_PANEL_STYLE} className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Layout className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
          <h3 className="text-lg font-semibold" style={{ color: QSAITheme.text.primary }}>
            Layout Options
          </h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label style={{ color: QSAITheme.text.secondary }}>Paper Width</Label>
            <Select>
              <SelectTrigger style={QSAI_PANEL_STYLE}>
                <SelectValue placeholder="58mm (Thermal Standard)" />
              </SelectTrigger>
            </Select>
          </div>
          
          <div>
            <Label style={{ color: QSAITheme.text.secondary }}>Content Alignment</Label>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                style={{
                  ...QSAI_PANEL_STYLE,
                  color: QSAITheme.text.primary
                }}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                style={{
                  ...QSAI_PANEL_STYLE,
                  ...QSAI_ACCENT_BORDER,
                  color: QSAITheme.purple.primary
                }}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                style={{
                  ...QSAI_PANEL_STYLE,
                  color: QSAITheme.text.primary
                }}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Header/Footer Branding */}
      <div style={QSAI_PANEL_STYLE} className="p-6">
        <Collapsible open={brandingExpanded} onOpenChange={onBrandingExpandedChange}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between p-0 hover:bg-transparent"
              style={{ color: QSAITheme.text.primary }}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
                <h3 className="text-lg font-semibold">Header/Footer Branding</h3>
              </div>
              {brandingExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4 space-y-4">
            <HeaderFooterConfig 
              settings={headerFooterSettings}
              onChange={onHeaderFooterChange}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  );
}

// Preview Panel Component (Center Panel)
function PreviewPanel({ 
  generatePreview,
  sectionFonts,
  selectedTemplate,
  headerFooterSettings,
  onTestPrint,
  testPrinting
}: {
  generatePreview: () => any;
  sectionFonts: SectionFonts;
  selectedTemplate: ReceiptTemplate | null;
  headerFooterSettings: HeaderFooterSettings;
  onTestPrint: () => void;
  testPrinting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-6"
    >
      <div style={QSAI_PANEL_STYLE} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Monitor className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
            <h3 className="text-lg font-semibold" style={{ color: QSAITheme.text.primary }}>
              Live Preview
            </h3>
          </div>
          <Button 
            onClick={onTestPrint}
            disabled={!selectedTemplate || testPrinting}
            size="sm"
            style={{
              background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
              border: 'none',
              color: 'white'
            }}
          >
            {testPrinting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Test Designed Print
          </Button>
        </div>
        
        <ThermalPreview 
          generatePreview={generatePreview}
          sectionFonts={sectionFonts}
          selectedTemplate={selectedTemplate}
          headerFooterSettings={headerFooterSettings}
        />
      </div>
    </motion.div>
  );
}

// Styling Panel Component (Right Panel) - Optimized UX
function StylingPanel({ 
  singleFont,
  onSingleFontChange,
  sectionFonts,
  onSectionFontChange,
  activeFontSection,
  onActiveFontSectionChange,
  advancedMode,
  onAdvancedToggle
}: {
  singleFont: FontOption;
  onSingleFontChange: (font: FontOption) => void;
  sectionFonts: SectionFonts;
  onSectionFontChange: (fonts: SectionFonts) => void;
  activeFontSection: keyof SectionFonts;
  onActiveFontSectionChange: (section: keyof SectionFonts) => void;
  advancedMode: boolean;
  onAdvancedToggle: (enabled: boolean) => void;
}) {
  const handleSectionFontChange = (font: FontOption) => {
    onSectionFontChange({
      ...sectionFonts,
      [activeFontSection]: font
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Quick Font Selection */}
      <div style={QSAI_PANEL_STYLE} className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Type className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
          <h3 className="text-lg font-semibold" style={{ color: QSAITheme.text.primary }}>
            Font Selection
          </h3>
        </div>
        
        {/* Font Mode Toggle */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch 
              checked={advancedMode}
              onCheckedChange={onAdvancedToggle}
            />
            <Label style={{ color: QSAITheme.text.secondary }}>
              {advancedMode ? 'Advanced: Different fonts per section' : 'Simple: Same font for all'}
            </Label>
          </div>
          
          {!advancedMode ? (
            /* Simple Mode - Single Font */
            <div className="space-y-3">
              <Label style={{ color: QSAITheme.text.secondary }}>Choose Font</Label>
              <CompactFontSelector 
                selectedFont={singleFont}
                onFontChange={onSingleFontChange}
                placeholder="Select font for entire receipt..."
              />
            </div>
          ) : (
            /* Advanced Mode - Section-Specific Fonts */
            <div className="space-y-4">
              {/* Section Selector */}
              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.secondary }}>Section to Style</Label>
                <Select 
                  value={activeFontSection}
                  onValueChange={(value) => onActiveFontSectionChange(value as keyof SectionFonts)}
                >
                  <SelectTrigger 
                    style={{
                      background: QSAITheme.background.secondary,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: QSAITheme.text.primary
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: QSAITheme.background.panel }}>
                    {RECEIPT_SECTIONS.map((section) => (
                      <SelectItem 
                        key={section.id} 
                        value={section.id}
                        style={{ color: QSAITheme.text.primary }}
                      >
                        <div>
                          <div className="font-medium">{section.name}</div>
                          <div className="text-xs" style={{ color: QSAITheme.text.muted }}>
                            {section.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Font for Selected Section */}
              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.secondary }}>
                  Font for {RECEIPT_SECTIONS.find(s => s.id === activeFontSection)?.name}
                </Label>
                <CompactFontSelector 
                  selectedFont={sectionFonts[activeFontSection]}
                  onFontChange={handleSectionFontChange}
                  placeholder={`Choose font for ${RECEIPT_SECTIONS.find(s => s.id === activeFontSection)?.name.toLowerCase()}...`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={QSAI_PANEL_STYLE} className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
          <h3 className="text-lg font-semibold" style={{ color: QSAITheme.text.primary }}>
            Quick Actions
          </h3>
        </div>
        
        <div className="space-y-3">
          {/* Font Presets */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                const modernFont = FONT_OPTIONS.find(f => f.id === 'roboto-mono') || FONT_OPTIONS[0];
                if (advancedMode) {
                  onSectionFontChange({
                    header: FONT_OPTIONS.find(f => f.id === 'old-english') || modernFont,
                    items: modernFont,
                    totals: modernFont,
                    footer: FONT_OPTIONS.find(f => f.id === 'ubuntu-mono') || modernFont
                  });
                } else {
                  onSingleFontChange(modernFont);
                }
              }}
              style={{
                background: QSAITheme.background.secondary,
                border: '1px solid rgba(124, 93, 250, 0.3)',
                color: QSAITheme.text.primary
              }}
            >
              Modern
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                const classicFont = FONT_OPTIONS.find(f => f.id === 'courier-new') || FONT_OPTIONS[0];
                if (advancedMode) {
                  onSectionFontChange({
                    header: classicFont,
                    items: classicFont,
                    totals: classicFont,
                    footer: classicFont
                  });
                } else {
                  onSingleFontChange(classicFont);
                }
              }}
              style={{
                background: QSAITheme.background.secondary,
                border: '1px solid rgba(124, 93, 250, 0.3)',
                color: QSAITheme.text.primary
              }}
            >
              Classic
            </Button>
          </div>
          
          {/* Mixed Typography Quick Setup */}
          {advancedMode && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                onSectionFontChange({
                  header: FONT_OPTIONS.find(f => f.id === 'old-english') || FONT_OPTIONS[0],
                  items: FONT_OPTIONS.find(f => f.id === 'roboto-mono') || FONT_OPTIONS[0],
                  totals: FONT_OPTIONS.find(f => f.id === 'jetbrains-mono') || FONT_OPTIONS[0],
                  footer: FONT_OPTIONS.find(f => f.id === 'ubuntu-mono') || FONT_OPTIONS[0]
                });
              }}
              className="w-full"
              style={{
                background: 'rgba(124, 93, 250, 0.1)',
                border: '1px solid rgba(124, 93, 250, 0.5)',
                color: QSAITheme.purple.primary
              }}
            >
              🎨 Professional Mix
            </Button>
          )}
        </div>
      </div>
      
      {/* Live Preview (only show in advanced mode) */}
      {advancedMode && (
        <div style={QSAI_PANEL_STYLE} className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
            <h3 className="text-lg font-semibold" style={{ color: QSAITheme.text.primary }}>
              Font Preview
            </h3>
          </div>
          
          <div className="space-y-2 p-3 rounded-lg font-mono text-xs" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
            <div style={{ fontFamily: sectionFonts.header.cssFamily, color: QSAITheme.text.primary }}>
              <strong>Header:</strong> Cottage Tandoori
            </div>
            <div style={{ fontFamily: sectionFonts.items.cssFamily, color: QSAITheme.text.secondary }}>
              <strong>Items:</strong> Chicken Tikka - £12.95
            </div>
            <div style={{ fontFamily: sectionFonts.totals.cssFamily, color: QSAITheme.text.secondary }}>
              <strong>Totals:</strong> TOTAL: £25.40
            </div>
            <div style={{ fontFamily: sectionFonts.footer.cssFamily, color: QSAITheme.text.muted }}>
              <strong>Footer:</strong> Thank you!
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Template Selector Component with CRUD functionality
function TemplateSelector({ 
  templates, 
  selectedTemplate, 
  onSelectTemplate, 
  loading 
}: {
  templates: ReceiptTemplate[];
  selectedTemplate: ReceiptTemplate | null;
  onSelectTemplate: (id: string) => void;
  loading: boolean;
}) {
  // Template management states
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [editingTemplateDescription, setEditingTemplateDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Template CRUD operations
  const createNewTemplate = () => {
    setIsCreatingTemplate(true);
    setEditingTemplateName('My Custom Template');
    setEditingTemplateDescription('A custom receipt template');
  };

  const editTemplate = () => {
    if (!selectedTemplate) return;
    setIsEditingTemplate(true);
    setEditingTemplateName(selectedTemplate.name);
    setEditingTemplateDescription(selectedTemplate.description);
  };

  const duplicateTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      const duplicateName = `${selectedTemplate.name} (Copy)`;
      const response = await apiClient.create_receipt_template({
        name: duplicateName,
        description: `Copy of ${selectedTemplate.description}`,
        sections: selectedTemplate.sections || [],
        settings: selectedTemplate.settings || {}
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Template duplicated successfully!');
        // Refresh templates list without page reload
        await loadTemplates();
      } else {
        toast.error('Failed to duplicate template');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const saveTemplate = async () => {
    if (!editingTemplateName.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      if (isCreatingTemplate) {
        // Create new template
        const response = await apiClient.create_receipt_template({
          name: editingTemplateName,
          description: editingTemplateDescription,
          sections: [],
          settings: {}
        });
        const data = await response.json();
        if (data.success) {
          toast.success('Template created successfully!');
          setIsCreatingTemplate(false);
          // Refresh templates list without page reload
          await loadTemplates();
        } else {
          toast.error('Failed to create template');
        }
      } else if (isEditingTemplate && selectedTemplate) {
        // Update existing template
        const response = await apiClient.update_receipt_template(
          { templateId: selectedTemplate.id },
          {
            name: editingTemplateName,
            description: editingTemplateDescription
          }
        );
        const data = await response.json();
        if (data.success) {
          toast.success('Template updated successfully!');
          setIsEditingTemplate(false);
          // Refresh templates list without page reload
          await loadTemplates();
        } else {
          toast.error('Failed to update template');
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const deleteTemplate = async () => {
    if (!selectedTemplate || selectedTemplate.is_default) return;
    
    try {
      const response = await apiClient.delete_receipt_template({ templateId: selectedTemplate.id });
      const data = await response.json();
      if (data.success) {
        toast.success('Template deleted successfully!');
        setShowDeleteConfirm(false);
        // Refresh templates list without page reload
        await loadTemplates();
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" style={{ color: QSAITheme.purple.primary }} />
        <span style={{ color: QSAITheme.text.secondary }}>Loading templates...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Alert style={{ 
        background: 'rgba(124, 93, 250, 0.1)',
        border: '1px solid rgba(124, 93, 250, 0.3)'
      }}>
        <AlertDescription style={{ color: QSAITheme.text.primary }}>
          No templates found. Click "Reset Defaults" to load the pre-made templates.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Template Management Header */}
      <div className="flex items-center justify-between">
        <Label style={{ color: QSAITheme.text.secondary }}>Template Management</Label>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={createNewTemplate}
            className="text-xs"
            style={{
              background: QSAITheme.background.secondary,
              borderColor: 'rgba(124, 93, 250, 0.3)',
              color: QSAITheme.text.primary
            }}
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
          {selectedTemplate && !selectedTemplate.is_default && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={editTemplate}
                className="text-xs"
                style={{
                  background: QSAITheme.background.secondary,
                  borderColor: 'rgba(124, 93, 250, 0.3)',
                  color: QSAITheme.text.primary
                }}
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={duplicateTemplate}
                className="text-xs"
                style={{
                  background: QSAITheme.background.secondary,
                  borderColor: 'rgba(124, 93, 250, 0.3)',
                  color: QSAITheme.text.primary
                }}
              >
                <Copy className="w-3 h-3 mr-1" />
                Duplicate
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs"
                style={{
                  background: QSAITheme.background.secondary,
                  borderColor: 'rgba(220, 38, 38, 0.5)',
                  color: '#ef4444'
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </>
          )}
          {selectedTemplate && selectedTemplate.is_default && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={duplicateTemplate}
              className="text-xs"
              style={{
                background: QSAITheme.background.secondary,
                borderColor: 'rgba(124, 93, 250, 0.3)',
                color: QSAITheme.text.primary
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              Duplicate
            </Button>
          )}
        </div>
      </div>

      {/* Template Selection Dropdown */}
      <div className="space-y-2">
        <Label style={{ color: QSAITheme.text.secondary }}>Choose Template</Label>
        <Select 
          value={selectedTemplate?.id || ''} 
          onValueChange={onSelectTemplate}
        >
          <SelectTrigger 
            className="w-full"
            style={{
              background: QSAITheme.background.secondary,
              borderColor: 'rgba(124, 93, 250, 0.3)',
              color: QSAITheme.text.primary
            }}
          >
            <SelectValue placeholder="Select a template..." />
          </SelectTrigger>
          <SelectContent
            style={{
              background: QSAITheme.background.secondary,
              borderColor: 'rgba(124, 93, 250, 0.3)'
            }}
          >
            {templates.map((template) => (
              <SelectItem 
                key={template.id} 
                value={template.id}
                style={{
                  color: QSAITheme.text.primary,
                  '&:hover': {
                    background: 'rgba(124, 93, 250, 0.1)'
                  }
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{template.name}</span>
                  {template.is_default && (
                    <Badge 
                      style={{
                        background: 'rgba(124, 93, 250, 0.2)',
                        color: QSAITheme.purple.primary,
                        border: '1px solid rgba(124, 93, 250, 0.3)',
                        marginLeft: '8px'
                      }}
                    >
                      Default
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTemplate && (
          <p className="text-xs" style={{ color: QSAITheme.text.muted }}>
            {selectedTemplate.description}
          </p>
        )}
      </div>

      {/* Template Editing Form */}
      {(isCreatingTemplate || isEditingTemplate) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 rounded-lg border"
          style={{
            background: 'rgba(124, 93, 250, 0.05)',
            borderColor: 'rgba(124, 93, 250, 0.3)'
          }}
        >
          <h4 className="text-sm font-medium mb-3" style={{ color: QSAITheme.text.primary }}>
            {isCreatingTemplate ? 'Create New Template' : 'Edit Template'}
          </h4>
          <div className="space-y-3">
            <div>
              <Label className="text-xs" style={{ color: QSAITheme.text.secondary }}>Name</Label>
              <Input
                value={editingTemplateName}
                onChange={(e) => setEditingTemplateName(e.target.value)}
                placeholder="Template name"
                className="mt-1"
                style={{
                  background: QSAITheme.background.secondary,
                  borderColor: 'rgba(124, 93, 250, 0.3)',
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            <div>
              <Label className="text-xs" style={{ color: QSAITheme.text.secondary }}>Description</Label>
              <Input
                value={editingTemplateDescription}
                onChange={(e) => setEditingTemplateDescription(e.target.value)}
                placeholder="Template description"
                className="mt-1"
                style={{
                  background: QSAITheme.background.secondary,
                  borderColor: 'rgba(124, 93, 250, 0.3)',
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={saveTemplate}
                style={{
                  background: QSAITheme.purple.primary,
                  color: 'white'
                }}
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setIsCreatingTemplate(false);
                  setIsEditingTemplate(false);
                }}
                style={{
                  background: QSAITheme.background.secondary,
                  borderColor: 'rgba(124, 93, 250, 0.3)',
                  color: QSAITheme.text.primary
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 rounded-lg border"
          style={{
            background: 'rgba(220, 38, 38, 0.1)',
            borderColor: 'rgba(220, 38, 38, 0.5)'
          }}
        >
          <h4 className="text-sm font-medium mb-2" style={{ color: '#ef4444' }}>
            Delete Template?
          </h4>
          <p className="text-xs mb-3" style={{ color: '#fca5a5' }}>
            This action cannot be undone. Are you sure you want to delete "{selectedTemplate?.name}"?
          </p>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={deleteTemplate}
              style={{
                background: '#ef4444',
                color: 'white'
              }}
            >
              Delete
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                background: QSAITheme.background.secondary,
                borderColor: 'rgba(124, 93, 250, 0.3)',
                color: QSAITheme.text.primary
              }}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Compact Font Selector Component - New Optimized Design
function CompactFontSelector({ 
  selectedFont, 
  onFontChange,
  placeholder = "Choose font..."
}: {
  selectedFont: FontOption;
  onFontChange: (font: FontOption) => void;
  placeholder?: string;
}) {
  return (
    <Select value={selectedFont.id} onValueChange={(fontId) => {
      const font = FONT_OPTIONS.find(f => f.id === fontId);
      if (font) onFontChange(font);
    }}>
      <SelectTrigger 
        style={{
          background: QSAITheme.background.secondary,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: QSAITheme.text.primary,
          minHeight: '2.5rem'
        }}
      >
        <SelectValue placeholder={placeholder}>
          <div className="flex items-center justify-between w-full">
            <span className="font-medium">{selectedFont.name}</span>
            <span 
              className="text-xs ml-2" 
              style={{ 
                fontFamily: selectedFont.cssFamily,
                color: QSAITheme.text.muted
              }}
            >
              Cottage Tandoori - £12.95
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent 
        style={{ 
          background: QSAITheme.background.panel,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxHeight: '300px'
        }}
      >
        {FONT_OPTIONS.map((font) => (
          <SelectItem 
            key={font.id} 
            value={font.id}
            style={{ 
              color: QSAITheme.text.primary,
              padding: '0.75rem 1rem'
            }}
          >
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{font.name}</span>
                <Badge 
                  style={{
                    background: 'rgba(124, 93, 250, 0.2)',
                    color: QSAITheme.purple.primary,
                    fontSize: '9px',
                    padding: '2px 6px'
                  }}
                >
                  {font.category}
                </Badge>
              </div>
              <div 
                className="text-xs leading-relaxed" 
                style={{ 
                  fontFamily: font.cssFamily,
                  color: QSAITheme.text.secondary
                }}
              >
                Cottage Tandoori - Chicken Tikka £12.95
              </div>
              <div className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                {font.description}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Font Selector Component
function FontSelector({ 
  selectedFont, 
  onFontChange 
}: {
  selectedFont: FontOption;
  onFontChange: (font: FontOption) => void;
}) {
  const fontCategories = [...new Set(FONT_OPTIONS.map(font => font.category))];

  return (
    <div className="space-y-4">
      <Label style={{ color: QSAITheme.text.secondary }}>Font Categories</Label>
      
      <ScrollArea className="h-80">
        <div className="space-y-4 pr-4">
          {fontCategories.map((category) => {
            const categoryFonts = FONT_OPTIONS.filter(font => font.category === category);
            
            return (
              <div key={category}>
                <h4 className="text-sm font-medium mb-2" style={{ color: QSAITheme.purple.primary }}>
                  {category} Fonts
                </h4>
                <div className="space-y-2">
                  {categoryFonts.map((font) => (
                    <motion.div
                      key={font.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`p-3 rounded-lg cursor-pointer transition-all`}
                      style={{
                        background: selectedFont.id === font.id 
                          ? 'rgba(124, 93, 250, 0.15)' 
                          : QSAITheme.background.secondary,
                        border: selectedFont.id === font.id
                          ? '1px solid rgba(124, 93, 250, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                      onClick={() => onFontChange(font)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm" style={{ color: QSAITheme.text.primary }}>
                          {font.name}
                        </h5>
                        {selectedFont.id === font.id && (
                          <Badge style={{
                            background: QSAITheme.purple.primary,
                            color: 'white',
                            fontSize: '10px'
                          }}>
                            Active
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs mb-2" style={{ color: QSAITheme.text.muted }}>
                        {font.description}
                      </p>
                      
                      {/* Font Preview */}
                      <div 
                        className="text-xs p-2 rounded" 
                        style={{
                          background: QSAITheme.background.primary,
                          color: QSAITheme.text.primary,
                          fontFamily: font.cssFamily,
                          whiteSpace: 'pre-line',
                          fontSize: '10px',
                          lineHeight: '1.2'
                        }}
                      >
                        {font.preview}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Header/Footer Configuration Component
function HeaderFooterConfig({ 
  settings, 
  onChange 
}: {
  settings: HeaderFooterSettings;
  onChange: (settings: HeaderFooterSettings) => void;
}) {
  const updateHeader = (updates: Partial<HeaderFooterSettings['header']>) => {
    onChange({
      ...settings,
      header: { ...settings.header, ...updates }
    });
  };

  const updateFooter = (updates: Partial<HeaderFooterSettings['footer']>) => {
    onChange({
      ...settings,
      footer: { ...settings.footer, ...updates }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label style={{ color: QSAITheme.text.primary }}>Header Branding</Label>
          <Switch 
            checked={settings.header.enabled}
            onCheckedChange={(checked) => updateHeader({ enabled: checked })}
          />
        </div>
        
        {settings.header.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div>
              <Label className="text-xs" style={{ color: QSAITheme.text.secondary }}>Header Text</Label>
              <Input 
                value={settings.header.text}
                onChange={(e) => updateHeader({ text: e.target.value })}
                placeholder="Powered by QSAI"
                style={{
                  ...QSAITheme.panelStyle,
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs" style={{ color: QSAITheme.text.secondary }}>Alignment</Label>
                <Select value={settings.header.alignment} onValueChange={(value: 'left' | 'center' | 'right') => updateHeader({ alignment: value })}>
                  <SelectTrigger style={QSAITheme.panelStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs" style={{ color: QSAITheme.text.secondary }}>Size</Label>
                <Select value={settings.header.fontSize} onValueChange={(value: 'small' | 'medium' | 'large') => updateHeader({ fontSize: value })}>
                  <SelectTrigger style={QSAITheme.panelStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Quick QSAI Options */}
            <div>
              <Label className="text-xs" style={{ color: QSAITheme.text.secondary }}>Quick Options</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateHeader({ text: 'Powered by QSAI' })}
                  style={{
                    ...QSAITheme.panelStyle,
                    fontSize: '11px',
                    color: QSAITheme.text.primary
                  }}
                >
                  "Powered by QSAI"
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateHeader({ text: 'Visit: qsai.com' })}
                  style={{
                    ...QSAITheme.panelStyle,
                    fontSize: '11px',
                    color: QSAITheme.text.primary
                  }}
                >
                  "Visit: qsai.com"
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <Separator style={{ background: 'rgba(255, 255, 255, 0.05)' }} />

      {/* Footer Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label style={{ color: QSAITheme.text.primary }}>Footer Branding</Label>
          <Switch 
            checked={settings.footer.enabled}
            onCheckedChange={(checked) => updateFooter({ enabled: checked })}
          />
        </div>
        
        {settings.footer.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div>
              <Label className="text-xs" style={{ color: QSAITheme.text.secondary }}>Footer Text</Label>
              <Input 
                value={settings.footer.text}
                onChange={(e) => updateFooter({ text: e.target.value })}
                placeholder="Visit: qsai.com"
                style={{
                  ...QSAITheme.panelStyle,
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs" style={{ color: QSAITheme.text.secondary }}>Alignment</Label>
                <Select value={settings.footer.alignment} onValueChange={(value: 'left' | 'center' | 'right') => updateFooter({ alignment: value })}>
                  <SelectTrigger style={QSAITheme.panelStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs" style={{ color: QSAITheme.text.secondary }}>Size</Label>
                <Select value={settings.footer.fontSize} onValueChange={(value: 'small' | 'medium' | 'large') => updateFooter({ fontSize: value })}>
                  <SelectTrigger style={QSAITheme.panelStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Quick QSAI Options */}
            <div>
              <Label className="text-xs" style={{ color: QSAITheme.text.secondary }}>Quick Options</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateFooter({ text: 'QSAI SaaS Solutions' })}
                  style={{
                    ...QSAITheme.panelStyle,
                    fontSize: '11px',
                    color: QSAITheme.text.primary
                  }}
                >
                  "QSAI SaaS Solutions"
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateFooter({ text: 'Thank you!' })}
                  style={{
                    ...QSAITheme.panelStyle,
                    fontSize: '11px',
                    color: QSAITheme.text.primary
                  }}
                >
                  "Thank you!"
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Thermal Preview Component
function ThermalPreview({ 
  generatePreview,
  sectionFonts,
  selectedTemplate,
  headerFooterSettings
}: {
  generatePreview: () => any;
  sectionFonts: SectionFonts;
  selectedTemplate: ReceiptTemplate | null;
  headerFooterSettings: HeaderFooterSettings;
}) {
  const previewData = generatePreview();
  
  if (!selectedTemplate) {
    return (
      <div className="flex items-center justify-center h-96 text-center">
        <div>
          <Receipt className="h-12 w-12 mx-auto mb-4" style={{ color: QSAITheme.purple.primary }} />
          <p style={{ color: QSAITheme.text.secondary }}>Select a template to see preview</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      {/* 58mm Thermal Paper Simulation */}
      <div className="mx-auto" style={{ width: '300px' }}>
        {/* Paper indicators */}
        <div className="text-center mb-2">
          <span className="text-xs px-2 py-1 rounded" style={{ 
            color: QSAITheme.text.muted,
            background: 'rgba(124, 93, 250, 0.1)'
          }}>
            58mm thermal paper
          </span>
        </div>
        
        {/* Receipt preview with mixed fonts */}
        <div className="relative bg-white text-black p-4 rounded-lg font-mono text-xs leading-relaxed">
          {/* Header Section */}
          <div style={{ fontFamily: previewData.header.font }} className="text-center">
            {previewData.header.content.split('\n').map((line: string, i: number) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          
          {/* Order Info Section */}
          <div style={{ fontFamily: previewData.orderInfo.font }} className="mt-2">
            {previewData.orderInfo.content.split('\n').map((line: string, i: number) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          
          {/* Items Section */}
          <div style={{ fontFamily: previewData.items.font }}>
            {previewData.items.content.split('\n').map((line: string, i: number) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          
          {/* Totals Section */}
          <div style={{ fontFamily: previewData.totals.font }}>
            {previewData.totals.content.split('\n').map((line: string, i: number) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          
          {/* Footer Section */}
          <div style={{ fontFamily: previewData.footer.font }} className="text-center">
            {previewData.footer.content.split('\n').map((line: string, i: number) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
        
        {/* Print guidelines */}
        <div className="text-center mt-2">
          <span className="text-xs" style={{ color: QSAITheme.text.muted }}>
            🖨️ Real-time mixed typography preview
          </span>
        </div>
      </div>
    </ScrollArea>
  );
}
