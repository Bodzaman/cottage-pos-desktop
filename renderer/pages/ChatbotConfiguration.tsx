import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, Settings, Bot, Zap, CheckCircle, AlertCircle, ExternalLink, HelpCircle, Brain, MessageSquare, Sliders, Upload, Image, User, Edit3, EyeOff, Activity, BarChart3, Users, TrendingUp, Clock, AlertTriangle, Database } from 'lucide-react';
import { apiClient } from 'app';
import type { 
  ChatbotPromptResponse, 
  ChatbotPromptCreate, 
  ChatbotPromptUpdate 
} from 'types';
import { ImageUploadBrowser } from 'components/ImageUploadBrowser';
import ChatHealthIndicator from 'components/ChatHealthIndicator';
import { useChatActions } from 'utils/chat-store';

// Import design system
import { colors } from 'utils/designSystem';
import { styles } from 'utils/QSAIDesign';

interface AvailableModels {
  openai: string[];
  google: string[];
}

interface ChatbotPromptFormData {
  name: string;
  description: string;
  systemPrompt: string;
  modelProvider: 'openai' | 'google';
  modelName: string;
  temperature: number;
  maxTokens: number;
  reasoningEffort: 'minimal' | 'low' | 'medium' | 'high';
  verbosity: 'low' | 'medium' | 'high';
  safetyThreshold: 'low' | 'medium' | 'high' | 'block_none';
  topP: number;
  topK: number;
  published: boolean;
  avatarUrl: string;
}

// Smart restaurant defaults
const defaultFormData: ChatbotPromptFormData = {
  name: '',
  description: '',
  systemPrompt: 'You are a helpful AI assistant for Cottage Tandoori Restaurant. You help customers with menu questions, take orders, answer questions about allergens, opening hours, and reservations. Be friendly, professional, and knowledgeable about Indian cuisine.',
  modelProvider: 'openai',
  modelName: 'gpt-5', // Updated to GPT-5 as the new default
  temperature: 0.4, // Balanced for customer service
  maxTokens: 250, // Good for restaurant inquiries
  reasoningEffort: 'medium',
  verbosity: 'medium',
  safetyThreshold: 'medium',
  topP: 0.9,
  topK: 40,
  published: false,
  avatarUrl: ''
};

// Tooltip content with performance optimization focus
const tooltips = {
  aiBrain: "Choose which AI model to use. GPT-5 = smartest responses, GPT-5-mini = faster responses",
  responseStyle: "How creative vs focused the AI sounds. Lower = more consistent, Higher = more varied responses",
  responseLength: "Maximum words in AI responses. 150 = short answers, 500 = detailed explanations",
  personality: "Instructions that define how your AI assistant behaves and talks to customers",
  publishStatus: "Draft = only you can see it, Published = live on your website",
  reasoning: "⚡ SPEED IMPACT: How much the AI thinks before responding. Minimal = <3 seconds (fastest), Low = 3-5 seconds, Medium = 5-10 seconds, High = 10+ seconds (slowest)",
  verbosity: "⚡ SPEED IMPACT: How detailed the AI responses are. Low = brief & faster, Medium = balanced, High = detailed but slower",
  safety: "Content filtering level. Medium recommended for restaurants",
  topP: "Advanced setting that affects response variety. Keep at 0.9 for best results",
  topK: "Advanced setting for response selection. Keep at 40 for balanced results"
};

// Helper component for tooltip labels
const TooltipLabel: React.FC<{ label: string; tooltip: string; required?: boolean }> = ({ label, tooltip, required }) => (
  <div className="flex items-center gap-2">
    <Label style={{ color: colors.text.primary }}>{label}{required && ' *'}</Label>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-4 w-4 cursor-help" style={{ color: colors.text.secondary }} />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </div>
);

// Chat Analytics Refresh Button Component
const ChatAnalyticsRefreshButton: React.FC<{
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: Date | null;
  colors: any;
}> = ({ onRefresh, loading, lastUpdated, colors }) => {
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm" style={{ color: colors.text.secondary }}>
        Last updated: {formatLastUpdated(lastUpdated)}
      </div>
      <Button
        onClick={onRefresh}
        disabled={loading}
        size="sm"
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Refreshing...
          </>
        ) : (
          <>
            <Activity className="h-4 w-4 mr-2" />
            Refresh Analytics
          </>
        )}
      </Button>
    </div>
  );
};

export default function ChatbotConfiguration() {
  const [prompts, setPrompts] = useState<ChatbotPromptResponse[]>([]);
  const [activePrompt, setActivePrompt] = useState<ChatbotPromptResponse | null>(null);
  const [availableModels, setAvailableModels] = useState<AvailableModels>({ openai: [], google: [] });
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<ChatbotPromptResponse | null>(null);
  const [formData, setFormData] = useState<ChatbotPromptFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tab state for the dialog
  const [activeTab, setActiveTab] = useState('basic');

  // Avatar state management (following working pattern from AgentManagementPanel)
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>('');
  const [selectedAvatarFilename, setSelectedAvatarFilename] = useState<string>('');

  // NEW: Chatbot configuration state
  const [chatbotConfig, setChatbotConfig] = useState<any>(null);
  const [chatbotName, setChatbotName] = useState<string>('Cottage Tandoori Assistant');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Chat Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [lastAnalyticsUpdate, setLastAnalyticsUpdate] = useState<Date | null>(null);
  
  // Model filtering state
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [compareModels, setCompareModels] = useState<boolean>(false);

  // Add schema setup state
  const [schemaSetupLoading, setSchemaSetupLoading] = useState(false);
  const [schemaSetupSuccess, setSchemaSetupSuccess] = useState(false);

  // Chat store actions for real-time config updates
  const { loadChatbotConfig } = useChatActions();

  // Design system styles
  const cardStyle = {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.medium,
    color: colors.text.primary
  };

  // Avatar handling functions (following working pattern)
  const handleAvatarSelect = (imageUrl: string, filename: string) => {
    setSelectedAvatarUrl(imageUrl);
    setSelectedAvatarFilename(filename);
    setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
  };

  const clearAvatar = () => {
    setSelectedAvatarUrl('');
    setSelectedAvatarFilename('');
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
  };

  // Analytics functions
  const refreshAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      
      // Load analytics data with model filtering
      const [conversationResponse, realTimeResponse] = await Promise.all([
        apiClient.get_conversation_analytics({ 
          model_filter: modelFilter !== 'all' ? modelFilter : undefined,
          compare_models: compareModels 
        }),
        apiClient.get_real_time_stats()
      ]);
      
      const conversationData = await conversationResponse.json();
      const realTimeData = await realTimeResponse.json();
      
      // Handle potential error responses
      if (conversationData.error || realTimeData.error) {
        throw new Error(conversationData.error || realTimeData.error);
      }
      
      // Extract model performance data correctly
      const modelPerfData = conversationData.model_performance || [];
      const openaiModel = modelPerfData.find(m => m.model && (m.model.includes('gpt') || m.model.includes('openai'))) || {};
      const googleModel = modelPerfData.find(m => m.model && (m.model.includes('gemini') || m.model.includes('google'))) || {};
      
      // Combine the data for display - include ALL backend response fields
      const combinedAnalytics = {
        ...conversationData, // Include full backend response
        metrics: {
          activeSessions: realTimeData.active_sessions || conversationData.metrics?.activeSessions || 0,
          messagesTotal: conversationData.metrics?.messagesTotal || 0,
          avgResponseTime: conversationData.metrics?.avgResponseTime || '0.0ms',
          ordersGenerated: conversationData.metrics?.ordersGenerated || 0,
          conversationRate: conversationData.metrics?.conversationRate || 0,
          satisfaction: conversationData.metrics?.satisfaction || 0
        },
        modelPerformance: {
          openai: {
            responseTime: openaiModel.avg_response_time ? `${openaiModel.avg_response_time}ms` : conversationData.modelPerformance?.openai?.responseTime || '0.0ms',
            messagesHandled: openaiModel.messages_handled || conversationData.modelPerformance?.openai?.messagesHandled || 0,
            orderConversion: openaiModel.conversion_rate || conversationData.modelPerformance?.openai?.orderConversion || 0,
            satisfaction: openaiModel.satisfaction || 0
          },
          google: {
            responseTime: googleModel.avg_response_time ? `${googleModel.avg_response_time}ms` : conversationData.modelPerformance?.google?.responseTime || '0.0ms',
            messagesHandled: googleModel.messages_handled || conversationData.modelPerformance?.google?.messagesHandled || 0,
            orderConversion: googleModel.conversion_rate || conversationData.modelPerformance?.google?.orderConversion || 0,
            satisfaction: googleModel.satisfaction || 0
          }
        },
        // Add new model performance data for enhanced comparison
        model_performance: modelPerfData,
        filter_applied: conversationData.filter_applied || 'all',
        compare_mode: conversationData.compare_mode || false
      };
      
      console.log('📊 Analytics data processed:', combinedAnalytics);
      
      setAnalyticsData(combinedAnalytics);
      setLastAnalyticsUpdate(new Date());
      
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      setAnalyticsError(error.message || 'Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Add schema setup function
  const setupAnalyticsSchema = async () => {
    try {
      setSchemaSetupLoading(true);
      setAnalyticsError(null);
      
      console.log('🚀 Setting up chat analytics schema...');
      const response = await apiClient.setup_chat_analytics_schema();
      const result = await response.json();
      
      console.log('✅ Schema setup result:', result);
      
      if (result.success) {
        setSchemaSetupSuccess(true);
        toast.success('Chat analytics tables created successfully!');
        
        // Automatically refresh analytics after successful setup
        setTimeout(() => {
          refreshAnalytics();
        }, 1000);
      } else {
        throw new Error(result.message || 'Schema setup failed');
      }
      
    } catch (error: any) {
      console.error('❌ Schema setup error:', error);
      setAnalyticsError(error.message || 'Failed to setup analytics schema');
      toast.error('Failed to setup analytics tables');
    } finally {
      setSchemaSetupLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load prompts, active prompt, available models, and chatbot config in parallel
      const [promptsResponse, activeResponse, modelsResponse, configResponse] = await Promise.all([
        apiClient.list_chatbot_prompts(),
        apiClient.get_active_prompt(),
        apiClient.get_available_models(),
        apiClient.get_chatbot_config()
      ]);

      const promptsData = await promptsResponse.json();
      const activeData = await activeResponse.json();
      const modelsData = await modelsResponse.json();
      const configData = await configResponse.json();

      setPrompts(promptsData || []);
      setActivePrompt(activeData);
      setAvailableModels(modelsData || { openai: [], google: [] });
      
      // NEW: Load existing chatbot configuration
      if (configData) {
        setChatbotConfig(configData);
        setChatbotName(configData.name || 'Cottage Tandoori Assistant');
        if (configData.avatar_url) {
          setSelectedAvatarUrl(configData.avatar_url);
          setFormData(prev => ({ ...prev, avatarUrl: configData.avatar_url }));
        }
      }
      
      // Load analytics data
      await refreshAnalytics();
      
    } catch (error) {
      console.error('Error loading chatbot configuration:', error);
      toast.error('Failed to load chatbot configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async () => {
    try {
      setIsSubmitting(true);
      
      const createData: ChatbotPromptCreate = {
        name: formData.name,
        description: formData.description || undefined,
        system_prompt: formData.systemPrompt,
        model_provider: formData.modelProvider,
        model_name: formData.modelName,
        temperature: formData.temperature,
        max_tokens: formData.maxTokens,
        reasoning_effort: formData.reasoningEffort,
        verbosity: formData.verbosity,
        safety_threshold: formData.safetyThreshold,
        top_p: formData.topP,
        top_k: formData.topK,
        published: formData.published,
        avatar_url: selectedAvatarUrl || formData.avatarUrl || undefined
      };
      
      const response = await apiClient.create_chatbot_prompt(createData);
      const result = await response.json();
      
      if (response.ok && result) {
        toast.success('Chatbot prompt created successfully');
        
        // If this prompt is published, update chatbot configuration
        if (formData.published) {
          await saveChatbotConfiguration(result.id);
        }
        
        setIsCreateDialogOpen(false);
        resetForm();
        loadData(); // Reload to get updated data
      } else {
        toast.error('Failed to create chatbot prompt');
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast.error('Failed to create chatbot prompt');
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Save chatbot configuration function
  const saveChatbotConfiguration = async (activePromptId?: string) => {
    try {
      setIsSavingConfig(true);
      
      const configData = {
        avatar_url: selectedAvatarUrl || null,
        active_prompt_id: activePromptId || activePrompt?.id || ''
      };
      
      const response = await apiClient.update_chatbot_config(configData);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setChatbotConfig(result.config);
        toast.success('Chatbot configuration updated successfully');
        
        // Trigger real-time config reload for all chat instances
        await loadChatbotConfig();
        
        return true;
      } else {
        toast.error(result.message || 'Failed to update chatbot configuration');
        return false;
      }
    } catch (error) {
      console.error('Error saving chatbot config:', error);
      toast.error('Failed to save chatbot configuration');
      return false;
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleEditPrompt = async () => {
    if (!editingPrompt) return;
    
    try {
      setIsSubmitting(true);
      
      const updateData: ChatbotPromptUpdate = {
        name: formData.name !== editingPrompt.name ? formData.name : undefined,
        description: formData.description !== editingPrompt.description ? formData.description || undefined : undefined,
        system_prompt: formData.systemPrompt !== editingPrompt.systemPrompt ? formData.systemPrompt : undefined,
        model_provider: formData.modelProvider !== editingPrompt.modelProvider ? formData.modelProvider : undefined,
        model_name: formData.modelName !== editingPrompt.modelName ? formData.modelName : undefined,
        temperature: formData.temperature !== editingPrompt.temperature ? formData.temperature : undefined,
        max_tokens: formData.maxTokens !== editingPrompt.maxTokens ? formData.maxTokens : undefined,
        reasoning_effort: formData.reasoningEffort !== editingPrompt.reasoningEffort ? formData.reasoningEffort : undefined,
        verbosity: formData.verbosity !== editingPrompt.verbosity ? formData.verbosity : undefined,
        safety_threshold: formData.safetyThreshold !== editingPrompt.safetyThreshold ? formData.safetyThreshold : undefined,
        top_p: formData.topP !== editingPrompt.topP ? formData.topP : undefined,
        top_k: formData.topK !== editingPrompt.topK ? formData.topK : undefined,
        published: formData.published !== editingPrompt.published ? formData.published : undefined
      };

      const response = await apiClient.update_chatbot_prompt({ promptId: editingPrompt.id }, updateData);
      const updatedPrompt = await response.json();

      setPrompts(prev => prev.map(p => p.id === updatedPrompt.id ? updatedPrompt : p));
      setIsEditDialogOpen(false);
      setEditingPrompt(null);
      setFormData(defaultFormData);
      // Clear avatar state after successful update
      setSelectedAvatarUrl('');
      setSelectedAvatarFilename('');
      
      toast.success(`Prompt "${updatedPrompt.name}" updated successfully`);
      
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast.error('Failed to update prompt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrompt = async (prompt: ChatbotPromptResponse) => {
    try {
      await apiClient.delete_chatbot_prompt({ promptId: prompt.id });
      setPrompts(prev => prev.filter(p => p.id !== prompt.id));
      toast.success(`Prompt "${prompt.name}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.error('Failed to delete prompt');
    }
  };

  const handleSetActive = async (prompt: ChatbotPromptResponse) => {
    try {
      const response = await apiClient.set_active_prompt({ prompt_id: prompt.id });
      const result = await response.json();
      
      setActivePrompt(result.activePrompt);
      setPrompts(prev => prev.map(p => ({ ...p, isActive: p.id === prompt.id })));
      
      toast.success(`"${prompt.name}" is now the active prompt`);
    } catch (error) {
      console.error('Error setting active prompt:', error);
      toast.error('Failed to set active prompt');
    }
  };

  const handlePublishToggle = async (prompt: ChatbotPromptResponse) => {
    try {
      const response = prompt.published 
        ? await apiClient.unpublish_prompt({ promptId: prompt.id })
        : await apiClient.publish_prompt({ promptId: prompt.id });
      
      const updatedPrompt = await response.json();
      setPrompts(prev => prev.map(p => p.id === updatedPrompt.id ? updatedPrompt : p));
      
      toast.success(`Prompt "${prompt.name}" ${prompt.published ? 'unpublished' : 'published'} successfully`);
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update publish status');
    }
  };

  const openEditDialog = (prompt: ChatbotPromptResponse) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description || '',
      systemPrompt: prompt.system_prompt,
      modelProvider: prompt.model_provider as 'openai' | 'google',
      modelName: prompt.model_name,
      temperature: prompt.temperature,
      maxTokens: prompt.max_tokens,
      reasoningEffort: prompt.reasoning_effort as 'minimal' | 'low' | 'medium' | 'high',
      verbosity: prompt.verbosity as 'low' | 'medium' | 'high',
      safetyThreshold: prompt.safety_threshold as 'low' | 'medium' | 'high' | 'block_none',
      topP: prompt.top_p,
      topK: prompt.top_k,
      published: prompt.published,
      avatarUrl: prompt.avatar_url || ''
    });
    // Set avatar state from existing prompt data
    setSelectedAvatarUrl(prompt.avatar_url || '');
    setSelectedAvatarFilename(''); // We don't have filename from existing prompts
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingPrompt(null);
    // Clear avatar state
    setSelectedAvatarUrl('');
    setSelectedAvatarFilename('');
  };

  const getModelOptions = () => {
    return formData.modelProvider === 'openai' ? availableModels.openai : availableModels.google;
  };

  if (loading) {
    return (
      <div className="space-y-6" style={{ minHeight: '100vh', backgroundColor: colors.background.primary }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bot className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: colors.brand.purple }} />
            <p style={{ color: colors.text.secondary }}>Loading chatbot configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6" style={{ minHeight: '100vh', backgroundColor: colors.background.primary, padding: '24px' }}>
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold" style={styles.purpleGradientText}>
            AI Personality & Instructions
          </h1>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            Teach your AI assistant how to talk to customers and handle inquiries for your restaurant
          </p>
        </div>

        {/* Active Prompt Status */}
        {activePrompt && (
          <Card style={cardStyle} className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg" style={{ color: colors.text.primary }}>Currently Active Assistant</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  LIVE ON WEBSITE
                </Badge>
              </div>
              <CardDescription style={{ color: colors.text.secondary }}>
                <span className="font-medium">{activePrompt.name}</span> is currently helping your customers
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Create New Assistant Button */}
        <div className="flex justify-end">
          <Button 
            onClick={() => setIsCreateDialogOpen(true)} 
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New AI Assistant
          </Button>
        </div>

        {/* AI Assistants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <Card key={prompt.id} style={cardStyle} className={`relative transition-all duration-200 hover:scale-[1.02] ${
              prompt.isActive ? 'border-green-500 shadow-green-100 dark:shadow-green-900/20' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg" style={{ color: colors.text.primary }}>{prompt.name}</CardTitle>
                      {prompt.isActive && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                          ACTIVE
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2" style={{ color: colors.text.secondary }}>
                      {prompt.description || 'No description provided'}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant={prompt.modelProvider === 'openai' ? 'default' : 'secondary'}>
                    {prompt.modelProvider === 'openai' ? 'ChatGPT' : 'Google AI'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {prompt.modelName}
                  </Badge>
                  {prompt.published ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Draft
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(prompt)}
                      className="flex items-center gap-1"
                      style={{ borderColor: colors.border.medium, color: colors.text.primary }}
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    
                    {prompt.published && !prompt.isActive && (
                      <Button
                        size="sm"
                        onClick={() => handleSetActive(prompt)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                      >
                        <Zap className="h-3 w-3" />
                        Set Active
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePublishToggle(prompt)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {prompt.published ? 'Unpublish (make private)' : 'Publish (make available)'}
                      </TooltipContent>
                    </Tooltip>
                    
                    {!prompt.isActive && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle style={{ color: colors.text.primary }}>Delete AI Assistant</AlertDialogTitle>
                            <AlertDialogDescription style={{ color: colors.text.secondary }}>
                              Are you sure you want to delete "{prompt.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel style={{ borderColor: colors.border.medium, color: colors.text.secondary }}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePrompt(prompt)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {prompts.length === 0 && (
            <Card style={cardStyle} className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="h-12 w-12 mb-4" style={{ color: colors.text.secondary }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>No AI assistants created yet</h3>
                <p className="text-center mb-4" style={{ color: colors.text.secondary }}>
                  Create your first AI assistant to help customers with questions, orders, and restaurant information.
                </p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)} 
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First AI Assistant
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}>
          <DialogContent 
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.medium,
              color: colors.text.primary
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                <Brain className="h-5 w-5" style={{ color: colors.brand.purple }} />
                {editingPrompt ? `Edit AI Assistant: "${editingPrompt.name}"` : 'Create New AI Assistant'}
              </DialogTitle>
              <DialogDescription style={{ color: colors.text.secondary }}>
                {editingPrompt 
                  ? 'Update your AI assistant\'s personality and behavior for customer interactions'
                  : 'Set up how your AI assistant will talk to customers and handle restaurant inquiries'
                }
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4" style={{ backgroundColor: colors.background.secondary }}>
                <TabsTrigger 
                  value="basic" 
                  className="flex items-center gap-2"
                  style={{
                    color: activeTab === 'basic' ? colors.text.primary : colors.text.secondary,
                    backgroundColor: activeTab === 'basic' ? colors.background.tertiary : 'transparent'
                  }}
                >
                  <Bot className="h-4 w-4" />
                  Basic Setup
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-brain" 
                  className="flex items-center gap-2"
                  style={{
                    color: activeTab === 'ai-brain' ? colors.text.primary : colors.text.secondary,
                    backgroundColor: activeTab === 'ai-brain' ? colors.background.tertiary : 'transparent'
                  }}
                >
                  <Settings className="h-4 w-4" />
                  AI Brain Selection
                </TabsTrigger>
                <TabsTrigger 
                  value="fine-tuning" 
                  className="flex items-center gap-2"
                  style={{
                    color: activeTab === 'fine-tuning' ? colors.text.primary : colors.text.secondary,
                    backgroundColor: activeTab === 'fine-tuning' ? colors.background.tertiary : 'transparent'
                  }}
                >
                  <Activity className="h-4 w-4" />
                  Fine-tuning
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2"
                  style={{
                    color: activeTab === 'analytics' ? colors.text.primary : colors.text.secondary,
                    backgroundColor: activeTab === 'analytics' ? colors.background.tertiary : 'transparent'
                  }}
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <TooltipLabel 
                      label="Assistant Name" 
                      tooltip="Give your AI assistant a name that customers will see" 
                      required 
                    />
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Cottage Tandoori Assistant"
                      style={{
                        backgroundColor: colors.background.tertiary,
                        borderColor: colors.border.medium,
                        color: colors.text.primary
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <TooltipLabel 
                      label="Availability Status" 
                      tooltip={tooltips.publishStatus}
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.published}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                      />
                      <Label className="text-sm font-normal" style={{ color: colors.text.primary }}>
                        {formData.published ? 'Published (Available to activate)' : 'Draft (Private - only you can see)'}
                      </Label>
                    </div>
                  </div>
                </div>
                
                {/* Avatar Upload Section */}
                <div className="space-y-3">
                  <TooltipLabel 
                    label="Assistant Avatar" 
                    tooltip="Upload an avatar image for your AI assistant that customers will see"
                  />
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedAvatarUrl || formData.avatarUrl} alt={formData.name} />
                      <AvatarFallback style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                        <Bot className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-col gap-2">
                        <ImageUploadBrowser
                          selectedImageUrl={selectedAvatarUrl}
                          selectedImageFilename={selectedAvatarFilename}
                          onImageSelect={handleAvatarSelect}
                          triggerButton={
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              style={{
                                color: colors.brand.purple,
                                backgroundColor: colors.background.tertiary,
                                borderColor: colors.brand.purple,
                                border: `1px solid ${colors.brand.purple}`
                              }}
                            >
                              <Image className="h-4 w-4 mr-2" />
                              {selectedAvatarUrl ? 'Change Avatar' : 'Browse Avatar'}
                            </Button>
                          }
                        />
                        {selectedAvatarUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearAvatar}
                            style={{
                              color: colors.text.secondary,
                              backgroundColor: colors.background.tertiary,
                              borderColor: colors.border.medium
                            }}
                          >
                            Clear Avatar
                          </Button>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <TooltipLabel 
                    label="Description" 
                    tooltip="Brief explanation of what this assistant does" 
                  />
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Helps customers with menu questions and orders"
                    style={{
                      backgroundColor: colors.background.tertiary,
                      borderColor: colors.border.medium,
                      color: colors.text.primary
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <TooltipLabel 
                    label="AI Personality & Instructions" 
                    tooltip={tooltips.personality}
                    required 
                  />
                  <Textarea
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    placeholder="You are a helpful AI assistant for Cottage Tandoori Restaurant..."
                    className="min-h-[150px]"
                    style={{
                      backgroundColor: colors.background.tertiary,
                      borderColor: colors.border.medium,
                      color: colors.text.primary
                    }}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="ai-brain" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <TooltipLabel 
                      label="AI Provider" 
                      tooltip={tooltips.aiBrain}
                      required 
                    />
                    <Select
                      value={formData.modelProvider}
                      onValueChange={(value: 'openai' | 'google') => {
                        setFormData(prev => ({ 
                          ...prev, 
                          modelProvider: value,
                          modelName: value === 'openai' ? 'gpt-5' : 'gemini-2.5-flash'  // Updated defaults
                        }));
                      }}
                    >
                      <SelectTrigger style={{
                        backgroundColor: colors.background.tertiary,
                        borderColor: colors.border.medium,
                        color: colors.text.primary
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{
                        backgroundColor: colors.background.tertiary,
                        borderColor: colors.border.medium
                      }}>
                        <SelectItem value="openai">ChatGPT (OpenAI) - Recommended</SelectItem>
                        <SelectItem value="google">Google AI (Gemini)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <TooltipLabel 
                      label="AI Model" 
                      tooltip="Specific version of the AI brain to use" 
                      required 
                    />
                    <Select
                      value={formData.modelName}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, modelName: value }))}
                    >
                      <SelectTrigger style={{
                        backgroundColor: colors.background.tertiary,
                        borderColor: colors.border.medium,
                        color: colors.text.primary
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{
                        backgroundColor: colors.background.tertiary,
                        borderColor: colors.border.medium
                      }}>
                        {getModelOptions().map((model) => (
                          <SelectItem key={model} value={model} style={{ color: colors.text.primary }}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <TooltipLabel 
                      label={`Response Style: ${formData.temperature}`} 
                      tooltip={tooltips.responseStyle}
                    />
                    <Slider
                      value={[formData.temperature]}
                      onValueChange={([value]) => setFormData(prev => ({ ...prev, temperature: value }))}
                      max={2}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs" style={{ color: colors.text.secondary }}>
                      <span>Consistent</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <TooltipLabel 
                      label="Response Length" 
                      tooltip={tooltips.responseLength}
                    />
                    <Input
                      type="number"
                      value={formData.maxTokens}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 250 }))}
                      min={50}
                      max={1000}
                      style={{
                        backgroundColor: colors.background.tertiary,
                        borderColor: colors.border.medium,
                        color: colors.text.primary
                      }}
                    />
                    <p className="text-xs" style={{ color: colors.text.secondary }}>150 = short, 250 = balanced, 500 = detailed</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="fine-tuning" className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" style={{ color: colors.accent.gold }} />
                    <h4 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Advanced Settings</h4>
                  </div>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    These settings are optimized for restaurants. Only change if you have specific requirements.
                  </p>
                </div>
                
                {formData.modelProvider === 'openai' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold" style={{ color: colors.brand.purple }}>ChatGPT Specific Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <TooltipLabel 
                          label="Thinking Level" 
                          tooltip={tooltips.reasoning}
                        />
                        <Select
                          value={formData.reasoningEffort}
                          onValueChange={(value: 'minimal' | 'low' | 'medium' | 'high') => 
                            setFormData(prev => ({ ...prev, reasoningEffort: value }))
                          }
                        >
                          <SelectTrigger style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium,
                            color: colors.text.primary
                          }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium
                          }}>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium (Recommended)</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <TooltipLabel 
                          label="Response Detail" 
                          tooltip={tooltips.verbosity}
                        />
                        <Select
                          value={formData.verbosity}
                          onValueChange={(value: 'low' | 'medium' | 'high') => 
                            setFormData(prev => ({ ...prev, verbosity: value }))
                          }
                        >
                          <SelectTrigger style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium,
                            color: colors.text.primary
                          }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium
                          }}>
                            <SelectItem value="low">Brief</SelectItem>
                            <SelectItem value="medium">Balanced (Recommended)</SelectItem>
                            <SelectItem value="high">Detailed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.modelProvider === 'google' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold" style={{ color: colors.accent.turquoise }}>Google AI Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <TooltipLabel 
                          label="Safety Level" 
                          tooltip={tooltips.safety}
                        />
                        <Select
                          value={formData.safetyThreshold}
                          onValueChange={(value: 'low' | 'medium' | 'high' | 'block_none') => 
                            setFormData(prev => ({ ...prev, safetyThreshold: value }))
                          }
                        >
                          <SelectTrigger style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium,
                            color: colors.text.primary
                          }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium
                          }}>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium (Recommended)</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="block_none">No Filtering</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3">
                        <TooltipLabel 
                          label={`Response Variety: ${formData.topP}`} 
                          tooltip={tooltips.topP}
                        />
                        <Slider
                          value={[formData.topP]}
                          onValueChange={([value]) => setFormData(prev => ({ ...prev, topP: value }))}
                          max={1}
                          min={0}
                          step={0.05}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <TooltipLabel 
                          label="Word Selection" 
                          tooltip={tooltips.topK}
                        />
                        <Input
                          type="number"
                          value={formData.topK}
                          onChange={(e) => setFormData(prev => ({ ...prev, topK: parseInt(e.target.value) || 40 }))}
                          min={1}
                          max={100}
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium,
                            color: colors.text.primary
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-6 mt-6">
                <div className="space-y-6">
                  {/* Analytics Header with Refresh */}
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                      Chat Analytics Dashboard
                    </h2>
                    <ChatAnalyticsRefreshButton 
                      onRefresh={() => {
                        refreshAnalytics();
                        setLastAnalyticsUpdate(new Date());
                      }}
                      loading={analyticsLoading}
                      lastUpdated={lastAnalyticsUpdate}
                      colors={colors}
                    />
                  </div>

                  {analyticsError && (
                    <div className="p-4 rounded-lg border" style={{ 
                      backgroundColor: colors.background.secondary, 
                      borderColor: colors.border.medium,
                      color: colors.text.secondary 
                    }}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <span className="font-medium text-orange-500">Analytics Error</span>
                      </div>
                      <p className="mb-3">{analyticsError}</p>
                      
                      {/* Smart Schema Setup Button */}
                      {analyticsError.includes('relation') && analyticsError.includes('does not exist') ? (
                        <Button
                          onClick={setupAnalyticsSchema}
                          disabled={schemaSetupLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                          {schemaSetupLoading ? (
                            <>
                              <Database className="h-4 w-4 animate-spin" />
                              Setting up Analytics Tables...
                            </>
                          ) : (
                            <>
                              <Database className="h-4 w-4" />
                              Setup Analytics Tables
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={refreshAnalytics}
                          disabled={analyticsLoading}
                          className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                        >
                          {analyticsLoading ? (
                            <>
                              <Activity className="h-4 w-4 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <Activity className="h-4 w-4" />
                              Retry Analytics
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Enhanced Model Filter Controls */}
                  <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                        <Brain className="h-5 w-5 text-purple-500" />
                        AI Model Analytics Filter
                      </CardTitle>
                      <CardDescription style={{ color: colors.text.secondary }}>
                        Filter analytics by specific AI models or compare performance across models
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Model Filter Dropdown */}
                        <div className="space-y-2">
                          <Label style={{ color: colors.text.primary }}>Analytics View</Label>
                          <Select 
                            value={modelFilter} 
                            onValueChange={(value) => {
                              setModelFilter(value);
                              setCompareModels(value === 'compare');
                            }}
                          >
                            <SelectTrigger style={{
                              backgroundColor: colors.background.secondary,
                              borderColor: colors.border.medium,
                              color: colors.text.primary
                            }}>
                              <SelectValue placeholder="Select filter" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">🔄 All Models (Unified View)</SelectItem>
                              <SelectItem value="gpt">🤖 OpenAI Models Only</SelectItem>
                              <SelectItem value="gemini">🧠 Google Gemini Only</SelectItem>
                              <SelectItem value="compare">⚖️ Compare Models</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Quick Stats */}
                        <div className="space-y-2">
                          <Label style={{ color: colors.text.primary }}>Current Filter</Label>
                          <div className="flex items-center gap-2 p-2 rounded" style={{
                            backgroundColor: colors.background.secondary,
                            borderColor: colors.border.medium,
                            border: '1px solid'
                          }}>
                            {modelFilter === 'all' && <span className="text-blue-400">📊 Unified Business View</span>}
                            {modelFilter === 'gpt' && <span className="text-green-400">🤖 OpenAI GPT Focus</span>}
                            {modelFilter === 'gemini' && <span className="text-purple-400">🧠 Google Gemini Focus</span>}
                            {modelFilter === 'compare' && <span className="text-orange-400">⚖️ Model Comparison</span>}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <Label style={{ color: colors.text.primary }}>Actions</Label>
                          <Button
                            onClick={() => {
                              refreshAnalytics();
                              setLastAnalyticsUpdate(new Date());
                            }}
                            disabled={analyticsLoading}
                            size="sm"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            {analyticsLoading ? (
                              <>
                                <Activity className="h-4 w-4 mr-2 animate-spin" />
                                Applying Filter...
                              </>
                            ) : (
                              <>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Apply Filter
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Filter Status Indicator */}
                      <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            modelFilter === 'all' ? 'bg-green-500' : 
                            modelFilter === 'compare' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}></div>
                          <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                            Current Filter: 
                          </span>
                          <span className="text-sm" style={{ color: colors.text.secondary }}>
                            {modelFilter === 'all' ? 'All Models (Unified View)' :
                             modelFilter === 'compare' ? 'Model Comparison Mode' :
                             modelFilter === 'openai' ? 'OpenAI Models Only' :
                             'Google Gemini Models Only'}
                          </span>
                        </div>
                        {analyticsData?.filter_applied && (
                          <div className="mt-2 text-xs" style={{ color: colors.text.secondary }}>
                            Last applied: {analyticsData.filter_applied} | 
                            Compare mode: {analyticsData.compare_mode ? 'Enabled' : 'Disabled'}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Real-time Chat Status */}
                  <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                        <Activity className="h-5 w-5 text-green-500" />
                        Real-time Chat Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
                          <div className="text-2xl font-bold text-green-500">
                            {analyticsData?.metrics.activeSessions || 0}
                          </div>
                          <div className="text-sm" style={{ color: colors.text.secondary }}>Active Sessions</div>
                        </div>
                        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
                          <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                            {analyticsData?.metrics.messagesTotal || 0}
                          </div>
                          <div className="text-sm" style={{ color: colors.text.secondary }}>Messages Today</div>
                        </div>
                        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
                          <div className="text-2xl font-bold text-blue-500">
                            {analyticsData?.metrics.avgResponseTime || '2.3s'}
                          </div>
                          <div className="text-sm" style={{ color: colors.text.secondary }}>Avg Response Time</div>
                        </div>
                        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
                          <div className="text-2xl font-bold text-purple-500">
                            {analyticsData?.metrics.ordersGenerated || 0}
                          </div>
                          <div className="text-sm" style={{ color: colors.text.secondary }}>Orders Generated</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Model Performance Comparison */}
                  {(compareModels || modelFilter === 'compare') && (
                    <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                          <TrendingUp className="h-5 w-5 text-orange-500" />
                          AI Model Performance Comparison
                        </CardTitle>
                        <CardDescription style={{ color: colors.text.secondary }}>
                          Compare performance between OpenAI and Google Gemini models
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* OpenAI Performance */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                                🤖 OpenAI Models
                              </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-800/50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-green-400">
                                  {analyticsData?.modelPerformance?.openai?.responseTime || '0.0ms'}
                                </div>
                                <div className="text-sm text-gray-400">Avg Response Time</div>
                              </div>
                              <div className="bg-gray-800/50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-400">
                                  {analyticsData?.modelPerformance?.openai?.messagesHandled || 0}
                                </div>
                                <div className="text-sm text-gray-400">Messages Handled</div>
                              </div>
                            </div>
                          </div>

                          {/* Google Gemini Performance */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                              <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                                🧠 Google Gemini
                              </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-800/50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-green-400">
                                  {analyticsData?.modelPerformance?.google?.responseTime || '0.0ms'}
                                </div>
                                <div className="text-sm text-gray-400">Avg Response Time</div>
                              </div>
                              <div className="bg-gray-800/50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-400">
                                  {analyticsData?.modelPerformance?.google?.messagesHandled || 0}
                                </div>
                                <div className="text-sm text-gray-400">Messages Handled</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Conversation Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                          <TrendingUp className="h-5 w-5 text-blue-500" />
                          Conversation to Order Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span style={{ color: colors.text.secondary }}>Last 7 Days</span>
                            <span className="text-lg font-semibold text-green-500">
                              {analyticsData?.metrics.conversationRate || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${analyticsData?.metrics.conversationRate || 0}%` }}
                            ></div>
                          </div>
                          <div className="text-sm" style={{ color: colors.text.secondary }}>
                            {analyticsData?.metrics.ordersGenerated || 0} orders from {analyticsData?.metrics.activeSessions || 0} conversations
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                          <Users className="h-5 w-5 text-purple-500" />
                          Customer Satisfaction
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span style={{ color: colors.text.secondary }}>Average Rating</span>
                            <span className="text-lg font-semibold text-purple-500">
                              {analyticsData?.metrics.satisfaction > 0 ? `${analyticsData.metrics.satisfaction}/5` : 'No data'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const ratingData = analyticsData?.satisfactionBreakdown?.find(r => r.rating === rating);
                              const percentage = ratingData?.percentage || 0;
                              
                              return (
                                <div key={rating} className="flex items-center gap-2">
                                  <span className="text-sm w-4" style={{ color: colors.text.secondary }}>{rating}</span>
                                  <div className="flex-1 bg-gray-700 rounded-full h-1">
                                    <div 
                                      className="bg-purple-500 h-1 rounded-full" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs" style={{ color: colors.text.secondary }}>
                                    {percentage > 0 ? `${percentage}%` : '0%'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Escalation & Safety Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          Escalations & Safety
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span style={{ color: colors.text.secondary }}>Escalation Rate</span>
                            <span className="text-orange-500 font-semibold">
                              {analyticsData?.metrics.escalationRate ? `${analyticsData.metrics.escalationRate}%` : '0%'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span style={{ color: colors.text.secondary }}>Complex Orders</span>
                              <span style={{ color: colors.text.primary }}>
                                {analyticsData?.escalationDetails.complexOrders || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span style={{ color: colors.text.secondary }}>Allergen Queries</span>
                              <span style={{ color: colors.text.primary }}>
                                {analyticsData?.escalationDetails.allergenQueries || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span style={{ color: colors.text.secondary }}>Payment Issues</span>
                              <span style={{ color: colors.text.primary }}>
                                {analyticsData?.escalationDetails.paymentIssues || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span style={{ color: colors.text.secondary }}>Content Filtered</span>
                              <span style={{ color: colors.text.primary }}>
                                {analyticsData?.escalationDetails.contentFiltered || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                          <Clock className="h-5 w-5 text-green-500" />
                          Response Quality
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span style={{ color: colors.text.secondary }}>Average Session Length</span>
                            <span className="text-green-500 font-semibold">
                              {analyticsData?.metrics.avgSessionLength || '0m 0s'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span style={{ color: colors.text.secondary }}>Messages per Session</span>
                              <span style={{ color: colors.text.primary }}>
                                {analyticsData?.metrics.messagesPerSession || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span style={{ color: colors.text.secondary }}>Menu Cards Shown</span>
                              <span style={{ color: colors.text.primary }}>
                                {analyticsData?.qualityMetrics.menuCardsShown || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span style={{ color: colors.text.secondary }}>Successful Handoffs</span>
                              <span style={{ color: colors.text.primary }}>
                                {analyticsData?.qualityMetrics.successfulHandoffs ? `${analyticsData.qualityMetrics.successfulHandoffs}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span style={{ color: colors.text.secondary }}>Intent Recognition</span>
                              <span style={{ color: colors.text.primary }}>
                                {analyticsData?.qualityMetrics.intentRecognition || 96.8}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Customer Intents */}
                  <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        Top Customer Intents (Last 7 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(analyticsData?.topIntents || []).length > 0 ? (
                          analyticsData.topIntents.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div className="w-32" style={{ color: colors.text.primary }}>{item.intent}</div>
                              <div className="flex-1 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                              <div className="w-16 text-right" style={{ color: colors.text.primary }}>{item.count}</div>
                              <div className="w-12 text-right text-sm" style={{ color: colors.text.secondary }}>{item.percentage}%</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8" style={{ color: colors.text.secondary }}>
                            <p>No customer intent data available yet</p>
                            <p className="text-sm mt-1">Intent data will appear after customers interact with the chatbot</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Health Indicator */}
                  <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Chat System Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ChatHealthIndicator 
                          status={analyticsData?.systemStatus.apiStatus || 'operational'}
                          label="API Status"
                          colors={colors}
                        />
                        <ChatHealthIndicator 
                          status={analyticsData?.systemStatus.databaseStatus || 'connected'}
                          label="Database"
                          colors={colors}
                        />
                        <ChatHealthIndicator 
                          status={analyticsData?.systemStatus.aiModelsStatus || 'available'}
                          label="AI Models"
                          colors={colors}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
                style={{
                  color: colors.text.secondary,
                  borderColor: colors.border.medium,
                  backgroundColor: 'transparent'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingPrompt ? handleEditPrompt : handleCreatePrompt}
                disabled={isSubmitting || !formData.name || !formData.systemPrompt}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Bot className="h-4 w-4 animate-spin" />
                    {editingPrompt ? 'Updating Assistant...' : 'Creating Assistant...'}
                  </>
                ) : (
                  <>
                    {editingPrompt ? 'Update AI Assistant' : 'Create AI Assistant'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
