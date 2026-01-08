import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  MessageSquare,
  Activity,
  Save,
  Clock,
  ShieldCheck,
  Bot,
  Eye,
  Settings,
  User,
  Info,
  ArrowRight,
  ArrowLeft,
  Phone,
  PhoneOff,
  Copy,
  Brain,
  BarChart3,
  DollarSign,
  Shield,
  AlertTriangle,
  PhoneCall,
  FileText,
  Plus,
  ChevronRight,
  ShoppingCart,
  X,
  Cog
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';

import { AgentProfileOutput } from 'types';
import { TimePickerInput } from './TimePickerInput';
import { colors, cardStyle } from 'utils/designSystem';
import { globalColors, effects } from 'utils/QSAIDesign';
import { useCategories, useMenuItems } from '../utils/menuQueries';
import { useVoiceAgentStore } from 'utils/voiceAgentStore';

import { MultiNationalityPassportCard, AgentStatus } from './MultiNationalityPassportCard';
import { HorizontalAgentCarousel } from './HorizontalAgentCarousel';
import { createWebRTCVoiceClient, VoiceCallStatus, isWebRTCSupported } from 'utils/webrtcVoiceClient';

// TypeScript declarations for Twilio Voice SDK
declare global {
  interface Window {
    Twilio?: {
      Device: new (token: string, options?: {
        logLevel?: number;
        codecPreferences?: string[];
      }) => {
        on: (event: string, callback: (arg?: any) => void) => void;
        connect: (params?: Record<string, any>) => {
          on: (event: string, callback: (arg?: any) => void) => void;
          status: () => string;
          disconnect: () => void;
        };
        destroy: () => void;
      };
    };
  }
}

export interface AIVoiceAgentModalProps {
  open: boolean;
  onClose: () => void;
}

export function AIVoiceAgentModal({ open, onClose }: AIVoiceAgentModalProps) {
  // React Query hooks - check menu data when modal opens
  const { data: categories = [], isLoading: categoriesLoading } = useCategories({ enabled: open });
  const { data: menuItems = [], isLoading: menuItemsLoading } = useMenuItems({ enabled: open });
  
  // Derive menu availability from React Query data
  const hasCategories = categories.length > 0;
  const hasMenuItems = menuItems.length > 0;
  const menuCheckLoading = categoriesLoading || menuItemsLoading;
  
  // Global voice agent store
  const {
    selectedAgent: globalSelectedAgent,
    setSelectedAgent: setGlobalSelectedAgent,
    availableAgents,
    setAvailableAgents,
    getSelectedAgentName
  } = useVoiceAgentStore();
  
  // Local agent selection state (synchronized with global store)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(globalSelectedAgent?.id || null);
  
  // Simple modal state (no complex wizard)
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Real database agents only - now using global store
  const [agents, setAgents] = useState<AgentProfileOutput[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  
  // Voice testing states - WebRTC browser voice client
  const [isVoiceTesting, setIsVoiceTesting] = useState(false);
  const [testingAgentId, setTestingAgentId] = useState<string | null>(null);
  const [voiceClient, setVoiceClient] = useState<any>(null);
  const [voiceCallStatus, setVoiceCallStatus] = useState<VoiceCallStatus>(VoiceCallStatus.IDLE);
  
  // System status states
  const [ultravoxConnected, setUltravoxConnected] = useState(true);
  const [aiVoiceAgentEnabled, setAiVoiceAgentEnabled] = useState(true);
  
  // Order settings states (migrated from AIOrderSettings)
  const [autoApprove, setAutoApprove] = useState(false);
  const [enabledTimeWindows, setEnabledTimeWindows] = useState(true);
  
  // Additional settings for Step 3
  const [autoApproveOrders, setAutoApproveOrders] = useState(true);
  const [respectOrderTimeWindows, setRespectOrderTimeWindows] = useState(true);
  const [timeWindows, setTimeWindows] = useState({
    monday: { start: '12:00', end: '22:00', enabled: true },
    tuesday: { start: '12:00', end: '22:00', enabled: true },
    wednesday: { start: '12:00', end: '22:00', enabled: true },
    thursday: { start: '12:00', end: '22:00', enabled: true },
    friday: { start: '12:00', end: '22:00', enabled: true },
    saturday: { start: '12:00', end: '22:30', enabled: true },
    sunday: { start: '12:00', end: '22:00', enabled: true }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [connectionTesting, setConnectionTesting] = useState(false);
  
  // Mock analytics data (would come from backend)
  const mockAnalytics = {
    totalMinutes: { day: 45, week: 312, month: 1248 },
    callVolume: { day: 12, week: 89, month: 376 },
    cost: { day: 8.5, week: 62.4, month: 249.6 }
  };
  
  // Phone number configuration
  const phoneNumber = "+447883319535";
  const [phoneActive, setPhoneActive] = useState(true);
  const [backupNumber, setBackupNumber] = useState("");
  
  // Time window presets
  const timePresets = [
    { name: "Standard Hours", hours: { start: "09:00", end: "22:00" } },
    { name: "Mon-Fri 12-22", hours: { start: "12:00", end: "22:00" } },
    { name: "Lunch+Dinner", hours: { start: "11:30", end: "14:30" } },
    { name: "Extended Hours", hours: { start: "08:00", end: "23:00" } }
  ];

  // Check menu configuration on mount
  useEffect(() => {
    if (open) {
      loadAgents();
    }
  }, [open]);

  // Load agents from database
  const loadAgents = async () => {
    try {
      setAgentsLoading(true);
      const response = await apiClient.get_agent_profiles_endpoint();
      const data = await response.json();
      
      if (data.success && Array.isArray(data.agents)) {
        // Filter for admin visible agents
        const visibleAgents = data.agents.filter((agent: AgentProfileOutput) => agent.is_admin_visible);
        setAgents(visibleAgents);
        
        // Auto-select first agent if none selected
        if (!globalSelectedAgent && visibleAgents.length > 0) {
          setGlobalSelectedAgent(visibleAgents[0]); // Pass full object, not just ID
          setSelectedAgentId(visibleAgents[0].id);
        } else if (globalSelectedAgent) {
          setSelectedAgentId(globalSelectedAgent.id); // Use the ID from the object
        }
      } else {
        console.error('Failed to load agents:', data.error);
        toast.error('Failed to load voice agents');
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Error loading voice agents');
    } finally {
      setAgentsLoading(false);
    }
  };

  // Synchronize local state with global store
  useEffect(() => {
    const globalAgentId = globalSelectedAgent?.id || null;
    if (globalAgentId !== selectedAgentId) {
      setSelectedAgentId(globalAgentId);
    }
  }, [globalSelectedAgent, selectedAgentId]);
  
  // Start voice test using WebRTC direct browser connection
  const startVoiceTest = async (agentProfileId: string, agentName: string) => {
    try {
      // Check WebRTC support
      if (!isWebRTCSupported()) {
        toast.error('WebRTC is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      console.log(`🎙️ Starting WebRTC voice test with agent: ${agentName}`);
      toast.success(`🎙️ Connecting to ${agentName}... Please allow microphone access!`);
      
      setIsVoiceTesting(true);
      setTestingAgentId(agentProfileId);
      setVoiceCallStatus(VoiceCallStatus.CONNECTING);
      
      // Create WebRTC voice client
      const client = createWebRTCVoiceClient({
        agentId: agentProfileId,
        agentName: agentName,
        onStatusChange: (status) => {
          setVoiceCallStatus(status);
          
          if (status === VoiceCallStatus.CONNECTED) {
            toast.success(`✅ Connected to ${agentName}! Start speaking...`);
          } else if (status === VoiceCallStatus.DISCONNECTED) {
            setIsVoiceTesting(false);
            setTestingAgentId(null);
            setVoiceClient(null);
          } else if (status === VoiceCallStatus.FAILED) {
            setIsVoiceTesting(false);
            setTestingAgentId(null);
            setVoiceClient(null);
          }
        },
        onError: (error) => {
          console.error('❌ Voice test error:', error);
          toast.error(`Voice test failed: ${error}`);
          setIsVoiceTesting(false);
          setTestingAgentId(null);
          setVoiceClient(null);
        }
      });
      
      setVoiceClient(client);
      
      // Start the voice call
      await client.startCall();
      
    } catch (error: any) {
      console.error('❌ Voice test error:', error);
      setIsVoiceTesting(false);
      setTestingAgentId(null);
      setVoiceClient(null);
      toast.error(`Voice test failed: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Stop voice test with proper cleanup
  const stopVoiceTest = async () => {
    try {
      console.log('🔄 Ending WebRTC voice session...');
      
      // End the WebRTC voice call
      if (voiceClient) {
        await voiceClient.endCall();
        setVoiceClient(null);
      }
      
      setIsVoiceTesting(false);
      setTestingAgentId(null);
      setVoiceCallStatus(VoiceCallStatus.IDLE);
      toast.info('✅ Voice test session ended');
      
    } catch (error) {
      console.error('Error stopping voice test:', error);
      // Still clean up state even if there's an error
      setIsVoiceTesting(false);
      setTestingAgentId(null);
      setVoiceCallStatus(VoiceCallStatus.IDLE);
    }
  };

  // Helper function to determine agent status for glow system
  const getAgentStatus = (agent: AgentProfileOutput, isAgentSelected: boolean, isAgentActive: boolean): AgentStatus => {
    if (isVoiceTesting && testingAgentId === agent.id) {
      if (voiceCallStatus === VoiceCallStatus.CONNECTING) {
        return 'connecting';
      } else if (voiceCallStatus === VoiceCallStatus.CONNECTED) {
        return 'active';
      }
    }
    
    if (isAgentActive && isAgentSelected) {
      return 'active';
    }
    
    return 'inactive';
  };

  // Handle voice testing
  const handleTestVoice = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    if (isVoiceTesting && testingAgentId === agentId) {
      stopVoiceTest();
    } else {
      startVoiceTest(agentId, agent.name);
    }
  };

  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    
    // Find the full agent object and sync with global store
    const selectedAgentObject = agents.find(agent => agent.id === agentId);
    if (selectedAgentObject) {
      setGlobalSelectedAgent(selectedAgentObject); // Pass full object, not just ID
    }
    
    // Stop any active voice test when switching agents
    if (isVoiceTesting) {
      stopVoiceTest();
    }
    // Track changes for journey flow
    setHasChanges(true);
    toast.success('Agent selection saved');
  };
  
  // Handle journey navigation
  const handleNextStep = () => {
    if (activeTab === "agent-selection") {
      // Validate step completion before proceeding
      if (!selectedAgentId) {
        toast.error('Please select an AI assistant before proceeding');
        return;
      }
      setActiveTab("working-hours");
    } else if (activeTab === "working-hours") {
      setActiveTab("order-settings");
    }
  };
  
  const handlePreviousStep = () => {
    if (activeTab === "order-settings") {
      setActiveTab("working-hours");
    } else if (activeTab === "working-hours") {
      setActiveTab("agent-selection");
    }
  };
  
  // Handle final configuration save
  const handleSaveConfiguration = async () => {
    setIsPublishing(true);
    try {
      // Here we would save all configuration to backend
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      setHasChanges(false);
      toast.success('AI Voice Agent configuration saved successfully!');
      onClose(); // Close modal after successful save
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Track changes for unsaved state
  const handleConfigurationChange = () => {
    setHasChanges(true);
  };
  
  // Save settings handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Here we would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Copy phone number to clipboard
  const copyPhoneNumber = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      toast.success('Phone number copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy phone number');
    }
  };
  
  // Apply time preset to all days
  const applyTimePreset = (preset: typeof timePresets[0]) => {
    const newTimeWindows = { ...timeWindows };
    Object.keys(newTimeWindows).forEach(day => {
      newTimeWindows[day as keyof typeof newTimeWindows] = {
        ...newTimeWindows[day as keyof typeof newTimeWindows],
        start: preset.hours.start,
        end: preset.hours.end
      };
    });
    setTimeWindows(newTimeWindows);
    toast.success(`Applied ${preset.name} to all days`);
  };
  
  // Copy Monday to weekdays
  const copyMondayToWeekdays = () => {
    const mondayHours = timeWindows.monday;
    setTimeWindows(prev => ({
      ...prev,
      tuesday: { ...prev.tuesday, start: mondayHours.start, end: mondayHours.end },
      wednesday: { ...prev.wednesday, start: mondayHours.start, end: mondayHours.end },
      thursday: { ...prev.thursday, start: mondayHours.start, end: mondayHours.end },
      friday: { ...prev.friday, start: mondayHours.start, end: mondayHours.end }
    }));
    toast.success('Applied Monday hours to weekdays');
  };
  
  // Set all days same hours
  const setAllSameHours = () => {
    const firstEnabledDay = Object.entries(timeWindows).find(([_, window]) => window.enabled);
    if (firstEnabledDay) {
      const [_, hours] = firstEnabledDay;
      const newTimeWindows = { ...timeWindows };
      Object.keys(newTimeWindows).forEach(day => {
        newTimeWindows[day as keyof typeof newTimeWindows] = {
          ...newTimeWindows[day as keyof typeof newTimeWindows],
          start: hours.start,
          end: hours.end
        };
      });
      setTimeWindows(newTimeWindows);
      toast.success('Applied same hours to all days');
    }
  };

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0" style={{
        backgroundColor: 'rgba(18, 18, 18, 0.95)',
        border: '1px solid rgba(124, 93, 250, 0.3)',
        backdropFilter: 'blur(20px)'
      }}>
        <DialogHeader className="px-6 py-4 border-b border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-white">
                AI Voice Agent Settings
              </DialogTitle>
              <p className="text-gray-400 mt-1">
                Configure your AI voice assistant for phone orders and reservations
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4">
          {/* Menu Advisory Banner */}
          {!menuCheckLoading && (!hasCategories || !hasMenuItems) && (
            <Alert className="bg-amber-900/20 border-amber-500/30 backdrop-blur-sm mb-6">
              <Info className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Menu Setup Recommended:</span>
                    {!hasCategories && !hasMenuItems && (
                      <span className="ml-2">No menu categories or items found. Configure your menu in Admin Menu first for optimal AI voice agent performance.</span>
                    )}
                    {hasCategories && !hasMenuItems && (
                      <span className="ml-2">Menu categories found but no menu items. Add menu items in Admin Menu for complete AI voice agent functionality.</span>
                    )}
                    {!hasCategories && hasMenuItems && (
                      <span className="ml-2">Menu items found but no categories. Organize your menu with categories in Admin Menu for better customer experience.</span>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* System Status Bar */}
          <Card style={{
            ...cardStyle,
            borderColor: `rgba(124, 93, 250, 0.2)`,
            background: `linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(26, 26, 26, 0.9) 100%)`
          }} className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Connection Status */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full`} style={{
                      backgroundColor: aiVoiceAgentEnabled ? globalColors.status.success : colors.text.muted
                    }} />
                    <span className="text-sm font-medium" style={{
                      color: aiVoiceAgentEnabled ? globalColors.status.success : colors.text.muted
                    }}>
                      {aiVoiceAgentEnabled ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  {/* AI Voice Agent Toggle */}
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" style={{
                      color: aiVoiceAgentEnabled ? colors.brand.purpleLight : colors.text.muted
                    }} />
                    <span className="text-sm font-medium text-white">AI Voice Agent</span>
                    <Switch
                      checked={aiVoiceAgentEnabled}
                      onCheckedChange={setAiVoiceAgentEnabled}
                      className="data-[state=checked]:bg-purple-500"
                    />
                  </div>
                </div>

                {/* Test Connection Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="border-gray-600 hover:border-purple-500 text-white hover:text-purple-300"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading state */}
          {agentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purpleLight }} />
              <span className="ml-2" style={{ color: colors.text.secondary }}>Loading agents...</span>
            </div>
          ) : agents.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.muted }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>No Agents Found</h3>
              <p style={{ color: colors.text.secondary }}>Please create agents in the Admin Dashboard first.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress Indicator */}
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    activeTab === "agent-selection" 
                      ? "bg-purple-600 text-white" 
                      : "bg-green-600 text-white"
                  }`}>
                    {activeTab === "agent-selection" ? "1" : "✓"}
                  </div>
                  <span className={`text-sm font-medium ${
                    activeTab === "agent-selection" ? "text-purple-400" : "text-green-400"
                  }`}>
                    Select AI Staff
                  </span>
                </div>
                
                <div className={`w-12 h-0.5 ${
                  ["working-hours", "order-settings"].includes(activeTab) 
                    ? "bg-green-600" 
                    : "bg-gray-600"
                }`} />
                
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    activeTab === "working-hours" 
                      ? "bg-purple-600 text-white" 
                      : activeTab === "order-settings"
                      ? "bg-green-600 text-white"
                      : "bg-gray-600 text-gray-400"
                  }`}>
                    {activeTab === "order-settings" ? "✓" : "2"}
                  </div>
                  <span className={`text-sm font-medium ${
                    activeTab === "working-hours" 
                      ? "text-purple-400" 
                      : activeTab === "order-settings"
                      ? "text-green-400"
                      : "text-gray-400"
                  }`}>
                    Configure Schedule
                  </span>
                </div>
                
                <div className={`w-12 h-0.5 ${
                  activeTab === "order-settings" ? "bg-green-600" : "bg-gray-600"
                }`} />
                
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    activeTab === "order-settings" 
                      ? "bg-purple-600 text-white" 
                      : "bg-gray-600 text-gray-400"
                  }`}>
                    3
                  </div>
                  <span className={`text-sm font-medium ${
                    activeTab === "order-settings" ? "text-purple-400" : "text-gray-400"
                  }`}>
                    System Settings
                  </span>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Tab Navigation */}
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-800/50 border border-purple-500/20">
                  <TabsTrigger 
                    value="agent-selection" 
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    Select Agent
                  </TabsTrigger>
                  <TabsTrigger 
                    value="working-hours"
                    disabled={!selectedAgentId}
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white disabled:opacity-50"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Working Hours
                  </TabsTrigger>
                  <TabsTrigger 
                    value="order-settings"
                    disabled={!selectedAgentId}
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white disabled:opacity-50"
                  >
                    <Cog className="h-4 w-4 mr-2" />
                    Order Settings
                  </TabsTrigger>
                </TabsList>

                {/* Step 1: Agent Selection & Testing */}
                <TabsContent value="agent-selection" className="space-y-8">
                  <Card style={{
                    ...cardStyle,
                    borderColor: `rgba(124, 93, 250, 0.2)`,
                    background: `linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(26, 26, 26, 0.9) 100%)`
                  }}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <Bot className="h-6 w-6 text-purple-400" />
                        <span className="text-white text-xl">Step 1: Select Your AI Staff Member</span>
                      </CardTitle>
                      <p className="text-gray-400 mt-2">
                        Choose an AI voice assistant to handle phone orders and reservations for your restaurant.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {agents.length === 1 ? (
                        // Single Agent: Centered Layout
                        <div className="flex justify-center px-4">
                          <div className="flex flex-col items-center gap-6">
                            <MultiNationalityPassportCard
                              agent={agents[0]}
                              isSelected={selectedAgentId === agents[0].id}
                              onSelect={handleAgentSelect}
                              status={getAgentStatus(agents[0], selectedAgentId === agents[0].id, aiVoiceAgentEnabled)}
                              size="large"
                              showTestButton={true}
                              onTest={() => handleTestVoice(agents[0].id)}
                              isTestingVoice={isVoiceTesting && testingAgentId === agents[0].id}
                              voiceCallStatus={isVoiceTesting && testingAgentId === agents[0].id ? voiceCallStatus : VoiceCallStatus.IDLE}
                            />
                          </div>
                        </div>
                      ) : (
                        // Multiple Agents: Horizontal Carousel
                        <HorizontalAgentCarousel
                          agents={agents}
                          selectedAgentId={selectedAgentId}
                          onSelectAgent={handleAgentSelect}
                          getAgentStatus={getAgentStatus}
                          aiVoiceAgentEnabled={aiVoiceAgentEnabled}
                          onTestVoice={handleTestVoice}
                          isVoiceTesting={isVoiceTesting}
                          testingAgentId={testingAgentId}
                          voiceCallStatus={voiceCallStatus}
                        />
                      )}

                      {/* Selected Agent Info */}
                      {selectedAgent && (
                        <div className="mt-8 p-6 rounded-lg" style={{
                          backgroundColor: 'rgba(124, 93, 250, 0.1)',
                          border: '1px solid rgba(124, 93, 250, 0.3)'
                        }}>
                          <h4 className="text-white font-medium mb-2">Selected: {selectedAgent.name}</h4>
                          <p className="text-gray-300 text-sm mb-3">
                            {selectedAgent.description || 'Professional AI assistant ready to help your customers'}
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Voice Type:</span>
                              <span className="text-white ml-2">{selectedAgent.voice_type || 'Default'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Personality:</span>
                              <span className="text-white ml-2">{selectedAgent.personality || 'Professional'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Step 2: Working Hours */}
                <TabsContent value="working-hours" className="space-y-8">
                  <Card style={{
                    ...cardStyle,
                    borderColor: `rgba(124, 93, 250, 0.2)`,
                    background: `linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(26, 26, 26, 0.9) 100%)`
                  }}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <Clock className="h-6 w-6 text-purple-400" />
                        <span className="text-white text-xl">Step 2: Configure Working Hours</span>
                      </CardTitle>
                      <p className="text-gray-400 mt-2">
                        Set when your AI staff member should be on duty to take phone orders and reservations.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {/* Quick Setup Presets */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Setup</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {timePresets.map((preset) => (
                            <Button
                              key={preset.name}
                              variant="outline"
                              size="sm"
                              onClick={() => applyTimePreset(preset)}
                              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                            >
                              {preset.name}
                            </Button>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyMondayToWeekdays}
                            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                          >
                            Copy Monday to Weekdays
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={setAllSameHours}
                            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                          >
                            Set All Same Hours
                          </Button>
                        </div>
                      </div>
                      
                      <Separator className="bg-purple-500/20" />
                      
                      {/* Daily Time Windows */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Daily Schedule</h4>
                        <div className="space-y-4">
                          {Object.entries(timeWindows).map(([day, window]) => (
                            <div key={day} className="flex items-center gap-4 p-4 rounded-lg" style={{
                              backgroundColor: 'rgba(30, 30, 30, 0.5)',
                              border: '1px solid rgba(124, 93, 250, 0.2)'
                            }}>
                              <div className="flex items-center space-x-3 min-w-[120px]">
                                <Switch
                                  checked={window.enabled}
                                  onCheckedChange={(enabled) => {
                                    setTimeWindows(prev => ({
                                      ...prev,
                                      [day]: { ...prev[day as keyof typeof prev], enabled }
                                    }));
                                    handleConfigurationChange();
                                  }}
                                  className="data-[state=checked]:bg-purple-500"
                                />
                                <Label className="text-white capitalize font-medium">
                                  {day}
                                </Label>
                              </div>
                              
                              {window.enabled && (
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-gray-400 text-sm">From:</Label>
                                    <TimePickerInput
                                      value={window.start}
                                      onChange={(value) => {
                                        setTimeWindows(prev => ({
                                          ...prev,
                                          [day]: { ...prev[day as keyof typeof prev], start: value }
                                        }));
                                        handleConfigurationChange();
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Label className="text-gray-400 text-sm">To:</Label>
                                    <TimePickerInput
                                      value={window.end}
                                      onChange={(value) => {
                                        setTimeWindows(prev => ({
                                          ...prev,
                                          [day]: { ...prev[day as keyof typeof prev], end: value }
                                        }));
                                        handleConfigurationChange();
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {!window.enabled && (
                                <div className="flex-1 text-gray-500 text-sm">
                                  Closed
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Step 3: Order Settings */}
                <TabsContent value="order-settings" className="space-y-8">
                  <Card style={{
                    ...cardStyle,
                    borderColor: `rgba(124, 93, 250, 0.2)`,
                    background: `linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(26, 26, 26, 0.9) 100%)`
                  }}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <Cog className="h-6 w-6 text-purple-400" />
                        <span className="text-white text-xl">Step 3: Order Processing Settings</span>
                      </CardTitle>
                      <p className="text-gray-400 mt-2">
                        Configure how your AI assistant should handle orders and customer requests.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {/* Order Auto-Approval */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg" style={{
                          backgroundColor: 'rgba(30, 30, 30, 0.5)',
                          border: '1px solid rgba(124, 93, 250, 0.2)'
                        }}>
                          <div className="space-y-1">
                            <Label className="text-white font-medium">Auto-approve Voice Orders</Label>
                            <p className="text-sm text-gray-400">
                              Allow AI to automatically process and confirm orders without manual review
                            </p>
                          </div>
                          <Switch
                            checked={autoApproveOrders}
                            onCheckedChange={(checked) => {
                              setAutoApproveOrders(checked);
                              handleConfigurationChange();
                            }}
                            className="data-[state=checked]:bg-purple-500"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 rounded-lg" style={{
                          backgroundColor: 'rgba(30, 30, 30, 0.5)',
                          border: '1px solid rgba(124, 93, 250, 0.2)'
                        }}>
                          <div className="space-y-1">
                            <Label className="text-white font-medium">Respect Order Time Windows</Label>
                            <p className="text-sm text-gray-400">
                              Only accept orders during configured restaurant opening hours
                            </p>
                          </div>
                          <Switch
                            checked={respectOrderTimeWindows}
                            onCheckedChange={(checked) => {
                              setRespectOrderTimeWindows(checked);
                              handleConfigurationChange();
                            }}
                            className="data-[state=checked]:bg-purple-500"
                          />
                        </div>
                      </div>
                      
                      <Separator className="bg-purple-500/20" />
                      
                      {/* Phone Configuration */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Phone Configuration</h4>
                        
                        <div className="p-4 rounded-lg" style={{
                          backgroundColor: 'rgba(30, 30, 30, 0.5)',
                          border: '1px solid rgba(124, 93, 250, 0.2)'
                        }}>
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-white font-medium">Primary Phone Number</Label>
                            <div className="flex items-center gap-2">
                              <Badge variant={phoneActive ? "default" : "secondary"}>
                                {phoneActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Switch
                                checked={phoneActive}
                                onCheckedChange={setPhoneActive}
                                className="data-[state=checked]:bg-purple-500"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex-1 p-3 rounded bg-gray-800/50 border border-gray-700">
                              <p className="text-white font-mono text-lg">{phoneNumber}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={copyPhoneNumber}
                              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <p className="text-sm text-gray-400 mt-2">
                            This is your restaurant's main phone number that customers will call
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-6 border-t border-purple-500/20">
                <div className="flex items-center space-x-4">
                  {hasChanges && (
                    <div className="flex items-center space-x-2 text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Unsaved changes</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  {activeTab !== "agent-selection" && (
                    <Button
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                  
                  {activeTab === "order-settings" ? (
                    <Button
                      onClick={handleSaveConfiguration}
                      disabled={isPublishing}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextStep}
                      disabled={activeTab === "agent-selection" && !selectedAgentId}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                    >
                      Next Step
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AIVoiceAgentModal;
