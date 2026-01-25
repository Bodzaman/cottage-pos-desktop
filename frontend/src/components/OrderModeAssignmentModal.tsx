import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, RefreshCw, Clock, ChefHat, CheckCircle, AlertCircle, FileText, ArrowRight, Utensils, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { QSAITheme, styles } from 'utils/QSAIDesign';
import {
  listParentTemplates,
  getTemplateAssignments,
  setTemplateAssignment,
  getKitchenVariant
} from 'utils/receiptTemplateSupabase';

// Order mode definitions
interface OrderMode {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface TemplateAssignment {
  order_mode: string;
  template_id: string | null;  // Parent template ID (simplified from dual-select)
  template_name?: string | null;
  kitchen_variant_id?: string | null;  // Auto-resolved kitchen variant
}

interface Template {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  templateId?: string | null; // Optional: Pre-select a template when opening
  onAssignmentUpdate?: () => void;
  className?: string;
}

// Order mode configurations
const ORDER_MODES: OrderMode[] = [
  {
    id: 'dine_in',
    name: 'Dine In',
    description: 'Customers dining at tables',
    icon: Utensils,
    color: '#6366F1' // Indigo
  },
  {
    id: 'waiting',
    name: 'Waiting',
    description: 'Walk-in customers waiting for tables',
    icon: Clock,
    color: '#F59E0B' // Amber
  },
  {
    id: 'collection',
    name: 'Collection',
    description: 'Customer pickup orders',
    icon: Car,
    color: '#10B981' // Emerald
  },
  {
    id: 'delivery',
    name: 'Delivery',
    description: 'Food delivery orders',
    icon: Car,
    color: '#3B82F6' // Blue
  }
];

/**
 * OrderModeAssignmentModal - Assign thermal receipt templates to specific order modes
 * Allows users to map templates to different order types for automatic selection in POSDesktop
 */
export function OrderModeAssignmentModal({
  isOpen,
  onClose,
  onAssignmentUpdate,
  className = ''
}: Props) {
  // State management
  const [assignments, setAssignments] = useState<TemplateAssignment[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const templatesRef = useRef<Template[]>([]); // Store actual templates data to avoid race condition
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load only parent templates (excludes kitchen variants) and assignments
      const [templatesResult, assignmentsResult] = await Promise.all([
        listParentTemplates(),
        getTemplateAssignments()
      ]);

      // Process templates - only parent templates shown in dropdown
      let templatesList: Template[] = [];
      if (templatesResult.success && templatesResult.data) {
        // Transform from nested structure to flat Template structure
        templatesList = templatesResult.data.map(t => ({
          id: t.id,
          name: t.metadata.name,
          description: t.metadata.description,
          created_at: ''
        }));
        setTemplates(templatesList);
        templatesRef.current = templatesList;
      }

      if (assignmentsResult.success && assignmentsResult.data) {
        // Handle assignments - use customer_template_id as the primary template
        const existingAssignments = assignmentsResult.data;
        const fullAssignments = ORDER_MODES.map(mode => {
          const orderModeUpper = mode.id.toUpperCase();
          const assignmentData = existingAssignments[orderModeUpper];

          // Use customer_template_id as the single template reference
          const templateId = assignmentData?.customer_template_id || null;
          const template = templatesList.find(t => t.id === templateId);

          return {
            order_mode: mode.id,
            template_id: templateId,
            template_name: template?.name || null,
            kitchen_variant_id: assignmentData?.kitchen_template_id || null
          };
        });
        setAssignments(fullAssignments);
      } else {
        // Initialize empty assignments if no data
        setAssignments(ORDER_MODES.map(mode => ({
          order_mode: mode.id,
          template_id: null,
          template_name: null,
          kitchen_variant_id: null
        })));
      }
    } catch (error) {
      console.error('Error loading assignment data:', error);
      toast.error('Failed to load assignment data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update template assignment (simplified single-select)
  const updateAssignment = async (orderMode: string, templateId: string | null) => {
    const template = templatesRef.current.find(t => t.id === templateId);

    // Get the kitchen variant ID for this template
    let kitchenVariantId: string | null = null;
    if (templateId) {
      const kitchenResult = await getKitchenVariant(templateId);
      if (kitchenResult.success && kitchenResult.data) {
        kitchenVariantId = kitchenResult.data.id;
      }
    }

    setAssignments(prev => prev.map(assignment =>
      assignment.order_mode === orderMode
        ? {
            ...assignment,
            template_id: templateId,
            template_name: template?.name || null,
            kitchen_variant_id: kitchenVariantId
          }
        : assignment
    ));

    setHasChanges(true);
  };
  
  const saveAssignments = async () => {
    try {
      setIsSaving(true);

      // Save ALL assignments - uses template_id for customer, kitchen_variant_id for kitchen
      const savePromises = assignments.map(assignment => {
        const orderModeUpper = assignment.order_mode.toUpperCase();

        // Save customer template as customer_template_id, kitchen variant as kitchen_template_id
        return setTemplateAssignment(
          orderModeUpper,
          assignment.template_id,           // Customer template
          assignment.kitchen_variant_id     // Auto-resolved kitchen variant
        );
      });

      const results = await Promise.all(savePromises);

      const failures = results.filter(r => !r.success);

      if (failures.length === 0) {
        const assignedCount = assignments.filter(a => a.template_id).length;

        toast.success('Template assignments saved successfully!', {
          description: `${assignedCount} order mode${assignedCount !== 1 ? 's' : ''} configured`
        });
        setHasChanges(false);

        // Auto-close modal on success
        onClose();

        // Trigger parent callback to refresh
        onAssignmentUpdate?.();
      } else {
        throw new Error(`Failed to save ${failures.length} assignments`);
      }
    } catch (error) {
      console.error('[OrderModeAssignmentModal] Error saving assignments:', error);
      toast.error('Failed to save template assignments');
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetChanges = () => {
    loadData();
    setHasChanges(false);
  };
  
  const getOrderModeConfig = (modeId: string) => {
    return ORDER_MODES.find(mode => mode.id === modeId);
  };
  
  const getAssignmentStatus = () => {
    // Simplified: assigned if template_id is set (kitchen variant is auto-resolved)
    const assigned = assignments.filter(a => a.template_id).length;
    const unassigned = assignments.filter(a => !a.template_id).length;
    const total = assignments.length;

    return { assigned, unassigned, total };
  };
  
  const status = getAssignmentStatus();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-4xl h-[80dvh] p-0 ${className}`}
        style={styles.frostedGlassStyle}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: QSAITheme.purple.primary + '20' }}>
              <ArrowRight className="w-6 h-6" style={{ color: QSAITheme.purple.primary }} />
            </div>
            Order Mode Assignments
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Assign thermal receipt templates to different order modes for automatic selection in POSDesktop.
          </DialogDescription>
          
          {/* Status Summary */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm">{status.assigned} Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm">{status.unassigned} Unassigned</span>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {status.assigned}/{status.total} Complete
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden px-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-3">
                <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: QSAITheme.purple.primary }} />
                <span>Loading assignments...</span>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-4 py-4">
                <AnimatePresence>
                  {assignments.map((assignment, index) => {
                    const modeConfig = getOrderModeConfig(assignment.order_mode);
                    if (!modeConfig) return null;

                    const IconComponent = modeConfig.icon;
                    const isAssigned = !!assignment.template_id;

                    return (
                      <motion.div
                        key={assignment.order_mode}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          className={`transition-all duration-200 ${isAssigned ? 'ring-2 ring-green-500/20' : ''}`}
                          style={styles.glassCard}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="p-2 rounded-lg"
                                  style={{ backgroundColor: modeConfig.color + '20' }}
                                >
                                  <IconComponent
                                    className="w-5 h-5"
                                    style={{ color: modeConfig.color }}
                                  />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{modeConfig.name}</CardTitle>
                                  <CardDescription className="text-sm">
                                    {modeConfig.description}
                                  </CardDescription>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isAssigned ? (
                                  <Badge variant="secondary" className="bg-green-600/20 text-green-300">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Assigned
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-red-600/20 text-red-300">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Unassigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent>
                            {/* Single template select - kitchen variant is auto-resolved */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4" style={{ color: '#a78bfa' }} />
                                Receipt Template
                              </Label>
                              <Select
                                value={assignment.template_id || 'none'}
                                onValueChange={(value) =>
                                  updateAssignment(assignment.order_mode, value === 'none' ? null : value)
                                }
                              >
                                <SelectTrigger className="w-full" style={styles.glassCard}>
                                  <SelectValue placeholder="Select template..." />
                                </SelectTrigger>
                                <SelectContent style={styles.frostedGlassStyle}>
                                  <SelectItem value="none">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                      No template assigned
                                    </div>
                                  </SelectItem>
                                  {templates.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        <span className="font-medium">{template.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* Info about auto-resolved kitchen variant */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-500/10 rounded-md p-2">
                                <ChefHat className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <span>Kitchen variant will be used automatically for kitchen prints</span>
                              </div>

                              {assignment.template_name && (
                                <div className="text-xs text-purple-400">
                                  Current: {assignment.template_name}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="p-6 border-t" style={{ borderColor: QSAITheme.border.light }}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {hasChanges ? (
                <span className="text-amber-400">Unsaved changes</span>
              ) : (
                <span>All changes saved</span>
              )}
            </div>
            
            <div className="flex gap-3">
              {hasChanges && (
                <Button
                  variant="outline"
                  onClick={resetChanges}
                  disabled={isSaving}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Changes
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                {hasChanges ? 'Cancel' : 'Close'}
              </Button>
              
              <Button
                onClick={saveAssignments}
                disabled={!hasChanges || isSaving}
                style={{ backgroundColor: QSAITheme.purple.primary }}
              >
                {isSaving ? (
                  <div className="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Assignments
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OrderModeAssignmentModal;
