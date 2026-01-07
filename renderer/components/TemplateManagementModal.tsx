import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Edit3, Trash2, Plus, Eye, Download, Upload, Search, FileText, Clock, User, Copy, Settings, Monitor, ChefHat, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { QSAITheme, styles } from 'utils/QSAIDesign';
import { apiClient } from 'app';
import { TemplateResponse, TemplateCreateRequest } from 'types';
import { OrderModeAssignmentModal } from 'components/OrderModeAssignmentModal';
import { useSimpleAuth } from 'utils/simple-auth-context';

// Template data structure matching the ThermalReceiptFormData
interface Template {
  id: string;
  name: string;
  description?: string;
  design_data: any; // The complete ThermalReceiptFormData
  created_at: string;
  updated_at: string;
}

interface TemplateLibraryItem {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  // preview fields
  businessName?: string;
  templateType?: string;
  // Add preview URLs
  foh_preview_url?: string;
  kitchen_preview_url?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentFormData: any; // ThermalReceiptFormData from parent
  onLoadTemplate: (templateData: any) => void;
  className?: string;
}

// Safe color access helper
const getPurplePrimary = () => QSAITheme?.purple?.primary || '#5B21B6';
const getPurpleLight = () => QSAITheme?.purple?.light || '#7C3AED';
const getGreenPrimary = () => QSAITheme?.green?.primary || '#10B981';
const getBluePrimary = () => QSAITheme?.blue?.primary || '#3B82F6';

/**
 * TemplateManagementModal - Template library management for ThermalReceiptDesigner
 * Features:
 * - Browse template library with previews
 * - Load existing templates
 * - Edit/update existing templates
 * - Delete templates
 * - Search and filter templates
 * - Order mode assignments
 */
export function TemplateManagementModal({
  isOpen,
  onClose,
  currentFormData,
  onLoadTemplate,
  className = ''
}: Props) {
  // Get authenticated user
  const { user } = useSimpleAuth();
  
  // State management
  const [templates, setTemplates] = useState<TemplateLibraryItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [previewsLoading, setPreviewsLoading] = useState<Set<string>>(new Set());
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [templateAssignments, setTemplateAssignments] = useState<Record<string, string[]>>({});
  const [selectedTemplateForAssignment, setSelectedTemplateForAssignment] = useState<string | null>(null);
  
  // Load templates on modal open
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);
  
  const loadTemplates = async () => {
    if (!user?.id) {
      toast.error('Please sign in to manage templates');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Load templates and assignments concurrently
      const [templatesResponse, assignmentsResponse] = await Promise.all([
        apiClient.list_receipt_templates({ user_id: user.id }),
        apiClient.get_template_assignments()
      ]);
      
      const templatesData = await templatesResponse.json();
      const assignmentsData = await assignmentsResponse.json();
      
      if (templatesData.success) {
        const templatesWithPreviews = await Promise.all(
          (templatesData.templates || []).map(async (template: TemplateLibraryItem) => {
            // Load preview thumbnails
            try {
              const [fohResponse, kitchenResponse] = await Promise.all([
                apiClient.get_template_preview({ templateId: template.id, variant: 'foh' }),
                apiClient.get_template_preview({ templateId: template.id, variant: 'kitchen' })
              ]);
              
              const fohData = await fohResponse.json();
              const kitchenData = await kitchenResponse.json();
              
              return {
                ...template,
                foh_preview_url: fohData.success ? fohData.image_data : null,
                kitchen_preview_url: kitchenData.success ? kitchenData.image_data : null
              };
            } catch (error) {
              console.error(`Failed to load previews for template ${template.id}:`, error);
              return template;
            }
          })
        );
        
        setTemplates(templatesWithPreviews);
      } else {
        throw new Error(templatesData.message || 'Failed to load templates');
      }
      
      // Process assignment data
      if (assignmentsData.success) {
        const assignmentMap: Record<string, string[]> = {};
        
        // Handle assignments as object, not array
        const assignments = assignmentsData.assignments || {};
        
        // Convert object structure to template assignment map
        // assignments is Record<string, TemplateAssignment> where TemplateAssignment has customer_template_id
        Object.entries(assignments).forEach(([orderMode, assignment]) => {
          const templateId = assignment.customer_template_id;
          if (templateId && typeof templateId === 'string') {
            if (!assignmentMap[templateId]) {
              assignmentMap[templateId] = [];
            }
            assignmentMap[templateId].push(orderMode);
          }
        });
        
        setTemplateAssignments(assignmentMap);
      }
      
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadTemplateDetails = async (templateId: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get_receipt_template({ templateId, user_id: 'current_user' });
      const data = await response.json();
      
      if (data.success && data.template) {
        setSelectedTemplate(data.template);
      } else {
        throw new Error(data.message || 'Failed to load template details');
      }
    } catch (error) {
      console.error('Error loading template details:', error);
      toast.error('Failed to load template details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadTemplate = (template: Template) => {
    try {
      // Load the template design data into the parent form
      onLoadTemplate(template.design_data);
      toast.success(`Template "${template.name}" loaded successfully`);
      onClose();
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    }
  };
  
  const deleteTemplate = async (templateId: string, templateName: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.delete_receipt_template({ templateId }, { user_id: 'current_user' });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Template "${templateName}" deleted successfully`);
        await loadTemplates(); // Refresh template list
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
      } else {
        throw new Error(data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (templateId: string) => {
    if (!user?.id) {
      toast.error('Please sign in to delete templates');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await apiClient.delete_receipt_template(
        { templateId },
        { user_id: user.id }
      );
      const data = await response.json();
      
      if (data.success) {
        toast.success('Template deleted successfully');
        loadTemplates(); // Refresh list
      } else {
        toast.error(data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };
  
  // Filter templates based on search term
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-5xl h-[80vh] p-0 ${className}`}
        style={styles.frostedGlassStyle}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: getPurplePrimary() + '20' }}>
              <Settings className="w-6 h-6" style={{ color: getPurplePrimary() }} />
            </div>
            Template Management
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Save, manage, and organize your thermal receipt templates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col px-6 pt-4">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search templates by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  style={styles.glassCard}
                />
              </div>
            </div>
            
            {/* Template Grid */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: getPurplePrimary() }} />
                    <span>Loading templates...</span>
                  </div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchTerm ? 'No templates match your search.' : 'Use the "Save Template" button in the designer to create your first template.'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowAssignmentModal(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Order Mode Assignments
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-4">
                    <AnimatePresence>
                      {filteredTemplates.map((template, index) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card 
                            className="hover:shadow-lg transition-all duration-200 h-full"
                            style={styles.glassCard}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-lg font-semibold truncate mb-1">
                                    {template.name}
                                  </CardTitle>
                                  <CardDescription className="text-sm line-clamp-2">
                                    {template.description || 'No description provided'}
                                  </CardDescription>
                                </div>
                                <div className="flex gap-2 ml-3">
                                  <Badge variant="secondary" className="text-xs">
                                    <FileText className="w-3 h-3 mr-1" />
                                    Template
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Dual Preview Thumbnails */}
                              <div className="flex gap-4 mb-4">
                                {/* FOH Preview */}
                                <div className="flex-1">
                                  <div className="text-xs font-medium mb-2 flex items-center gap-1">
                                    <Monitor className="w-3 h-3" style={{ color: getPurplePrimary() }} />
                                    FOH (Customer)
                                  </div>
                                  <div 
                                    className="w-full h-24 border rounded-lg flex items-center justify-center overflow-hidden"
                                    style={{ 
                                      backgroundColor: '#f8f9fa',
                                      borderColor: getPurpleLight() + '30'
                                    }}
                                  >
                                    {template.foh_preview_url ? (
                                      <img 
                                        src={template.foh_preview_url} 
                                        alt="FOH Preview" 
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <div className="text-center text-xs text-gray-400">
                                        <Monitor className="w-4 h-4 mx-auto mb-1" />
                                        No Preview
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Kitchen Preview */}
                                <div className="flex-1">
                                  <div className="text-xs font-medium mb-2 flex items-center gap-1">
                                    <ChefHat className="w-3 h-3" style={{ color: getPurpleLight() }} />
                                    Kitchen
                                  </div>
                                  <div 
                                    className="w-full h-24 border rounded-lg flex items-center justify-center overflow-hidden"
                                    style={{ 
                                      backgroundColor: '#f8f9fa',
                                      borderColor: getPurpleLight() + '30'
                                    }}
                                  >
                                    {template.kitchen_preview_url ? (
                                      <img 
                                        src={template.kitchen_preview_url} 
                                        alt="Kitchen Preview" 
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <div className="text-center text-xs text-gray-400">
                                        <ChefHat className="w-4 h-4 mx-auto mb-1" />
                                        No Preview
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Order Mode Assignment Badges */}
                              <div className="mb-4">
                                <div className="text-xs font-medium mb-2">Assigned to Order Modes:</div>
                                <div className="flex flex-wrap gap-1">
                                  {templateAssignments[template.id] && templateAssignments[template.id].length > 0 ? (
                                    templateAssignments[template.id].map((mode) => {
                                      const modeDisplay = {
                                        'dine_in': { label: 'Dine In', color: getPurplePrimary() },
                                        'waiting': { label: 'Waiting', color: getPurpleLight() },
                                        'collection': { label: 'Collection', color: getGreenPrimary() },
                                        'delivery': { label: 'Delivery', color: getBluePrimary() }
                                      }[mode] || { label: mode, color: '#6b7280' };
                                      
                                      return (
                                        <Badge 
                                          key={mode}
                                          variant="outline" 
                                          className="text-xs px-2 py-1"
                                          style={{ 
                                            borderColor: modeDisplay.color + '50',
                                            color: modeDisplay.color,
                                            backgroundColor: modeDisplay.color + '10'
                                          }}
                                        >
                                          {modeDisplay.label}
                                        </Badge>
                                      );
                                    })
                                  ) : (
                                    <Badge variant="outline" className="text-xs px-2 py-1 text-gray-400">
                                      No assignments
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(template.created_at)}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    setSelectedTemplate(null);
                                    setShowFullPreview(true);
                                    loadTemplateDetails(template.id);
                                  }}
                                >
                                  <Maximize2 className="w-3 h-3 mr-1" />
                                  Full Preview
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => loadTemplateDetails(template.id)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Load
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTemplateForAssignment(template.id);
                                    setShowAssignmentModal(true);
                                  }}
                                >
                                  <Settings className="w-3 h-3 mr-1" />
                                  Assign
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="px-2"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent style={styles.frostedGlassStyle}>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteTemplate(template.id, template.name)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
        
        {/* Template Preview Sidebar */}
        <AnimatePresence>
          {selectedTemplate && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 w-96 h-full border-l"
              style={styles.frostedGlassStyle}
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Template Preview</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-lg mb-1">{selectedTemplate.name}</h4>
                    <p className="text-sm text-gray-400">{selectedTemplate.description || 'No description'}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Created:</span>
                      <br />
                      <span className="text-gray-400">{formatDate(selectedTemplate.created_at)}</span>
                    </div>
                    
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <br />
                      <span className="text-gray-400">{formatDate(selectedTemplate.updated_at)}</span>
                    </div>
                    
                    {selectedTemplate.design_data && (
                      <div>
                        <span className="font-medium">Design Details:</span>
                        <div className="mt-2 p-3 rounded border" style={{ ...styles.glassCard, opacity: 0.8 }}>
                          <div className="text-xs text-gray-400 space-y-1">
                            <div><strong>Business:</strong> {selectedTemplate.design_data.businessName || 'Not set'}</div>
                            <div><strong>Paper:</strong> {selectedTemplate.design_data.paperWidth || 80}mm</div>
                            <div><strong>Format:</strong> {selectedTemplate.design_data.receiptFormat || 'front_of_house'}</div>
                            <div><strong>Font:</strong> {selectedTemplate.design_data.receiptFont || 'Inter'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1" />
                  
                  <div className="space-y-2">
                    <Button
                      onClick={() => loadTemplate(selectedTemplate)}
                      className="w-full"
                      style={{ backgroundColor: getPurplePrimary() }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Load Template
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Copy template data to save form for editing
                        setSaveForm({
                          name: selectedTemplate.name + ' (Copy)',
                          description: selectedTemplate.description || ''
                        });
                        setActiveTab('save');
                        setSelectedTemplate(null);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate Template
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Order Mode Assignment Modal */}
        <OrderModeAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedTemplateForAssignment(null);
          }}
          templateId={selectedTemplateForAssignment}
          onAssignmentUpdate={() => {
            // Refresh template assignments when updated
            loadTemplates();
          }}
        />
        
        {/* Full-Size Preview Modal */}
        <AnimatePresence>
          {showFullPreview && selectedTemplate && (
            <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
              <DialogContent 
                className="max-w-4xl h-[85vh] p-0"
                style={styles.frostedGlassStyle}
              >
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: getPurplePrimary() + '20' }}>
                      <Maximize2 className="w-5 h-5" style={{ color: getPurplePrimary() }} />
                    </div>
                    Template Preview: {selectedTemplate.name}
                  </DialogTitle>
                  <DialogDescription className="text-sm mt-2">
                    Full-size preview with FOH and Kitchen variants
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-hidden px-6">
                  <Tabs defaultValue="foh" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 mb-4" style={styles.glassCard}>
                      <TabsTrigger value="foh" className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Front of House
                      </TabsTrigger>
                      <TabsTrigger value="kitchen" className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4" />
                        Kitchen Copy
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="foh" className="flex-1 mt-0">
                      <div className="h-full flex flex-col">
                        <div className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Monitor className="w-4 h-4" style={{ color: getPurplePrimary() }} />
                          Customer Receipt Preview
                        </div>
                        <div 
                          className="flex-1 border rounded-lg p-6 overflow-auto"
                          style={{ 
                            backgroundColor: '#ffffff',
                            borderColor: getPurplePrimary() + '30'
                          }}
                        >
                          {selectedTemplate.design_data ? (
                            <div className="max-w-sm mx-auto">
                              {/* Render FOH preview content */}
                              <div className="font-mono text-sm">
                                <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-3">
                                  <div className="font-bold text-lg">{selectedTemplate.design_data.businessName || 'Restaurant Name'}</div>
                                  <div className="text-sm">CUSTOMER RECEIPT</div>
                                </div>
                                
                                <div className="mb-3 text-xs">
                                  <div>Order: #12345</div>
                                  <div>Customer: John Smith</div>
                                  <div>Type: Dine In</div>
                                  <div>Time: {new Date().toLocaleString()}</div>
                                </div>
                                
                                <div className="border-b border-dashed border-gray-400 pb-2 mb-3">
                                  <div className="flex justify-between mb-1 text-xs">
                                    <span>Chicken Tikka Masala x1</span>
                                    <span>£15.99</span>
                                  </div>
                                  <div className="flex justify-between mb-1 text-xs">
                                    <span>Garlic Naan x2</span>
                                    <span>£3.50</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>Mango Lassi x1</span>
                                    <span>£4.50</span>
                                  </div>
                                </div>
                                
                                <div className="text-xs">
                                  <div className="flex justify-between mb-1">
                                    <span>Subtotal:</span>
                                    <span>£23.99</span>
                                  </div>
                                  <div className="flex justify-between mb-1">
                                    <span>Tax:</span>
                                    <span>£2.16</span>
                                  </div>
                                  <div className="flex justify-between font-bold border-t border-gray-800 pt-1">
                                    <span>TOTAL:</span>
                                    <span>£26.15</span>
                                  </div>
                                </div>
                                
                                <div className="text-center mt-3 pt-2 border-t border-dashed border-gray-400 text-xs">
                                  <div>Payment: Card</div>
                                  <div>Thank you for dining with us!</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-400">
                              <Monitor className="w-8 h-8 mx-auto mb-2" />
                              No template data available
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="kitchen" className="flex-1 mt-0">
                      <div className="h-full flex flex-col">
                        <div className="text-sm font-medium mb-3 flex items-center gap-2">
                          <ChefHat className="w-4 h-4" style={{ color: getPurpleLight() }} />
                          Kitchen Copy Preview
                        </div>
                        <div 
                          className="flex-1 border rounded-lg p-6 overflow-auto"
                          style={{ 
                            backgroundColor: '#ffffff',
                            borderColor: getPurpleLight() + '30'
                          }}
                        >
                          {selectedTemplate.design_data ? (
                            <div className="max-w-sm mx-auto">
                              {/* Render Kitchen preview content */}
                              <div className="font-mono text-sm">
                                <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-3">
                                  <div className="font-bold text-lg">{selectedTemplate.design_data.businessName || 'Restaurant Name'}</div>
                                  <div className="text-sm font-bold">*** KITCHEN COPY ***</div>
                                </div>
                                
                                <div className="mb-3 text-xs">
                                  <div>Order: #12345</div>
                                  <div>Customer: John Smith</div>
                                  <div>Type: Dine In</div>
                                  <div>Time: {new Date().toLocaleString()}</div>
                                </div>
                                
                                <div className="border-b border-dashed border-gray-400 pb-2 mb-3">
                                  <div className="flex justify-between mb-1 text-xs">
                                    <span>Chicken Tikka Masala</span>
                                    <span>x1</span>
                                  </div>
                                  <div className="flex justify-between mb-1 text-xs">
                                    <span>Garlic Naan</span>
                                    <span>x2</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>Mango Lassi</span>
                                    <span>x1</span>
                                  </div>
                                </div>
                                
                                <div className="text-center mt-3 pt-2 border-t border-dashed border-gray-400 text-xs font-bold">
                                  *** KITCHEN COPY ***
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-400">
                              <ChefHat className="w-8 h-8 mx-auto mb-2" />
                              No template data available
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <div className="p-6 pt-0 border-t border-gray-200">
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowFullPreview(false)}
                    >
                      Close
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Print test functionality
                        window.print();
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Print Test
                    </Button>
                    
                    <Button
                      onClick={() => {
                        loadTemplate(selectedTemplate);
                        setShowFullPreview(false);
                      }}
                      style={{ backgroundColor: getPurplePrimary() }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Load Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateManagementModal;
