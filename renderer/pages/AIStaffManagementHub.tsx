import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  User, 
  Save, 
  ChevronLeft,
  ChevronRight,
  Upload, 
  X,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Mic,
  UserCircle,
  Eye,
  Play,
  Rocket,
  TestTube,
  Loader2,
  ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, API_URL } from 'app';

import { colors } from 'utils/designSystem';
import { styles } from 'utils/QSAIDesign';
import { injectAnimationStyles } from 'utils/animations';
import { UnifiedAgentConfigResponse, AgentProfileOutput, PublishWizardConfigRequest } from 'types';
import { MultiNationalityPassportCard } from 'components/MultiNationalityPassportCard';
import { WizardProgressStepper } from 'components/WizardProgressStepper';
import VoiceTester from 'components/VoiceTester';
import { MediaLibraryContent } from 'components/MediaLibraryContent';
import { MediaItem } from 'utils/mediaLibraryUtils';
import {
  validateField,
  validateIdentityStage,
  validateChatStage,
  validateVoiceStage,
  validatePublishReadiness,
  type ValidationError
} from 'utils/wizardValidation';
import { WizardPageSkeleton } from 'components/LoadingSkeleton';
import { 
  IdentityStageEmpty, 
  ChatStageEmpty, 
  VoiceStageEmpty, 
  PreviewPanelEmpty,
  NoAvatarPlaceholder 
} from 'components/EmptyState';
import { SuccessFeedback } from 'components/SuccessFeedback';
import { useKeyboardShortcuts } from 'utils/useKeyboardShortcuts';
import { useAnnouncer } from 'components/AriaLiveRegion';
import { useFocusTrap } from 'utils/a11y';

// Wizard stage type
type WizardStage = 'identity' | 'chat' | 'voice' | 'publish';

// Unified wizard state structure
interface WizardState {
  // Identity configuration
  identity: IdentityConfig;
  
  // ChatBot configuration
  chatBot: {
    system_prompt: string;
    tone: string[];
    custom_instructions: string;
  };
  
  // Voice configuration
  voice: {
    system_prompt: string;
    first_response: string;
    voice_model: string;
  };
  
  // Draft and publish state
  isDraft: boolean;
  isPublished: boolean;
  lastSaved: Date | null;
  lastPublished: Date | null;
  
  // Stage completion tracking
  stageCompletion: {
    identity: boolean;
    chat: boolean;
    voice: boolean;
  };
}

// Available nationality/passport options (matching COUNTRY_CONFIGS in MultiNationalityPassportCard)
const NATIONALITY_OPTIONS = [
  { value: 'British', label: '🇬🇧 British (UK)', code: 'GBR' },
  { value: 'American', label: '🇺🇸 American (USA)', code: 'USA' },
  { value: 'Indian', label: '🇮🇳 Indian', code: 'IND' },
  { value: 'Bangladeshi', label: '🇧🇩 Bangladeshi', code: 'BGD' },
  { value: 'Chinese', label: '🇨🇳 Chinese', code: 'CHN' },
  { value: 'Spanish', label: '🇪🇸 Spanish', code: 'ESP' },
  { value: 'Thai', label: '🇹🇭 Thai', code: 'THA' },
  { value: 'Turkish', label: '🇹🇷 Turkish', code: 'TUR' },
  { value: 'Emirati', label: '🇦🇪 Emirati (UAE)', code: 'ARE' },
  { value: 'German', label: '🇩🇪 German', code: 'DEU' },
  { value: 'French', label: '🇫🇷 French', code: 'FRA' },
  { value: 'Italian', label: '🇮🇹 Italian', code: 'ITA' },
] as const;

// Helper function to map nationality value to passport code
const getNationalityCode = (nationality: string): string => {
  const option = NATIONALITY_OPTIONS.find(opt => opt.value === nationality);
  return option?.code || 'GBR'; // Default to GBR if not found
};

interface IdentityConfig {
  name: string;
  title: string;
  nationality: string;
  tone: string;
  avatar_url: string | null;
  avatar_asset_id?: string | null; // Track asset_id for linking when agent is published
}

const AIStaffManagementHub: React.FC = () => {
  // URL state management
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStage = (searchParams.get('stage') as WizardStage) || 'identity';
  
  // Track if this is the initial mount
  const isInitialMount = useRef(true);
  
  // Wizard state
  const [wizardState, setWizardState] = useState<WizardState>({
    identity: {
      name: '',
      title: '',
      nationality: 'British',
      tone: 'friendly',
      avatar_url: null,
      avatar_asset_id: null,
    },
    chatBot: {
      system_prompt: '',
      tone: [],
      custom_instructions: '',
    },
    voice: {
      system_prompt: '',
      first_response: '',
      voice_model: 'Puck',
    },
    isDraft: false,
    isPublished: true,
    lastSaved: null,
    lastPublished: null,
    stageCompletion: {
      identity: false,
      chat: false,
      voice: false,
    },
  });

  // Completed stages tracking
  const [completedStages, setCompletedStages] = useState<Set<WizardStage>>(new Set());
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  
  // Dialog states
  const [unsavedChangesDialog, setUnsavedChangesDialog] = useState(false);
  const [pendingStage, setPendingStage] = useState<WizardStage | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Prompt generation loading states
  const [generatingChatPrompt, setGeneratingChatPrompt] = useState(false);
  const [generatingVoicePrompt, setGeneratingVoicePrompt] = useState(false);
  
  // Track user_portion vs complete_prompt separately for structured prompt architecture
  const [chatUserPortion, setChatUserPortion] = useState<string>('');
  const [chatCompletePrompt, setChatCompletePrompt] = useState<string>('');
  const [voiceUserPortion, setVoiceUserPortion] = useState<string>('');
  const [voiceCompletePrompt, setVoiceCompletePrompt] = useState<string>('');
  
  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  
  // Focus trap for modals (accessibility)
  useFocusTrap(unsavedChangesDialog);
  useFocusTrap(showPublishConfirm);
  useFocusTrap(showAvatarGallery);
  
  // Success feedback state
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);

  // Voice prompt source tracking
  const [promptSource, setPromptSource] = useState<'default' | 'custom'>('default');

  // Voice tester UI state
  const [voiceTesterExpanded, setVoiceTesterExpanded] = useState(false);
  
  // Mobile/tablet preview panel state
  const [previewPanelOpen, setPreviewPanelOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasMarkedCustom = useRef(false);

  // Validation state - track errors for each field
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Helper: Mark field as touched
  const markFieldTouched = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  };

  // Helper: Validate and update error for a single field
  const validateAndSetError = (fieldName: keyof typeof validationRules, value: string) => {
    const result = validateField(fieldName, value);
    setFieldErrors(prev => {
      const updated = { ...prev };
      if (result.isValid) {
        delete updated[fieldName];
      } else {
        updated[fieldName] = result.error!;
      }
      return updated;
    });
    return result.isValid;
  };

  // Helper component: Required field indicator
  const RequiredIndicator = () => (
    <span className="text-red-500 ml-1" aria-label="required">*</span>
  );

  // Helper component: Field validation icon
  const ValidationIcon = ({ state }: { state: 'idle' | 'valid' | 'invalid' }) => {
    if (state === 'valid') {
      return <CheckCircle2 className="h-4 w-4 transition-colors duration-200" style={{ color: colors.accent.turquoise }} />;
    }
    if (state === 'invalid') {
      return <AlertCircle className="h-4 w-4 transition-colors duration-200" style={{ color: '#EF4444' }} />;
    }
    return null;
  };

  // Helper component for error messages with shake animation
  const ErrorMessage = ({ fieldName }: { fieldName: string }) => {
    if (!touchedFields.has(fieldName) || !fieldErrors[fieldName]) return null;
    const errorId = `${fieldName}-error`;
    return (
      <p 
        id={errorId}
        className="text-xs mt-1 flex items-center gap-1" 
        style={{ 
          color: '#EF4444',
          animation: 'slideDown 200ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        role="alert"
      >
        <AlertCircle className="h-3 w-3" />
        {fieldErrors[fieldName]}
      </p>
    );
  };

  // Helper: Get field validation state (for styling)
  const getFieldState = (fieldName: string, value: string): 'idle' | 'valid' | 'invalid' => {
    if (!touchedFields.has(fieldName)) return 'idle';
    return fieldErrors[fieldName] ? 'invalid' : 'valid';
  };

  // Stage transition animation state
  const [isStageTransitioning, setIsStageTransitioning] = useState(false);
  const [stageTransitionDirection, setStageTransitionDirection] = useState<'forward' | 'backward'>('forward');
  const previousStageRef = useRef<WizardStage>(currentStage);

  // Inject animation styles on mount
  useEffect(() => {
    injectAnimationStyles();
  }, []);

  // Helper: Get field validation state (for styling)
  const getBorderColor = (state: 'idle' | 'valid' | 'invalid'): string => {
    if (state === 'valid') return colors.accent.turquoise;
    if (state === 'invalid') return '#EF4444';
    return colors.border.medium;
  };

  // Keyboard shortcuts for wizard navigation
  useKeyboardShortcuts([
    {
      key: '1',
      altKey: true,
      description: 'Navigate to Identity stage',
      action: () => handleStageClick('identity'),
    },
    {
      key: '2',
      altKey: true,
      description: 'Navigate to Chat stage',
      action: () => handleStageClick('chat'),
    },
    {
      key: '3',
      altKey: true,
      description: 'Navigate to Voice stage',
      action: () => handleStageClick('voice'),
    },
    {
      key: '4',
      altKey: true,
      description: 'Navigate to Publish stage',
      action: () => handleStageClick('publish'),
    },
    {
      key: 'Escape',
      description: 'Close dialogs',
      action: () => {
        if (unsavedChangesDialog) setUnsavedChangesDialog(false);
        if (showPublishConfirm) setShowPublishConfirm(false);
        if (showAvatarGallery) setShowAvatarGallery(false);
      },
    },
  ]);

  // Load configuration on mount
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setIsLoading(true);
        
        // Fetch unified_agent_config as single source of truth
        const agentResponse = await fetch(`${API_URL}/get-unified-agent-config`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!agentResponse.ok) {
          throw new Error(`Failed to load agent config: ${agentResponse.statusText}`);
        }
        
        const agentData: UnifiedAgentConfigResponse = await agentResponse.json();
        
        if (agentData) {
          await populateWizardState(agentData);
        }
        
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error loading configuration:', error);
        toast.error('Failed to load configuration');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConfiguration();
  }, []);
  
  // Track unsaved changes (skip initial render)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setHasUnsavedChanges(true);
  }, [wizardState]);

  const populateWizardState = async (config: UnifiedAgentConfigResponse) => {
    // Extract voice prompt from config
    const voicePromptFromDB = (config.channel_settings as any)?.voice?.system_prompt || '';
    
    // Determine prompt and source
    let finalVoicePrompt = voicePromptFromDB;
    let finalPromptSource: 'default' | 'custom' = voicePromptFromDB ? 'custom' : 'default';
    
    // If no prompt in DB, fetch the default
    if (!voicePromptFromDB) {
      try {
        const response = await apiClient.get_active_voice_prompt();
        const data = await response.json();
        if (data.prompt) {
          finalVoicePrompt = data.prompt;
          finalPromptSource = data.source || 'default';
        }
      } catch (error) {
        console.error('Error loading default voice prompt:', error);
        // Continue with empty prompt if default fetch fails
      }
    }
    
    setWizardState({
      identity: {
        name: config.agent_name || '',
        title: config.agent_role || 'Restaurant Assistant',
        nationality: (config.personality_settings as any)?.nationality || 'British',
        tone: (config.personality_settings as any)?.core_traits || '',
        avatar_url: config.agent_avatar_url || null,
        avatar_asset_id: config.agent_avatar_url ? 'placeholder' : null,
      },
      chatBot: {
        system_prompt: (config.channel_settings as any)?.chat?.system_prompt || '',
        tone: [],
        custom_instructions: '',
      },
      voice: {
        system_prompt: finalVoicePrompt,
        first_response: (config.channel_settings as any)?.voice?.first_response || '',
        voice_model: (config.channel_settings as any)?.voice?.voice_model || 'en-US-Neural2-A',
      },
      isDraft: false,
      isPublished: true,
      lastSaved: config.updated_at ? new Date(config.updated_at) : null,
      lastPublished: config.updated_at ? new Date(config.updated_at) : null,
      stageCompletion: {
        identity: !!(config.agent_name || config.agent_role),
        chat: !!(config.channel_settings as any)?.chat?.system_prompt,
        voice: !!finalVoicePrompt,
      },
    });
    
    // Set prompt source state
    setPromptSource(finalPromptSource);
    
    // Mark completed stages
    const completed = new Set<WizardStage>();
    if (config.agent_name || config.agent_role) completed.add('identity');
    if ((config.channel_settings as any)?.chat?.system_prompt) completed.add('chat');
    if (finalVoicePrompt) completed.add('voice');
    setCompletedStages(completed);
  };

  // Handle publish to production
  const handlePublish = async () => {
    try {
      // Validate all stages comprehensively
      const validation = validatePublishReadiness(wizardState);
      
      if (!validation.isValid) {
        // Mark all invalid fields as touched so user sees all errors
        validation.errors.forEach(err => {
          markFieldTouched(err.field);
        });
        
        // Group errors by stage for better feedback
        const errorsByStage: Record<string, string[]> = {};
        validation.errors.forEach(err => {
          const stage = err.field.includes('name') || err.field.includes('title') || err.field.includes('nationality') 
            ? 'Identity'
            : err.field.includes('chat') || err.field.includes('Chat')
            ? 'Chat'
            : 'Voice';
          
          if (!errorsByStage[stage]) errorsByStage[stage] = [];
          errorsByStage[stage].push(err.message);
        });
        
        // Create detailed error message
        const stageNames = Object.keys(errorsByStage);
        const errorSummary = stageNames.map(stage => 
          `${stage}: ${errorsByStage[stage].join(', ')}`
        ).join(' | ');
        
        toast.error(
          'Cannot publish - validation errors found',
          {
            description: `Please fix errors in: ${stageNames.join(', ')} stages`,
            duration: 6000,
          }
        );
        
        // Navigate to first incomplete stage to help user
        if (validation.errors[0]) {
          const firstErrorField = validation.errors[0].field;
          let targetStage: WizardStage = 'identity';
          
          if (firstErrorField.includes('chat') || firstErrorField.includes('Chat')) {
            targetStage = 'chat';
          } else if (firstErrorField.includes('voice') || firstErrorField.includes('Voice') || 
                     firstErrorField.includes('first') || firstErrorField.includes('Model')) {
            targetStage = 'voice';
          }
          
          // Navigate to the stage with errors
          setTimeout(() => navigateToStage(targetStage), 500);
        }
        
        return;
      }

      // Show confirmation dialog if validation passes
      setShowPublishConfirm(true);
    } catch (error) {
      console.error('Error validating publish:', error);
      toast.error('Failed to validate configuration', {
        description: 'An unexpected error occurred',
        duration: 4000,
      });
    }
  };

  // Fetch active voice prompt from database (default template)
  const fetchActivePrompt = async () => {
    try {
      const response = await apiClient.get_active_voice_prompt();
      const data = await response.json();
      if (data.prompt) {
        setWizardState(prev => ({
          ...prev,
          voice: {
            ...prev.voice,
            system_prompt: data.prompt,
          },
        }));
        setPromptSource(data.source || 'default');
      }
    } catch (error) {
      console.error('Error fetching active voice prompt:', error);
    }
  };

  // Confirm and execute publish
  const confirmPublish = async () => {
    try {
      setPublishing(true);
      setShowPublishConfirm(false);

      // Prepare publish request
      const publishRequest: PublishWizardConfigRequest = {
        agent_name: wizardState.identity.name,
        agent_role: wizardState.identity.title,
        nationality: wizardState.identity.nationality,
        agent_avatar_url: wizardState.identity.avatar_url || null,
        chat_system_prompt: wizardState.chatBot.system_prompt || wizardState.voice.system_prompt, // Fallback to voice prompt
        chat_custom_instructions: wizardState.chatBot.custom_instructions || null,
        voice_system_prompt: wizardState.voice.system_prompt,
        voice_first_response: wizardState.voice.first_response,
        voice_model: wizardState.voice.voice_model,
      };

      console.log('📤 Publishing configuration:', publishRequest);

      // Call publish endpoint
      const response = await apiClient.publish_wizard_config(publishRequest);  // ✅ FIX
      const data = await response.json();

      console.log('✅ Publish successful:', data);

      // Update local state
      const now = new Date();
      setWizardState(prev => ({
        ...prev,
        isPublished: true,
        lastPublished: now,
        lastSaved: now,
        isDraft: false,
      }));

      // Show success animation instead of toast
      setShowPublishSuccess(true);

    } catch (error) {
      console.error('❌ Publish error:', error);
      toast.error('Failed to publish configuration', {
        description: error instanceof Error ? error.message : 'Please try again or contact support.',
        duration: 5000,
      });
    } finally {
      setPublishing(false);
    }
  };

  // Helper function to convert wizard state to AgentProfile for preview
  const convertToAgentProfile = (state: WizardState): AgentProfileOutput => {
    return {
      id: 'preview',
      name: state.identity.name || 'AI Assistant',
      description: state.identity.title || 'AI Voice Assistant',
      avatar_url: (state.identity as any).avatar_url || null,
      voice_type: state.voice.voice_model || 'en-GB-Neural2-B',
      personality: state.identity.tone || 'friendly',
      gender: null,
      nationality: state.identity.nationality || 'British',
      passport_nationality: getNationalityCode(state.identity.nationality),
      creation_date: null,
      created_at: null,
      is_default: false
    };
  };

  const handleStageClick = (stage: WizardStage) => {
    if (hasUnsavedChanges) {
      setPendingStage(stage);
      setUnsavedChangesDialog(true);
    } else {
      navigateToStage(stage);
    }
  };
  
  const navigateToStage = (stage: WizardStage) => {
    setSearchParams({ stage });
    setHasUnsavedChanges(false);
  };
  
  const handleDiscardAndNavigate = () => {
    if (pendingStage) {
      navigateToStage(pendingStage);
      setPendingStage(null);
    }
    setUnsavedChangesDialog(false);
  };

  const handleBack = () => {
    const stages: WizardStage[] = ['identity', 'chat', 'voice', 'publish'];
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex > 0) {
      handleStageClick(stages[currentIndex - 1]);
    }
  };

  const handleSaveAndContinue = async () => {
    // Save current stage
    await handleSaveCurrentStage();
    
    // Mark current stage as completed
    setCompletedStages(prev => new Set(prev).add(currentStage));
    
    // Navigate to next stage
    const stages: WizardStage[] = ['identity', 'chat', 'voice', 'publish'];
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex < stages.length - 1) {
      navigateToStage(stages[currentIndex + 1]);
    }
  };

  const handleSaveCurrentStage = async () => {
    try {
      setIsSaving(true);
      
      // Validate current stage before saving
      let validationResult: StageValidationResult;
      
      if (currentStage === 'identity') {
        validationResult = validateIdentityStage(wizardState.identity);
      } else if (currentStage === 'chat') {
        validationResult = validateChatStage(wizardState.chatBot);
      } else if (currentStage === 'voice') {
        validationResult = validateVoiceStage(wizardState.voice);
      } else {
        // Publish stage doesn't save, it publishes
        validationResult = { isValid: true, errors: [], missingFields: [] };
      }
      
      // If validation fails, show errors and prevent save
      if (!validationResult.isValid) {
        const firstError = validationResult.errors[0];
        toast.error(
          `Cannot save ${currentStage} stage`,
          {
            description: firstError ? firstError.message : 'Please fix validation errors',
            duration: 4000,
          }
        );
        
        // Mark all invalid fields as touched so user sees errors
        validationResult.errors.forEach(err => {
          markFieldTouched(err.field);
        });
        
        return; // Stop save if validation fails
      }
      
      // Build update payload based on current stage
      const updates: any = {};
      
      if (currentStage === 'identity') {
        updates.agent_name = wizardState.identity.name;
        updates.agent_role = wizardState.identity.title;
        updates.personality_settings = {
          nationality: wizardState.identity.nationality,
          core_traits: wizardState.identity.tone,
        };
      } else if (currentStage === 'chat') {
        updates.channel_settings = {
          chat: {
            system_prompt: wizardState.chatBot.system_prompt,
            tone: wizardState.chatBot.tone,
            custom_instructions: wizardState.chatBot.custom_instructions,
          },
        };
      } else if (currentStage === 'voice') {
        updates.channel_settings = {
          voice: {
            system_prompt: wizardState.voice.system_prompt,
            first_response: wizardState.voice.first_response,
            voice_model: wizardState.voice.voice_model,
          },
        };
      }
      
      await API_CLIENT.update_unified_agent_config(updates);
      
      setWizardState(prev => ({
        ...prev,
        lastSaved: new Date(),
        isDraft: false,
      }));
      
      setHasUnsavedChanges(false);
      
      // Show success animation instead of toast
      setShowSaveSuccess(true);
    } catch (error) {
      console.error('Error saving stage:', error);
      toast.error('Failed to save stage', {
        description: error instanceof Error ? error.message : 'Please try again',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, or WebP');
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 2MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      // Use new avatar-gallery endpoint that uses actual filename
      const response = await API_CLIENT.upload_avatar({ file } as any);
      const result = await response.json();
      
      if (result.url) {
        setWizardState(prev => ({
          ...prev,
          identity: {
            ...prev.identity,
            avatar_url: result.url,
          },
        }));
        toast.success('Avatar uploaded successfully!');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      // Check if it's the max limit error
      if (error?.message?.includes('Maximum 8 avatars')) {
        toast.error('Maximum 8 avatars allowed. Delete one first.');
      } else {
        toast.error('Failed to upload avatar');
      }
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarSelect = (asset: MediaItem) => {
    // Extract WebP URL from metadata (prefer square variant for avatars)
    const avatarUrl = asset.metadata?.webp_urls?.square || asset.url;
    
    setWizardState(prev => ({
      ...prev,
      identity: {
        ...prev.identity,
        avatar_url: avatarUrl || null,
        avatar_asset_id: asset.id || null, // Track asset_id for linking when agent is published
      },
    }));
    
    if (avatarUrl) {
      toast.success(`Avatar "${asset.friendly_name || asset.file_name}" selected!`);
    }
    
    setShowAvatarGallery(false);
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      await API_CLIENT.update_unified_agent_config({ agent_avatar_url: null });  // ✅ FIX
      
      setWizardState(prev => ({
        ...prev,
        identity: {
          ...prev.identity,
          avatar_url: null,
        },
      }));
      
      toast.success('Avatar removed');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleGenerateChatPrompt = async () => {
    try {
      setGeneratingChatPrompt(true);
      const response = await API_CLIENT.generate_system_prompt({ channel: 'chat' });
      const data = await response.json();
      
      if (data.user_portion && data.complete_prompt) {
        // NEW: Store both portions separately
        setChatUserPortion(data.user_portion);
        setChatCompletePrompt(data.complete_prompt);
        
        // Update wizard state with user_portion only (editable)
        setWizardState(prev => ({
          ...prev,
          chatBot: {
            ...prev.chatBot,
            system_prompt: data.user_portion, // Only USER portion is editable
          },
        }));
        
        toast.success('Chat prompt generated successfully!');
      } else {
        // Fallback to legacy prompt field if new structure not available
        setWizardState(prev => ({
          ...prev,
          chatBot: {
            ...prev.chatBot,
            system_prompt: data.prompt || '',
          },
        }));
        toast.success('Chat prompt generated (legacy format)');
      }
    } catch (error) {
      console.error('Error generating chat prompt:', error);
      toast.error('Failed to generate chat prompt');
    } finally {
      setGeneratingChatPrompt(false);
    }
  };

  const handleGenerateVoicePrompt = async () => {
    try {
      setGeneratingVoicePrompt(true);
      const response = await API_CLIENT.generate_system_prompt({ channel: 'voice' });
      const data = await response.json();
      
      if (data.user_portion && data.complete_prompt) {
        // NEW: Store both portions separately
        setVoiceUserPortion(data.user_portion);
        setVoiceCompletePrompt(data.complete_prompt);
        
        // Update wizard state with user_portion only (editable)
        setWizardState(prev => ({
          ...prev,
          voice: {
            ...prev.voice,
            system_prompt: data.user_portion, // Only USER portion is editable
          },
        }));
        
        toast.success('Voice prompt generated successfully!');
      } else {
        // Fallback to legacy prompt field if new structure not available
        setWizardState(prev => ({
          ...prev,
          voice: {
            ...prev.voice,
            system_prompt: data.prompt || '',
          },
        }));
        toast.success('Voice prompt generated (legacy format)');
      }
    } catch (error) {
      console.error('Error generating voice prompt:', error);
      toast.error('Failed to generate voice prompt');
    } finally {
      setGeneratingVoicePrompt(false);
    }
  };

  const handleRevertToDefaultPrompt = async () => {
    try {
      // Fetch the default hardcoded prompt
      const response = await API_CLIENT.get_active_voice_prompt();
      const data = await response.json();
      
      // Only revert if we actually get the default prompt
      if (data.prompt && data.source === 'default') {
        setWizardState(prev => ({
          ...prev,
          voice: {
            ...prev.voice,
            system_prompt: data.prompt
          }
        }));
        setPromptSource('default');
        hasMarkedCustom.current = false; // Reset so it can be marked custom again
        toast.success('Reverted to default system prompt');
      } else {
        toast.error('Unable to load default prompt');
      }
    } catch (error) {
      console.error('Error reverting to default prompt:', error);
      toast.error('Failed to revert to default prompt');
    }
  };

  // Show loading skeleton during initial data fetch
  if (isLoading) {
    return <WizardPageSkeleton />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: colors.background.primary }}>
      {/* Success Feedback Overlays */}
      {showSaveSuccess && (
        <SuccessFeedback 
          type="save" 
          onComplete={() => setShowSaveSuccess(false)}
        />
      )}
      {showPublishSuccess && (
        <SuccessFeedback 
          type="publish" 
          message="🚀 Your AI agent is live!"
          onComplete={() => setShowPublishSuccess(false)}
          duration={4000}
        />
      )}

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold" style={styles.purpleGradientText}>
          AI Staff Management Wizard
        </h1>
        <p className="text-xs sm:text-sm" style={{ color: colors.text.secondary }}>
          Configure your AI agent through a guided 4-stage workflow
        </p>
      </div>

      {/* Progress Stepper */}
      <WizardProgressStepper
        currentStage={currentStage}
        completedStages={completedStages}
        onStageClick={handleStageClick}
      />

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* LEFT PANEL: Configuration */}
        <div className="space-y-4 sm:space-y-6">
          <Card style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl" style={{ color: colors.text.primary }}>
                {currentStage === 'identity' && 'Agent Identity'}
                {currentStage === 'chat' && 'Chat Bot Personality'}
                {currentStage === 'voice' && 'Voice Assistant'}
                {currentStage === 'publish' && 'Review & Publish'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {/* Stage content wrapper with transition animations */}
              <div
                key={currentStage}
                style={{
                  animation: !isStageTransitioning 
                    ? 'fadeInSlideUp 400ms ease-out'
                    : stageTransitionDirection === 'forward'
                      ? 'fadeOutLeft 300ms ease-in-out'
                      : 'fadeOutRight 300ms ease-in-out'
                }}
              >
                {/* STAGE 1: Identity */}
                {currentStage === 'identity' && (
                  <>
                    {/* Show empty state if no name yet */}
                    {!wizardState.identity.name && !touchedFields.has('name') && (
                      <IdentityStageEmpty />
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="agent-name" className="text-sm" style={{ color: colors.text.primary }}>Name</Label>
                        <RequiredIndicator />
                        <div className="ml-auto">
                          <ValidationIcon state={getFieldState('name', wizardState.identity.name)} />
                        </div>
                      </div>
                      <Input
                        id="agent-name"
                        value={wizardState.identity.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setWizardState(prev => ({
                            ...prev,
                            identity: { ...prev.identity, name: value }
                          }));
                          if (touchedFields.has('name')) {
                            validateAndSetError('name', value);
                          }
                        }}
                        onBlur={(e) => {
                          markFieldTouched('name');
                          validateAndSetError('name', e.target.value);
                        }}
                        placeholder="Agent name (e.g., Uncle Raj)"
                        className="input-animated transition-all duration-200 h-11 focus:scale-[1.01] focus:shadow-lg"
                        style={{
                          backgroundColor: colors.background.tertiary,
                          borderColor: getBorderColor(getFieldState('name', wizardState.identity.name)),
                          color: colors.text.primary
                        }}
                        aria-required="true"
                        aria-invalid={fieldErrors['name'] ? 'true' : 'false'}
                        aria-describedby={fieldErrors['name'] ? 'name-error' : undefined}
                      />
                      <ErrorMessage fieldName="name" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="agent-title" className="text-sm" style={{ color: colors.text.primary }}>Title / Role</Label>
                        <RequiredIndicator />
                        <div className="ml-auto">
                          <ValidationIcon state={getFieldState('title', wizardState.identity.title)} />
                        </div>
                      </div>
                      <Input
                        id="agent-title"
                        value={wizardState.identity.title}
                        onChange={(e) => {
                          const value = e.target.value;
                          setWizardState(prev => ({
                            ...prev,
                            identity: { ...prev.identity, title: value }
                          }));
                          if (touchedFields.has('title')) {
                            validateAndSetError('title', value);
                          }
                        }}
                        onBlur={(e) => {
                          markFieldTouched('title');
                          validateAndSetError('title', e.target.value);
                        }}
                        placeholder="Agent role (e.g., Restaurant Assistant)"
                        className="input-animated transition-all duration-200"
                        style={{
                          backgroundColor: colors.background.tertiary,
                          borderColor: getBorderColor(getFieldState('title', wizardState.identity.title)),
                          color: colors.text.primary
                        }}
                        aria-required="true"
                        aria-invalid={fieldErrors['title'] ? 'true' : 'false'}
                        aria-describedby={fieldErrors['title'] ? 'title-error' : undefined}
                      />
                      <ErrorMessage fieldName="title" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="nationality" className="text-sm" style={{ color: colors.text.primary }}>Nationality</Label>
                        <RequiredIndicator />
                        <div className="ml-auto">
                          <ValidationIcon state={getFieldState('nationality', wizardState.identity.nationality)} />
                        </div>
                      </div>
                      <Select
                        value={wizardState.identity.nationality}
                        onValueChange={(value) => {
                          setWizardState(prev => ({
                            ...prev,
                            identity: { ...prev.identity, nationality: value }
                          }));
                          markFieldTouched('nationality');
                          validateAndSetError('nationality', value);
                        }}
                      >
                        <SelectTrigger
                          id="nationality"
                          className="input-animated transition-all duration-200"
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: getBorderColor(getFieldState('nationality', wizardState.identity.nationality)),
                            color: colors.text.primary
                          }}
                          aria-required="true"
                          aria-invalid={fieldErrors['nationality'] ? 'true' : 'false'}
                          aria-describedby={fieldErrors['nationality'] ? 'nationality-error' : undefined}
                        >
                          <SelectValue placeholder="Select nationality..." />
                        </SelectTrigger>
                        <SelectContent
                          style={{
                            backgroundColor: colors.background.secondary,
                            borderColor: colors.border.medium,
                          }}
                        >
                          {NATIONALITY_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              style={{ color: colors.text.primary }}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ErrorMessage fieldName="nationality" />
                    </div>

                    <div className="space-y-2">
                      <Label style={{ color: colors.text.primary }}>Avatar Photo</Label>
                      <div className="flex items-center gap-3">
                        {wizardState.identity.avatar_url ? (
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={wizardState.identity.avatar_url || undefined} />
                            <AvatarFallback style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                              <User className="h-10 w-10" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <NoAvatarPlaceholder size="large" />
                        )}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAvatarClick}
                            disabled={isUploadingAvatar}
                            className="btn-animated"
                            style={{ borderColor: colors.brand.purple }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAvatarGallery(true)}
                            disabled={isUploadingAvatar}
                            className="btn-animated"
                            style={{ borderColor: colors.brand.silver }}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Choose Existing
                          </Button>
                          {wizardState.identity.avatar_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleRemoveAvatar}
                              disabled={isUploadingAvatar}
                              className="btn-animated"
                              style={{ borderColor: colors.text.tertiary }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* STAGE 2: Chat Bot */}
                {currentStage === 'chat' && (
                  <>
                    {/* Show empty state if no chat prompt yet */}
                    {!wizardState.chatBot.system_prompt && !touchedFields.has('chatSystemPrompt') && (
                      <ChatStageEmpty />
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="chat-system-prompt">System Prompt</Label>
                          <RequiredIndicator />
                          <div className="ml-2">
                            <ValidationIcon state={getFieldState('chatSystemPrompt', wizardState.chatBot.system_prompt)} />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateChatPrompt}
                          disabled={generatingChatPrompt}
                          className="btn-animated"
                          style={{ borderColor: colors.brand.purple }}
                        >
                          {generatingChatPrompt ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            '✨ Generate Prompt'
                          )}
                        </Button>
                      </div>
                      <Textarea
                        id="chat-system-prompt"
                        rows={6}
                        value={wizardState.chatBot.system_prompt}
                        onChange={(e) => {
                          const value = e.target.value;
                          setWizardState(prev => ({
                            ...prev,
                            chatBot: { ...prev.chatBot, system_prompt: value }
                          }));
                          if (touchedFields.has('chatSystemPrompt')) {
                            validateAndSetError('chatSystemPrompt', value);
                          }
                        }}
                        onBlur={(e) => {
                          markFieldTouched('chatSystemPrompt');
                          validateAndSetError('chatSystemPrompt', e.target.value);
                        }}
                        placeholder="Enter the system prompt that defines how the chat bot should behave and respond to customers..."
                        maxLength={50000}
                        className="input-animated transition-all duration-200 sm:rows-8 md:rows-10"
                        style={{
                          backgroundColor: colors.background.tertiary,
                          borderColor: getBorderColor(getFieldState('chatSystemPrompt', wizardState.chatBot.system_prompt)),
                          color: colors.text.primary
                        }}
                        aria-required="true"
                        aria-invalid={fieldErrors['chatSystemPrompt'] ? 'true' : 'false'}
                        aria-describedby={fieldErrors['chatSystemPrompt'] ? 'chatSystemPrompt-error' : undefined}
                      />
                      <div className="flex items-center justify-between">
                        <ErrorMessage fieldName="chatSystemPrompt" />
                        <p className="text-xs ml-auto" style={{ color: colors.text.tertiary }}>
                          {wizardState.chatBot.system_prompt.length} / 50,000 characters
                        </p>
                      </div>
                      
                      {/* NEW: Complete Prompt Preview (read-only) */}
                      {chatCompletePrompt && (
                        <Accordion type="single" collapsible className="mt-4">
                          <AccordionItem value="complete-prompt" style={{ borderColor: colors.border.medium }}>
                            <AccordionTrigger 
                              className="text-sm hover:no-underline"
                              style={{ color: colors.text.secondary }}
                            >
                              📋 View Complete Prompt (with CORE instructions)
                            </AccordionTrigger>
                            <AccordionContent>
                              <div 
                                className="p-4 rounded-md font-mono text-xs whitespace-pre-wrap"
                                style={{
                                  backgroundColor: colors.background.tertiary,
                                  border: `1px solid ${colors.border.medium}`,
                                  color: colors.text.tertiary,
                                  maxHeight: '400px',
                                  overflowY: 'auto'
                                }}
                              >
                                {chatCompletePrompt}
                              </div>
                              <p className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
                                Complete prompt: {chatCompletePrompt.length.toLocaleString()} characters (includes CORE instructions + your customizations)
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>

                    {/* ... existing custom instructions field stays unchanged ... */}
                    <div className="space-y-2">
                      <Label htmlFor="custom-instructions" className="text-sm" style={{ color: colors.text.primary }}>Custom Instructions</Label>
                      <Textarea
                        id="custom-instructions"
                        value={wizardState.chatBot.custom_instructions}
                        onChange={(e) => setWizardState(prev => ({
                          ...prev,
                          chatBot: { ...prev.chatBot, custom_instructions: e.target.value }
                        }))}
                        placeholder="Additional custom instructions..."
                        rows={4}
                        className="input-animated sm:rows-5"
                        style={{
                          backgroundColor: colors.background.tertiary,
                          borderColor: colors.border.medium,
                          color: colors.text.primary
                        }}
                      />
                    </div>
                  </>
                )}

                {/* STAGE 3: Voice */}
                {currentStage === 'voice' && (
                  <>
                    {/* Show empty state if no voice prompt yet */}
                    {!wizardState.voice.system_prompt && !touchedFields.has('voiceSystemPrompt') && (
                      <VoiceStageEmpty />
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="voice-prompt" className="text-sm" style={{ color: colors.text.primary }}>Voice System Prompt</Label>
                          <RequiredIndicator />
                          <Badge 
                            variant={promptSource === 'default' ? 'secondary' : 'default'}
                            className={promptSource === 'default' ? 'badge-pulse' : ''}
                            style={{ 
                              backgroundColor: promptSource === 'default' ? colors.background.highlight : colors.brand.purple,
                              color: colors.text.primary,
                              fontSize: '0.75rem'
                            }}
                          >
                            {promptSource === 'default' ? '🔒 Using Default' : '✏️ Custom Prompt'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {promptSource === 'custom' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleRevertToDefaultPrompt}
                              className="btn-animated"
                              style={{ borderColor: colors.text.tertiary }}
                            >
                              🔄 Revert to Default
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateVoicePrompt}
                            disabled={generatingVoicePrompt}
                            className="btn-animated"
                            style={{ borderColor: colors.brand.purple }}
                          >
                            {generatingVoicePrompt ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              '✨ Generate Prompt'
                            )}
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        id="voice-prompt"
                        value={wizardState.voice.system_prompt}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          console.log('🔍 [Voice Textarea] onChange fired:', {
                            eventType: e.type,
                            inputType: (e.nativeEvent as InputEvent).inputType,
                            newValue,
                            valueLength: newValue.length,
                            currentStateValue: wizardState.voice.system_prompt,
                          });
                          
                          // Mark as custom on first edit
                          if (promptSource === 'default' && !hasMarkedCustom.current) {
                            console.log('🏷️ [Voice Textarea] Marking as custom prompt (one-time)');
                            hasMarkedCustom.current = true;
                            setPromptSource('custom');
                          }
                          
                          setWizardState(prev => ({
                            ...prev,
                            voice: {
                              ...prev.voice,
                              system_prompt: newValue,
                            },
                          }));
                          
                          if (touchedFields.has('voiceSystemPrompt')) {
                            validateAndSetError('voiceSystemPrompt', newValue);
                          }
                        }}
                        onBlur={(e) => {
                          markFieldTouched('voiceSystemPrompt');
                          validateAndSetError('voiceSystemPrompt', e.target.value);
                        }}
                        rows={6}
                        placeholder="Enter the system prompt for your voice assistant..."
                        maxLength={50000}
                        className="input-animated transition-all duration-200 sm:rows-8 md:rows-10"
                        style={{
                          backgroundColor: colors.background.tertiary,
                          borderColor: getBorderColor(getFieldState('voiceSystemPrompt', wizardState.voice.system_prompt)),
                          color: colors.text.primary
                        }}
                        aria-required="true"
                        aria-invalid={fieldErrors['voiceSystemPrompt'] ? 'true' : 'false'}
                        aria-describedby={fieldErrors['voiceSystemPrompt'] ? 'voiceSystemPrompt-error' : undefined}
                      />
                      <div className="flex items-center justify-between">
                        <ErrorMessage fieldName="voiceSystemPrompt" />
                        <p className="text-xs ml-auto" style={{ color: colors.text.tertiary }}>
                          Your customizations: {wizardState.voice.system_prompt.length.toLocaleString()} / 50,000 characters
                        </p>
                      </div>
                      
                      {/* NEW: Complete Prompt Preview (read-only) */}
                      {voiceCompletePrompt && (
                        <Accordion type="single" collapsible className="mt-4">
                          <AccordionItem value="complete-prompt" style={{ borderColor: colors.border.medium }}>
                            <AccordionTrigger 
                              className="text-sm hover:no-underline"
                              style={{ color: colors.text.secondary }}
                            >
                              📋 View Complete Prompt (with CORE instructions)
                            </AccordionTrigger>
                            <AccordionContent>
                              <div 
                                className="p-4 rounded-md font-mono text-xs whitespace-pre-wrap"
                                style={{
                                  backgroundColor: colors.background.tertiary,
                                  border: `1px solid ${colors.border.medium}`,
                                  color: colors.text.tertiary,
                                  maxHeight: '400px',
                                  overflowY: 'auto'
                                }}
                              >
                                {voiceCompletePrompt}
                              </div>
                              <p className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
                                Complete prompt: {voiceCompletePrompt.length.toLocaleString()} characters (includes CORE instructions + your customizations + voice optimizations)
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="first-response" className="text-sm" style={{ color: colors.text.primary }}>First Response / Greeting</Label>
                        <RequiredIndicator />
                        <div className="ml-auto">
                          <ValidationIcon state={getFieldState('firstResponse', wizardState.voice.first_response)} />
                        </div>
                      </div>
                      <Input
                        id="first-response"
                        value={wizardState.voice.first_response}
                        onChange={(e) => {
                          const value = e.target.value;
                          setWizardState(prev => ({
                            ...prev,
                            voice: { ...prev.voice, first_response: value }
                          }));
                          if (touchedFields.has('firstResponse')) {
                            validateAndSetError('firstResponse', value);
                          }
                        }}
                        onBlur={(e) => {
                          markFieldTouched('firstResponse');
                          validateAndSetError('firstResponse', e.target.value);
                        }}
                        placeholder="Hello! Welcome to Cottage Tandoori..."
                        maxLength={500}
                        className="input-animated transition-all duration-200"
                        style={{
                          backgroundColor: colors.background.tertiary,
                          borderColor: getBorderColor(getFieldState('firstResponse', wizardState.voice.first_response)),
                          color: colors.text.primary
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <ErrorMessage fieldName="firstResponse" />
                        <p className="text-xs ml-auto" style={{ color: colors.text.tertiary }}>
                          {wizardState.voice.first_response.length} / 500 characters
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="voice-model" className="text-sm" style={{ color: colors.text.primary }}>Voice Model</Label>
                        <RequiredIndicator />
                        <div className="ml-auto">
                          <ValidationIcon state={getFieldState('voiceModel', wizardState.voice.voice_model)} />
                        </div>
                      </div>
                      <Select
                        value={wizardState.voice.voice_model}
                        onValueChange={(value) => {
                          setWizardState(prev => ({
                            ...prev,
                            voice: { ...prev.voice, voice_model: value }
                          }));
                          markFieldTouched('voiceModel');
                          validateAndSetError('voiceModel', value);
                        }}
                      >
                        <SelectTrigger
                          className="input-animated transition-all duration-200"
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: getBorderColor(getFieldState('voiceModel', wizardState.voice.voice_model)),
                            color: colors.text.primary
                          }}
                        >
                          <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent
                          style={{
                            backgroundColor: colors.background.secondary,
                            borderColor: colors.border.medium,
                          }}
                        >
                          {GEMINI_VOICE_OPTIONS.map((voice) => (
                            <SelectItem
                              key={voice.value}
                              value={voice.value}
                              style={{
                                color: colors.text.primary,
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{voice.label}</span>
                                <span className="text-xs" style={{ color: colors.text.tertiary }}>
                                  {voice.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ErrorMessage fieldName="voiceModel" />
                      <p className="text-xs" style={{ color: colors.text.tertiary }}>
                        Choose from Gemini Live API voice personalities
                      </p>
                    </div>
                    
                    {/* Standalone Save Button for Voice Stage */}
                    <div className="pt-4 border-t" style={{ borderColor: colors.border.medium }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge
                          variant={wizardState.isPublished ? 'default' : 'outline'}
                          className={wizardState.isPublished ? 'bg-green-600 text-white' : 'border-yellow-600 text-yellow-600'}
                        >
                          {wizardState.isPublished ? '✅ Published' : '⚠️ Unpublished changes'}
                        </Badge>
                      </div>
                      {wizardState.lastPublished && (
                        <p className="text-xs mb-4" style={{ color: colors.text.tertiary }}>
                          Last published: {wizardState.lastPublished.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between items-stretch sm:items-center">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStage === 'identity'}
              className="btn-animated w-full sm:w-auto"
              style={{ borderColor: colors.text.secondary, color: colors.text.secondary, minHeight: '44px' }}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {/* Mobile/Tablet Preview Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setPreviewPanelOpen(!previewPanelOpen)}
              className="btn-animated lg:hidden w-full sm:w-auto"
              style={{ borderColor: colors.brand.purple, color: colors.brand.purple, minHeight: '44px' }}
            >
              <Eye className="h-4 w-4 mr-2 icon-rotate-hover" />
              {previewPanelOpen ? 'Hide Preview' : 'Show Preview'}
            </Button>

            <Button
              onClick={handleSaveAndContinue}
              disabled={isSaving}
              className="btn-animated bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white w-full sm:w-auto"
              style={{ minHeight: '44px' }}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : currentStage === 'publish' ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              ) : (
                <>
                  Save & Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
          
          {/* Mobile/Tablet Collapsible Preview Panel */}
          {previewPanelOpen && (
            <div className="lg:hidden space-y-4 sm:space-y-6 border-t pt-4 sm:pt-6" style={{ borderColor: colors.border.medium }}>
              {/* Persistent Passport Card */}
              <Card className="card-stagger card-stagger-1" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg" style={{ color: colors.text.primary }}>Live Agent Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <MultiNationalityPassportCard
                    agent={convertToAgentProfile(wizardState)}
                  />
                </CardContent>
              </Card>

              {/* Contextual Preview */}
              <Card className="card-stagger card-stagger-2" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}>
                <CardContent className="p-4 sm:p-6">
                  {currentStage === 'identity' && (
                    <div className="space-y-4">
                      {wizardState.identity.name ? (
                        <>
                          <div className="text-center space-y-3 p-4 rounded" style={{ backgroundColor: colors.background.tertiary }}>
                            <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                              Agent Introduction Preview
                            </p>
                            <div className="text-base italic p-4 rounded" style={{ 
                              backgroundColor: colors.background.primary,
                              borderLeft: `4px solid ${colors.accent.turquoise}`,
                              color: colors.text.primary 
                            }}>
                              "Hello! I'm <span style={{ color: colors.brand.purple, fontWeight: 'bold' }}>{wizardState.identity.name}</span>, 
                              your {wizardState.identity.title || '[Title]'}.
                              {wizardState.identity.tone && (
                                <>
                                  <br /><br />
                                  {wizardState.identity.tone}
                                </>
                              )}"
                            </div>
                          </div>
                          
                          <div className="text-xs text-center" style={{ color: colors.text.tertiary }}>
                            This is how your agent will introduce itself to customers
                          </div>
                        </>
                      ) : (
                        <PreviewPanelEmpty stage="identity" />
                      )}
                    </div>
                  )}

                  {currentStage === 'chat' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Chat Preview</p>
                          {wizardState.chatBot.system_prompt && (
                            <Badge variant="outline" style={{ borderColor: colors.accent.turquoise, color: colors.accent.turquoise }}>
                              ✓ Configured
                            </Badge>
                          )}
                        </div>
                        
                        {wizardState.chatBot.system_prompt ? (
                          <div className="space-y-3">
                            {/* Sample Chat Conversation */}
                            <div className="space-y-2 p-4 rounded" style={{ backgroundColor: colors.background.tertiary }}>
                              {/* User message */}
                              <div className="flex justify-end">
                                <div className="max-w-[80%] p-3 rounded-lg" style={{ backgroundColor: colors.brand.purple }}>
                                  <p className="text-sm text-white">What's your most popular dish?</p>
                                </div>
                              </div>
                              
                              {/* Agent response */}
                              <div className="flex justify-start">
                                <div className="max-w-[80%] p-3 rounded-lg" style={{ 
                                  backgroundColor: colors.background.primary,
                                  borderLeft: `3px solid ${colors.accent.turquoise}`
                                }}>
                                  <p className="text-sm" style={{ color: colors.text.primary }}>
                                    {wizardState.identity.name ? `Hi! I'm ${wizardState.identity.name}. ` : ''}
                                    Based on my system prompt, I'll help answer your questions with the personality and tone you've configured.
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-xs" style={{ color: colors.text.tertiary }}>
                              💡 The chat bot will use your system prompt to guide all conversations
                            </div>
                          </div>
                        ) : (
                          <PreviewPanelEmpty stage="chat" />
                        )}
                      </div>
                    </div>
                  )}

                  {currentStage === 'voice' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Voice Testing</p>
                          {wizardState.voice.system_prompt && (
                            <Badge variant="outline" className="badge-pulse" style={{ borderColor: colors.accent.turquoise, color: colors.accent.turquoise }}>
                              ✓ Configured
                            </Badge>
                          )}
                        </div>
                        
                        {wizardState.voice.system_prompt ? (
                          <>
                            <div className="p-3 rounded" style={{ backgroundColor: colors.background.tertiary }}>
                              <p className="text-xs mb-2" style={{ color: colors.text.secondary }}>First Response:</p>
                              <p className="text-sm italic" style={{ color: colors.text.primary }}>
                                "{wizardState.voice.first_response || 'No first response set'}"
                              </p>
                            </div>
                            
                            <div className="p-3 rounded" style={{ backgroundColor: colors.background.tertiary }}>
                              <p className="text-xs mb-1" style={{ color: colors.text.secondary }}>Voice Model:</p>
                              <p className="text-sm font-mono" style={{ color: colors.accent.turquoise }}>
                                {wizardState.voice.voice_model}
                              </p>
                            </div>
                            
                            <p className="text-xs text-center" style={{ color: colors.text.tertiary }}>
                              Voice tester available on desktop view
                            </p>
                          </>
                        ) : (
                          <PreviewPanelEmpty stage="voice" />
                        )}
                      </div>
                    </div>
                  )}

                  {currentStage === 'publish' && (
                    <div className="space-y-4">
                      <div className="text-center space-y-3">
                        {completedStages.size === 3 ? (
                          <>
                            <div className="p-6 rounded-lg" style={{ 
                              backgroundColor: colors.background.tertiary,
                              border: `2px solid ${colors.accent.turquoise}`
                            }}>
                              <CheckCircle2 className="h-12 w-12 mx-auto mb-3" style={{ color: colors.accent.turquoise }} />
                              <p className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
                                All Systems Ready! ✅
                              </p>
                              <p className="text-sm" style={{ color: colors.text.secondary }}>
                                Your AI agent is fully configured and ready to deploy
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-6 rounded-lg" style={{ 
                              backgroundColor: colors.background.tertiary,
                              border: `2px solid ${colors.accent.gold}`
                            }}>
                              <AlertCircle className="h-12 w-12 mx-auto mb-3" style={{ color: colors.accent.gold }} />
                              <p className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
                                Configuration Incomplete
                              </p>
                              <p className="text-sm" style={{ color: colors.text.secondary }}>
                                Complete all stages before publishing
                              </p>
                            </div>
                          </>
                        )}
                        
                        <div className="text-xs pt-4" style={{ color: colors.text.tertiary }}>
                          Publishing will make your configuration live for all customers
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Live Preview */}
        <div className="space-y-6">
          {/* Persistent Passport Card */}
          <Card className="card-stagger card-stagger-1" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}>
            <CardHeader>
              <CardTitle style={{ color: colors.text.primary }}>Live Agent Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <MultiNationalityPassportCard
                agent={convertToAgentProfile(wizardState)}
              />
            </CardContent>
          </Card>

          {/* Contextual Preview */}
          <Card className="card-stagger card-stagger-2" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}>
            <CardContent className="p-6">
              {currentStage === 'identity' && (
                <IdentityPreview
                  agentName={wizardState.identity.name}
                  title={wizardState.identity.title}
                  nationality={wizardState.identity.nationality}
                  avatar={wizardState.identity.avatar_url || undefined}
                  isEmpty={!wizardState.identity.name && !wizardState.identity.title}
                />
              )}

              {currentStage === 'chat' && (
                <ChatPreview
                  agentName={wizardState.identity.name}
                  systemPrompt={wizardState.chatBot.system_prompt}
                  tone={wizardState.chatBot.tone?.join(', ')}
                  isEmpty={!wizardState.chatBot.system_prompt}
                />
              )}

              {currentStage === 'voice' && (
                <div className="space-y-4">
                  <VoicePreview
                    agentName={wizardState.identity.name}
                    firstResponse={wizardState.voice.first_response}
                    voiceModel={wizardState.voice.voice_model}
                    systemPrompt={wizardState.voice.system_prompt}
                    isEmpty={!wizardState.voice.system_prompt}
                  />
                  
                  {/* Collapsible Voice Tester */}
                  {wizardState.voice.system_prompt && (
                    <div className="border rounded" style={{ borderColor: colors.border.medium }}>
                      <button
                        onClick={() => setVoiceTesterExpanded(!voiceTesterExpanded)}
                        className="w-full p-3 flex items-center justify-between hover:bg-opacity-50 transition-colors"
                        style={{ backgroundColor: voiceTesterExpanded ? colors.background.tertiary : 'transparent' }}
                      >
                        <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                          🎙️ Live Voice Tester
                        </span>
                        <ChevronRight 
                          className={`h-4 w-4 transition-transform ${voiceTesterExpanded ? 'rotate-90' : ''}`}
                          style={{ color: colors.text.secondary }}
                        />
                      </button>
                      
                      {voiceTesterExpanded && (
                        <div className="p-4 border-t" style={{ borderColor: colors.border.medium }}>
                          <VoiceTester 
                            systemPrompt={voiceCompletePrompt}
                            firstResponse={wizardState.voice.first_response}
                            voiceModel={wizardState.voice.voice_model}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {wizardState.voice.system_prompt && !voiceTesterExpanded && (
                    <p className="text-xs text-center" style={{ color: colors.text.tertiary }}>
                      Click above to test your voice configuration live
                    </p>
                  )}
                </div>
              )}

              {currentStage === 'publish' && (
                <PublishPreview
                  agentName={wizardState.identity.name}
                  nationality={wizardState.identity.nationality}
                  voiceModel={wizardState.voice.voice_model}
                  systemPrompt={wizardState.chatBot.system_prompt}
                  firstResponse={wizardState.voice.first_response}
                  onPublish={handlePublish}
                  isPublishing={publishing}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={unsavedChangesDialog} onOpenChange={setUnsavedChangesDialog}>
        <AlertDialogContent 
          className="modal-content"
          style={{ backgroundColor: colors.background.primary, borderColor: colors.border.medium }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: colors.text.primary }}>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription style={{ color: colors.text.secondary }}>
              You have unsaved changes in this stage. Do you want to discard them and navigate away?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ borderColor: colors.border.medium, color: colors.text.secondary }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardAndNavigate}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <AlertDialogContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: colors.text.primary }}>
              Publish AI Agent to Production?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: colors.text.secondary }}>
              This will make your AI agent configuration live for all customers across Chat, Voice, and Widget interfaces. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={publishing}
              style={{ borderColor: colors.border.medium, color: colors.text.secondary }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPublish}
              disabled={publishing}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Avatar Picker Dialog */}
      <Dialog open={showAvatarGallery} onOpenChange={setShowAvatarGallery}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Choose Avatar</DialogTitle>
            <DialogDescription>
              Select an avatar from your library. Only AI Staff avatars are shown.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-6 pb-6">
            <MediaLibraryContent 
              selectionMode="pick"
              onAssetSelect={handleAvatarSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIStaffManagementHub;

// Voice model options for Gemini Live API
const GEMINI_VOICE_OPTIONS = [
  { value: 'Puck', label: 'Puck', description: 'Friendly and conversational (default)' },
  { value: 'Charon', label: 'Charon', description: 'Deep and authoritative' },
  { value: 'Kore', label: 'Kore', description: 'Neutral and professional' },
  { value: 'Fenrir', label: 'Fenrir', description: 'Excitable and energetic' },
  { value: 'Aoede', label: 'Aoede', description: 'Breezy and light' },
  { value: 'Zephyr', label: 'Zephyr', description: 'Bright and cheerful' },
  { value: 'Leda', label: 'Leda', description: 'Youthful and fresh' },
  { value: 'Orus', label: 'Orus', description: 'Firm and steady' },
];

// Preview components
import { ChatPreview } from 'components/ChatPreview';
import { VoicePreview } from 'components/VoicePreview';
import { IdentityPreview } from 'components/IdentityPreview';
import { PublishPreview } from 'components/PublishPreview';
