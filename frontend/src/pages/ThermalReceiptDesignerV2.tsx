/**
 * ThermalReceiptDesignerV2 - Main orchestrator page
 * 
 * A complete refactor of the receipt designer with:
 * - Clean architecture (Store + Service + Components)
 * - State machine approach (loading → empty/browsing → editing)
 * - Default tab: 'header' (MYA-1038)
 * - Stable preview with skeleton (MYA-1038)
 * - Empty state onboarding (MYA-1039)
 * - Quick actions panel (MYA-1040)
 * - Performance optimizations (MYA-1042)
 * 
 * Route: /thermal-receipt-designer-v2 (for testing)
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { toast } from 'sonner';
import { QSAITheme, InternalTheme } from 'utils/QSAIDesign';
import { useReceiptDesignerStoreV2, selectFormData, selectFormatToggle, selectHasUnsavedChanges, selectCurrentTemplate, selectTemplatesList } from 'utils/receiptDesignerStoreV2';
import { ReceiptDesignerService } from 'utils/receiptDesignerService';
import { EmptyStateCard } from 'components/EmptyStateCard';
import { useRealtimeMenuStoreCompat } from 'utils/realtimeMenuStoreCompat';

import { ReceiptDesignerHeader } from 'components/ReceiptDesignerHeader';
import { ReceiptDesignerAccordion } from 'components/ReceiptDesignerAccordion';
import { ReceiptPreviewV2 } from 'components/ReceiptPreviewV2';
import { OrderModeAssignmentModal } from 'components/OrderModeAssignmentModal';
import { BuildSampleOrderModal } from 'components/BuildSampleOrderModal';
import { BuildSampleTakeawayModal } from 'components/BuildSampleTakeawayModal';
import { DEFAULT_FORM_DATA, OrderItem } from 'utils/receiptDesignerTypes';
import { injectGoogleFonts } from 'utils/thermalFonts';
import TemplateManagementModal from 'components/TemplateManagementModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, FolderOpen } from 'lucide-react';
import { useRestaurantSettings } from 'utils/useRestaurantSettings';

// ==================== View Mode Type ====================
type ViewMode = 'loading' | 'empty' | 'browsing' | 'editing';

export default function ThermalReceiptDesignerV2() {
  // Get store state and actions
  const store = useReceiptDesignerStoreV2();
  const formData = useReceiptDesignerStoreV2(selectFormData);
  const formatToggle = useReceiptDesignerStoreV2(selectFormatToggle);
  const hasUnsavedChanges = useReceiptDesignerStoreV2(selectHasUnsavedChanges);
  const currentTemplate = useReceiptDesignerStoreV2(selectCurrentTemplate);
  const templatesList = useReceiptDesignerStoreV2(selectTemplatesList);

  // Load restaurant profile settings
  const { settings, isLoading: isLoadingSettings, error: settingsError } = useRestaurantSettings();

  // Initialize business data ONCE on mount when settings are loaded
  useEffect(() => {
    if (settings && !isLoadingSettings) {
      const profile = settings.business_profile;
      
      // Only initialize if formData still has default values (prevents overwriting user changes)
      const isDefaultData = formData.businessName === DEFAULT_FORM_DATA.businessName;
      
      if (isDefaultData) {
        store.initializeBusinessData({
          businessName: profile?.name || 'Cottage Tandoori Restaurant',
          address: profile?.address || '',
          phone: profile?.phone || '',
          website: profile?.website || ''
        });
      }
    }
  }, [settings, isLoadingSettings, formData.businessName, store.initializeBusinessData]);

  // ==================== State Machine ====================
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  
  // Modal state for Order Mode Assignment
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDineInModal, setShowDineInModal] = useState(false);
  const [showTakeawayModal, setShowTakeawayModal] = useState(false);

  // ==================== Lifecycle ====================

  // Initialize menu store for section separator mapping in ThermalPreview
  // This ensures categories and menuItems are loaded before receipt preview renders
  const {
    categories: menuCategories,
    menuItems: menuStoreItems,
    isLoading: menuStoreLoading,
    initialize: initializeMenuStore
  } = useRealtimeMenuStoreCompat({ context: 'admin' });

  // Inject Google Fonts for thermal font system
  useEffect(() => {
    injectGoogleFonts();
  }, []);

  // Log menu store state for debugging
  useEffect(() => {
    console.log('🏪 ThermalReceiptDesignerV2 - Checking menu store state:', {
      categoriesCount: menuCategories.length,
      menuItemsCount: menuStoreItems.length,
      isLoading: menuStoreLoading
    });

    // Initialize if categories are empty (not yet loaded)
    if (menuCategories.length === 0 && !menuStoreLoading) {
      console.log('🔄 ThermalReceiptDesignerV2 - Initializing menu store for section mapping...');
      initializeMenuStore();
    }
  }, [menuCategories.length, menuStoreItems.length, menuStoreLoading, initializeMenuStore]);

  // Load templates on mount and determine initial view mode
  useEffect(() => {
    const initialize = async () => {
      setViewMode('loading');
      // Always load templates - use default user ID if not authenticated
      await loadTemplates();
    };

    initialize();
  }, []); // No auth dependency - templates load regardless of login status

  // ==================== Template Management ====================

  const loadTemplates = async () => {
    store.setIsLoadingTemplates(true);
    // Fetch all templates (no user filter - templates are shared resources)
    const response = await ReceiptDesignerService.fetchTemplates();
    
    if (response.success && response.data) {
      store.setTemplatesList(response.data);
      
      // State transition based on templates
      if (response.data.length === 0) {
        setViewMode('empty');
      } else {
        setViewMode('browsing');
      }
    } else {
      console.error('Failed to load templates:', response.error);
      setViewMode('empty'); // Default to empty on error
    }
    
    store.setIsLoadingTemplates(false);
  };

  const handleTemplateSelect = async (templateId: string) => {
    if (!templateId) return;

    store.setIsLoading(true);
    const response = await ReceiptDesignerService.fetchTemplate(templateId);
    
    if (response.success && response.data) {
      store.loadTemplate(response.data);
      toast.success(`Template "${response.data.metadata.name}" loaded`);
      setViewMode('editing'); // Transition to editing mode
    } else {
      toast.error(response.error || 'Failed to load template');
    }
    
    store.setIsLoading(false);
  };

  // ==================== Actions ====================

  const handleCreateBlank = useCallback(() => {
    store.resetForm();
    toast.success('Blank template created');
    setViewMode('editing'); // Transition to editing mode
  }, [store]);

  const handleLoadFromLibrary = useCallback(() => {
    // Button is now hidden when no templates exist (via EmptyStateCard)
    // So we can directly open the modal
    setShowTemplateModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges && currentTemplate) {
      toast.info('No changes to save');
      return;
    }

    store.setIsSaving(true);

    try {
      if (currentTemplate) {
        // Update existing template
        const response = await ReceiptDesignerService.updateTemplate(
          currentTemplate.id,
          {
            design_data: formData,
            paper_width: store.paperWidth
          }
        );

        if (response.success) {
          store.markAsSaved();
          toast.success('Template updated successfully');
          // Show warning if kitchen variant sync failed
          if (response.warning) {
            toast.warning(response.warning);
          }
          await loadTemplates(); // Refresh list
        } else {
          toast.error(response.error || 'Failed to update template');
        }
      } else {
        // Create new template
        const templateName = formData.businessName 
          ? `${formData.businessName} - ${formData.orderMode}` 
          : `Template ${Date.now()}`;

        const response = await ReceiptDesignerService.saveTemplate(
          templateName,
          'Custom receipt template',
          formData,
          store.paperWidth
        );

        if (response.success && response.data) {
          store.setCurrentTemplate(response.data);
          store.markAsSaved();
          toast.success('Template saved successfully');
          // Show warning if kitchen variant failed
          if (response.warning) {
            toast.warning(response.warning);
          }
          await loadTemplates(); // Refresh list
        } else {
          toast.error(response.error || 'Failed to save template');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving');
    } finally {
      store.setIsSaving(false);
    }
  }, [hasUnsavedChanges, currentTemplate, formData, store, loadTemplates]);

  const handleDuplicate = useCallback(async () => {
    if (!currentTemplate) {
      toast.info('No template to duplicate');
      return;
    }

    store.setIsSaving(true);

    try {
      // Generate unique name with smart counter
      // Extract base name (strip existing "(Copy)" or "(Copy N)" suffix)
      const copyPattern = /^(.+?)\s*\(Copy(?:\s+(\d+))?\)$/;
      const match = currentTemplate.metadata.name.match(copyPattern);
      const baseName = match ? match[1].trim() : currentTemplate.metadata.name;

      // Find all existing copies with this base name
      const existingNames = templatesList.map(t => t.metadata.name);
      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const copyRegex = new RegExp(`^${escapedBaseName}\\s*\\(Copy(?:\\s+(\\d+))?\\)$`);

      // Find the highest copy number
      let maxCopyNum = 0;
      existingNames.forEach(name => {
        if (name === `${baseName} (Copy)`) {
          maxCopyNum = Math.max(maxCopyNum, 1);
        }
        const copyMatch = name.match(copyRegex);
        if (copyMatch && copyMatch[1]) {
          maxCopyNum = Math.max(maxCopyNum, parseInt(copyMatch[1], 10));
        }
      });

      // Generate unique name
      const newName = maxCopyNum === 0
        ? `${baseName} (Copy)`
        : `${baseName} (Copy ${maxCopyNum + 1})`;

      const response = await ReceiptDesignerService.saveTemplate(
        newName,
        currentTemplate.metadata.description,
        formData,
        store.paperWidth
      );

      if (response.success && response.data) {
        store.setCurrentTemplate(response.data);
        store.markAsSaved();
        toast.success(`Template duplicated as "${newName}"`);
        // Show warning if kitchen variant failed
        if (response.warning) {
          toast.warning(response.warning);
        }
        await loadTemplates();
      } else {
        toast.error(response.error || 'Failed to duplicate template');
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      toast.error('An error occurred while duplicating');
    } finally {
      store.setIsSaving(false);
    }
  }, [currentTemplate, formData, store, loadTemplates, templatesList]);

  const handleDelete = useCallback(async () => {
    if (!currentTemplate) {
      toast.info('No template to delete');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${currentTemplate.metadata.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    store.setIsSaving(true);

    try {
      const response = await ReceiptDesignerService.deleteTemplate(
        currentTemplate.id
      );

      if (response.success) {
        toast.success('Template deleted successfully');
        
        // Clear current template and reset form
        store.setCurrentTemplate(null);
        store.resetForm();
        
        // Reload templates list
        await loadTemplates();
        
        // Transition back to browsing or empty state
        const updatedList = templatesList.filter(t => t.id !== currentTemplate.id);
        if (updatedList.length === 0) {
          setViewMode('empty');
        } else {
          setViewMode('browsing');
        }
      } else {
        toast.error(response.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An error occurred while deleting');
    } finally {
      store.setIsSaving(false);
    }
  }, [currentTemplate, store, templatesList, loadTemplates]);

  const handleExport = useCallback(() => {
    // Export functionality (print/download)
    toast.info('Export functionality coming soon');
  }, []);

  const handleShowAssignments = useCallback(() => {
    if (!currentTemplate) {
      toast.info('Please select or create a template first');
      return;
    }
    setShowAssignmentModal(true);
  }, [currentTemplate]);

  const handleBrowseTemplates = useCallback(() => {
    setShowTemplateModal(true);
  }, []);

  const handleSampleOrderBuilt = useCallback((output: { orderItems: OrderItem[]; tableNumber: string; guestCount: number }) => {
    // Update formData with sample order items and table context
    store.updateFormData({
      orderItems: output.orderItems,
      tableNumber: output.tableNumber,
      guestCount: output.guestCount
    });

    setShowDineInModal(false);
    toast.success(`Sample order created with ${output.orderItems.length} items for Table ${output.tableNumber}`);
  }, [store]);

  const handleTakeawayOrderBuilt = useCallback((output: { orderItems: OrderItem[]; customerName?: string; customerPhone?: string }) => {
    // Update formData with TAKEAWAY order items and optional customer details
    store.updateFormData({
      orderItems: output.orderItems,
      customerName: output.customerName || '',
      customerPhone: output.customerPhone || ''
    });

    setShowTakeawayModal(false);
    toast.success(`Sample order created with ${output.orderItems.length} items`);
  }, [store]);

  // Handler to open appropriate modal based on order mode
  const handleOpenSampleOrderModal = useCallback(() => {
    if (formData.orderMode === 'DINE-IN') {
      setShowDineInModal(true);
    } else {
      // WAITING, COLLECTION, DELIVERY all use takeaway modal
      setShowTakeawayModal(true);
    }
  }, [formData.orderMode]);

  const handleLoadTemplateFromModal = useCallback((templateData: any) => {
    // Load template data into store
    if (templateData?.design_data) {
      store.updateFormData(templateData.design_data);
      toast.success('Template loaded successfully');
    } else {
      // Legacy format support
      store.updateFormData(templateData);
      toast.success('Template loaded successfully');
    }
    setShowTemplateModal(false);
    setViewMode('editing'); // Transition to editing mode
  }, [store]);

  const handleBackToBrowsing = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to go back?')) {
        return;
      }
    }
    setViewMode('browsing');
  }, [hasUnsavedChanges]);

  // ==================== Keyboard Shortcuts ====================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process shortcuts in editing mode
      if (viewMode !== 'editing') return;

      // Ctrl+S: Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+D: Duplicate
      else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      }
      // Ctrl+E: Export
      else if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handleSave, handleDuplicate, handleExport]);

  // ==================== Render Helpers ====================

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-24">
      <Card className={`p-8 text-center ${InternalTheme.classes.surfaceCard}`}>
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <Loader2 
            className="h-12 w-12 animate-spin" 
            style={{ color: QSAITheme.purple.primary }}
          />
          <p 
            className="text-lg font-medium"
            style={{ color: QSAITheme.text.primary }}
          >
            Loading templates...
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex items-center justify-center py-24">
      <EmptyStateCard
        onCreateBlank={handleCreateBlank}
        onLoadFromLibrary={handleLoadFromLibrary}
        hasExistingTemplates={templatesList.length > 0}
      />
    </div>
  );

  const renderBrowsingState = () => (
    <div className="flex items-center justify-center p-8 py-24">
      <Card className={`max-w-2xl w-full text-center p-8 ${InternalTheme.classes.surfaceCard}`}>
        <CardContent className="flex flex-col items-center gap-6 pt-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-full" style={{ backgroundColor: `${QSAITheme.purple.primary}20` }}>
            <FolderOpen className="h-10 w-10" style={{ color: QSAITheme.purple.primary }} />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: QSAITheme.text.primary }}>
              {templatesList.length} Template{templatesList.length !== 1 ? 's' : ''} Available
            </h2>
            <p className="text-sm" style={{ color: QSAITheme.text.secondary }}>
              Select a template to edit or create a new one
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-md">
            <Button
              onClick={handleCreateBlank}
              className="w-full gap-2 py-6 text-base font-semibold"
              style={{
                background: QSAITheme.purple.primary,
                color: QSAITheme.text.primary
              }}
            >
              <FileText className="h-5 w-5" />
              Create New Template
            </Button>

            <Button
              onClick={handleBrowseTemplates}
              variant="outline"
              className="w-full gap-2 py-6 text-base"
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${QSAITheme.border.light}`,
                color: QSAITheme.text.secondary
              }}
            >
              <FolderOpen className="h-5 w-5" />
              Browse Existing Templates
            </Button>
          </div>

          {/* Quick template selector */}
          <div className="w-full mt-4">
            <p className="text-xs mb-3" style={{ color: QSAITheme.text.muted }}>
              Or select a template:
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {templatesList.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="px-4 py-3 text-left rounded transition-colors"
                  style={{
                    backgroundColor: QSAITheme.background.secondary,
                    border: `1px solid ${QSAITheme.border.light}`,
                    color: QSAITheme.text.primary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = QSAITheme.background.tertiary;
                    e.currentTarget.style.borderColor = QSAITheme.purple.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = QSAITheme.background.secondary;
                    e.currentTarget.style.borderColor = QSAITheme.border.light;
                  }}
                >
                  <p className="font-medium">{template.metadata.name}</p>
                  {template.metadata.description && (
                    <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                      {template.metadata.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEditingState = () => (
    <div className="flex flex-col h-dvh">
      {/* Header - Fixed */}
      <ReceiptDesignerHeader
        currentTemplate={currentTemplate}
        templatesList={templatesList}
        onTemplateSelect={handleTemplateSelect}
        onSave={handleSave}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onExport={handleExport}
        onShowAssignments={handleShowAssignments}
        hasUnsavedChanges={hasUnsavedChanges}
        onBrowseTemplates={handleBrowseTemplates}
        onBuildSampleOrder={handleOpenSampleOrderModal}
        onTemplateReloaded={loadTemplates}
        formatToggle={formatToggle}
      />

      {/* Template Format Indicator Badge */}
      <div className={`px-6 py-2 ${InternalTheme.classes.surfaceToolbar}`}>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">Template Format:</span>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: formatToggle === 'kitchen_customer'
                ? 'rgba(251, 191, 36, 0.2)'  // Amber for kitchen
                : 'rgba(139, 92, 246, 0.2)',   // Purple for FOH
              color: formatToggle === 'kitchen_customer' ? '#fbbf24' : '#a78bfa',
              border: `1px solid ${formatToggle === 'kitchen_customer' ? '#fbbf24' : '#a78bfa'}`
            }}
          >
            {formatToggle === 'kitchen_customer' ? '🍳 Kitchen Copy' : '📄 Front of House'}
          </span>
          <span className="text-xs text-white/40 ml-2">
            {formatToggle === 'kitchen_customer'
              ? 'Kitchen format: hides prices on DINE-IN, shows bold text'
              : 'Customer format: shows prices and payment details'}
          </span>
        </div>
      </div>

      {/* Main Content: Two-Column 50/50 Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Form (50%, scrollable) */}
        <div className="w-1/2 overflow-y-auto">
          <div className="p-4">
            <ReceiptDesignerAccordion
              isLoadingSettings={isLoadingSettings}
              onOpenSampleOrderModal={handleOpenSampleOrderModal}
            />
          </div>
        </div>

        {/* Right Column: Preview (50%, sticky) */}
        <div className="w-1/2 border-l border-white/[0.07]">
          <ReceiptPreviewV2
            formData={formData}
            formatToggle={formatToggle}
            paperWidth={store.paperWidth}
            isLoading={store.isLoading}
            onFormatChange={(format) => {
              store.setFormatToggle(format);
              store.updateFormField('receiptFormat', format);
              toast.success(`Switched to ${format === 'front_of_house' ? 'Front of House' : 'Kitchen Copy'} format`);
            }}
          />
        </div>
      </div>
    </div>
  );

  // ==================== Main Render (State Machine) ====================

  return (
    <>
      {/* Main View (State Machine) */}
      {(() => {
        switch (viewMode) {
          case 'loading':
            return renderLoadingState();
          case 'empty':
            return renderEmptyState();
          case 'browsing':
            return renderBrowsingState();
          case 'editing':
            return renderEditingState();
          default:
            return renderLoadingState();
        }
      })()}

      {/* Modals - Always Available Regardless of View Mode */}
      {showAssignmentModal && (
        <OrderModeAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          onAssignmentUpdate={() => {
            // Modal will auto-close, no additional action needed
          }}
        />
      )}

      <TemplateManagementModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        currentFormData={formData}
        onLoadTemplate={handleLoadTemplateFromModal}
      />

      <BuildSampleOrderModal
        isOpen={showDineInModal}
        onClose={() => setShowDineInModal(false)}
        onOrderBuilt={handleSampleOrderBuilt}
        initialOrderItems={formData.orderItems}
      />

      <BuildSampleTakeawayModal
        isOpen={showTakeawayModal}
        onClose={() => setShowTakeawayModal(false)}
        onOrderBuilt={handleTakeawayOrderBuilt}
        initialOrderItems={formData.orderItems}
      />
    </>
  );
}
