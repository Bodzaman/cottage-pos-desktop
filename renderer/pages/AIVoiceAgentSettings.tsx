import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneCall, Mic, MicOff, Volume2, VolumeX, Settings, Users,
  CheckCircle, XCircle, AlertCircle, ArrowLeft, Play, Pause, RotateCcw,
  Clock, DollarSign, BarChart3, PhoneOff, Save, Loader, User, Loader2,
  Bot, Info, ArrowRight, Activity, Copy, ShoppingCart, AlertTriangle, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { MultiNationalityPassportCard, AgentStatus } from '../components/MultiNationalityPassportCard';
import { TimePickerInput } from '../components/TimePickerInput';
import { apiClient } from 'app';
import { webRTCVoiceClient, VoiceCallStatus } from '../utils/webrtcVoiceClient';
import { useAIVoiceStore, useAIVoiceMasterToggle, useAIVoiceAgents, useAIVoiceConnection } from '../utils/aiVoiceStore';
import { colors, cardStyle } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';
import { createWebRTCVoiceClient, isWebRTCSupported } from '../utils/webrtcVoiceClient';
import { useMenuData } from '../utils/menuCache';



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

export default function AIVoiceAgentSettings() {
  const navigate = useNavigate();
  const { fetchCategories, fetchMenuItems } = useMenuData();
  
  // Use AIVoiceStore for real-time synchronization
  const { enabled: aiVoiceAgentEnabled, isLoading: storeLoading, toggle: toggleMasterSwitch } = useAIVoiceMasterToggle();
  const { agents, selectedAgent, selectAgent } = useAIVoiceAgents();
  const { isConnected: ultravoxConnected, test: testConnection } = useAIVoiceConnection();
  const { settings, updateSettings, hasUnsavedChanges } = useAIVoiceStore();
  
  // Local state variables for component functionality
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [emergencyDisabled, setEmergencyDisabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceSession, setVoiceSession] = useState<any>(null);
  const [ultravoxConnectionStatus, setUltravoxConnectionStatus] = useState(false);
  
  // Journey navigation state
  const [activeTab, setActiveTab] = useState("agent-selection");
  const [hasChanges, setHasChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Menu dependency check states
  const [menuCheckLoading, setMenuCheckLoading] = useState(true);
  const [hasCategories, setHasCategories] = useState(false);
  const [hasMenuItems, setHasMenuItems] = useState(false);
  
  // Voice testing states - WebRTC browser voice client
  const [isVoiceTesting, setIsVoiceTesting] = useState(false);
  const [testingAgentId, setTestingAgentId] = useState<string | null>(null);
  const [voiceClient, setVoiceClient] = useState<any>(null);
  const [voiceCallStatus, setVoiceCallStatus] = useState<VoiceCallStatus>(VoiceCallStatus.IDLE);
  
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
    checkMenuConfiguration();
  }, []);

  // Check Ultravox health status
  useEffect(() => {
    checkUltravoxHealth();
  }, []);

  // Check menu configuration
  const checkMenuConfiguration = async () => {
    try {
      setMenuCheckLoading(true);
      
      // Check for categories and menu items
      const [categoriesData, menuItemsData] = await Promise.all([
        fetchCategories(),
        fetchMenuItems()
      ]);
      
      setHasCategories(categoriesData && categoriesData.length > 0);
      setHasMenuItems(menuItemsData && menuItemsData.length > 0);
    } catch (error) {
      console.error('Error checking menu configuration:', error);
      setHasCategories(false);
      setHasMenuItems(false);
    } finally {
      setMenuCheckLoading(false);
    }
  };

  // Check Ultravox health status
  const checkUltravoxHealth = async () => {
    try {
      const response = await apiClient.ultravox_health();
      const data = await response.json();
      setUltravoxConnectionStatus(data.success || false);
    } catch (error) {
      console.error('Error checking Ultravox health:', error);
      setUltravoxConnectionStatus(false);
    }
  };

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

  // Handle emergency toggle
  const handleEmergencyToggle = (enabled: boolean) => {
    setEmergencyDisabled(enabled);
    if (enabled) {
      toast.error('Emergency mode: AI order processing disabled');
    } else {
      toast.success('AI order processing re-enabled');
    }
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



  const handleVoiceCallError = (error: string) => {
    setIsVoiceTesting(false);
    setTestingAgentId(null);
    toast.error(`Voice call error: ${error}`);
  };

  // Toggle microphone mute
  const toggleMute = () => {
    if (voiceSession) {
      const newMutedState = !isMuted;
      voiceSession.setMuted(newMutedState);
      setIsMuted(newMutedState);
      toast.info(newMutedState ? 'Microphone muted' : 'Microphone unmuted');
    }
  };

  // Status display - will be updated for Twilio Voice SDK
  const getStatusDisplay = () => {
    if (isVoiceTesting) {
      return { text: 'Testing (Twilio SDK)', color: colors.brand.purple, icon: Activity };
    }
    return { text: 'Ready', color: colors.status.success, icon: CheckCircle };
  };

  // Helper function to determine agent status for glow system
  const getAgentStatus = (agent: AgentProfile, isAgentSelected: boolean, isAgentActive: boolean): AgentStatus => {
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

  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
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
  
  // Test connection handler
  const testUltravoxConnection = async () => {
    setConnectionTesting(true);
    try {
      await checkUltravoxHealth();
      toast.success('Connection test completed');
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setConnectionTesting(false);
    }
  };
  
  // Save settings handler
  const saveSettings = async () => {
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

  // Loading state
  if (storeLoading) {
    return (
      <div className="min-h-screen px-8 py-12" style={{
        background: `linear-gradient(135deg, ${colors.background.dark} 0%, ${colors.background.primary} 100%)`
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purpleLight }} />
            <span className="ml-2" style={{ color: colors.text.secondary }}>Loading agents...</span>
          </div>
        </div>
      </div>
    );
  }

  // No agents state
  if (agents.length === 0) {
    return (
      <div className="min-h-screen p-6" style={{
        background: `linear-gradient(135deg, ${colors.background.dark} 0%, ${colors.background.primary} 100%)`
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.muted }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>No Agents Found</h3>
            <p style={{ color: colors.text.secondary }}>Please create agents in the Admin Dashboard first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{
      background: `linear-gradient(135deg, ${colors.background.dark} 0%, ${colors.background.primary} 100%)`
    }}>
      {/* Menu Advisory Banner */}
      {!menuCheckLoading && (!hasCategories || !hasMenuItems) && (
        <div className="max-w-7xl mx-auto mb-6">
          <Alert className="bg-amber-900/20 border-amber-500/30 backdrop-blur-sm">
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/AdminMenu')}
                  className="ml-4 border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
                >
                  Go to Admin Menu
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Fixed System Status Bar */}
        <Card style={{
          ...cardStyle,
          borderColor: `rgba(124, 93, 250, 0.2)`,
          background: `linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(26, 26, 26, 0.9) 100%)`
        }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full`} style={{
                    backgroundColor: ultravoxConnected ? globalColors.status.success : colors.text.muted
                  }} />
                  <span className="text-sm font-medium" style={{
                    color: ultravoxConnected ? globalColors.status.success : colors.text.muted
                  }}>
                    {ultravoxConnected ? 'Connected' : 'Disconnected'}
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
                    onCheckedChange={toggleMasterSwitch}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>
              </div>

              {/* Test Connection Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={testUltravoxConnection}
                disabled={connectionTesting}
                className="border-gray-600 hover:border-purple-500 text-white hover:text-purple-300"
              >
                {connectionTesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Page Header */}
        <div className="mb-8 pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold" style={{
                background: `linear-gradient(135deg, #ffffff 0%, ${colors.brand.purpleLight} 50%, #ffffff 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}>
                AI Voice Agent Settings
              </h1>
              <p className="text-lg" style={{ color: colors.text.secondary }}>
                Manage voice agents and system configuration
              </p>
            </div>
          </div>
        </div>

        {/* Orbital Agent Carousel Hero Section */}
        {agentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purpleLight }} />
          </div>
        ) : agents.length === 0 ? (
          <Card style={{
            ...cardStyle,
            borderColor: `rgba(124, 93, 250, 0.2)`,
            background: `linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(26, 26, 26, 0.9) 100%)`
          }}>
            <CardContent className="py-12 text-center">
              <Bot className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.muted }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>Coming Soon</h3>
              <p style={{ color: colors.text.secondary }}>Voice agents will be available here</p>
            </CardContent>
          </Card>
        ) : null}

        {/* 3-Step Journey Navigation */}
        <div className="max-w-7xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
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
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-white">Setup Journey</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>Step</span>
                  <span className="font-bold text-purple-400">
                    {activeTab === 'agent-selection' ? '1' : activeTab === 'working-hours' ? '2' : '3'}
                  </span>
                  <span>of 3</span>
                </div>
              </div>
              {hasChanges && (
                <div className="flex items-center space-x-2 text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Unsaved changes</span>
                </div>
              )}
            </div>

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
                <Settings className="h-4 w-4 mr-2" />
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
                  {/* Agent Selection UI - Moved from main section */}
                  {agentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purpleLight }} />
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bot className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.muted }} />
                      <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>Coming Soon</h3>
                      <p style={{ color: colors.text.secondary }}>Voice agents will be available here</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {agents.length === 1 ? (
                        // Single Agent: Centered Layout
                        <div className="flex justify-center px-4">
                          <div className="flex flex-col items-center gap-6">
                            {/* Passport Card */}
                            <div className="transition-all duration-500 ease-out" style={{
                              transform: 'scale(1.02)',
                              marginBottom: '12px'
                            }}>
                              <MultiNationalityPassportCard
                                agent={agents[0]}
                                isSelected={true}
                                status={getAgentStatus(agents[0], true, aiVoiceAgentEnabled)}
                                className="transition-all duration-500 ease-out"
                                style={{
                                  boxShadow: aiVoiceAgentEnabled 
                                    ? '0 0 0 3px rgba(124, 93, 250, 0.6), 0 0 20px rgba(124, 93, 250, 0.4), 0 12px 40px rgba(0, 0, 0, 0.4)'
                                    : '0 8px 30px rgba(0, 0, 0, 0.3), 0 4px 15px rgba(0, 0, 0, 0.2)'
                                }}
                              />
                            </div>
                            
                            {/* Voice Test Button - Outside Card */}
                            <Button
                              onClick={() => {
                                if (isVoiceTesting && testingAgentId === agents[0].id) {
                                  stopVoiceTest();
                                } else {
                                  setTestingAgentId(agents[0].id);
                                  setIsVoiceTesting(true);
                                  startVoiceTest(agents[0].id, agents[0].name);
                                }
                              }}
                              disabled={false}
                              className="
                                w-full max-w-[300px] h-10 font-semibold text-sm tracking-wide
                                transition-all duration-200 rounded-lg
                                border shadow-sm
                                hover:shadow-md hover:scale-[1.02]
                                active:scale-[0.98]
                                disabled:opacity-50 disabled:cursor-not-allowed
                              "
                              style={{
                                backgroundColor: (isVoiceTesting && testingAgentId === agents[0].id) 
                                  ? (voiceCallStatus === VoiceCallStatus.CONNECTED ? '#dc2626' : '#eab308')
                                  : '#7C5DFA',
                                borderColor: (isVoiceTesting && testingAgentId === agents[0].id) 
                                  ? (voiceCallStatus === VoiceCallStatus.CONNECTED ? '#dc2626' : '#eab308')
                                  : '#7C5DFA',
                                color: '#FFFFFF'
                              }}
                            >
                              <span className="mr-2">
                                {(isVoiceTesting && testingAgentId === agents[0].id) ? (
                                  voiceCallStatus === VoiceCallStatus.CONNECTED ? (
                                    <PhoneOff className="w-4 h-4" />
                                  ) : (
                                    <Phone className="w-4 h-4 animate-pulse" />
                                  )
                                ) : (
                                  <Phone className="w-4 h-4" />
                                )}
                              </span>
                              {(isVoiceTesting && testingAgentId === agents[0].id) ? (
                                voiceCallStatus === VoiceCallStatus.CONNECTED ? (
                                  `END CALL ${agents[0].name.toUpperCase()}`
                                ) : (
                                  `CONNECTING ${agents[0].name.toUpperCase()}...`
                                )
                              ) : (
                                `CALL ${agents[0].name.toUpperCase()}`
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : agents.length === 2 ? (
                        // Two Agents: Side-by-Side Layout (Responsive)
                        <div className="flex justify-center items-center gap-4 md:gap-8 lg:gap-12 px-4 flex-wrap">
                          {agents.map((agent, index) => {
                            const isSelected = selectedAgentId === agent.id;
                            return (
                              <div key={agent.id} className="flex flex-col items-center gap-6">
                                {/* Passport Card */}
                                <div
                                  className="transition-all duration-500 ease-out cursor-pointer flex-shrink-0"
                                  style={{
                                    transform: `scale(${isSelected ? 1.02 : 0.98})`,
                                    opacity: isSelected ? 1 : 0.8,
                                    marginBottom: isSelected ? '12px' : '0px'
                                  }}
                                  onClick={() => handleAgentSelect(agent.id)}
                                >
                                  <MultiNationalityPassportCard
                                    agent={agent}
                                    isSelected={isSelected}
                                    status={getAgentStatus(agent, isSelected, aiVoiceAgentEnabled)}
                                    className="transition-all duration-500 ease-out"
                                    style={{
                                      boxShadow: isSelected 
                                        ? '0 0 0 3px rgba(124, 93, 250, 0.6), 0 0 20px rgba(124, 93, 250, 0.4), 0 12px 40px rgba(0, 0, 0, 0.4)'
                                        : '0 8px 30px rgba(0, 0, 0, 0.3), 0 4px 15px rgba(0, 0, 0, 0.2)'
                                    }}
                                  />
                                </div>
                                
                                {/* Voice Test Button - Outside Card */}
                                <Button
                                  onClick={() => {
                                    if (isVoiceTesting && testingAgentId === agent.id) {
                                      stopVoiceTest();
                                    } else {
                                      setTestingAgentId(agent.id);
                                      setIsVoiceTesting(true);
                                      startVoiceTest(agent.id, agent.name);
                                    }
                                  }}
                                  disabled={isVoiceTesting && testingAgentId !== agent.id}
                                  className="
                                    w-full max-w-[300px] h-10 font-semibold text-sm tracking-wide
                                    transition-all duration-200 rounded-lg
                                    border shadow-sm
                                    hover:shadow-md hover:scale-[1.02]
                                    active:scale-[0.98]
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                  "
                                  style={{
                                    backgroundColor: (isVoiceTesting && testingAgentId === agent.id) 
                                      ? (voiceCallStatus === VoiceCallStatus.CONNECTED ? '#dc2626' : '#eab308')
                                      : '#7C5DFA',
                                    borderColor: (isVoiceTesting && testingAgentId === agent.id) 
                                      ? (voiceCallStatus === VoiceCallStatus.CONNECTED ? '#dc2626' : '#eab308')
                                      : '#7C5DFA',
                                    color: '#FFFFFF'
                                  }}
                                >
                                  <span className="mr-2">
                                    {(isVoiceTesting && testingAgentId === agent.id) ? (
                                      voiceCallStatus === VoiceCallStatus.CONNECTED ? (
                                        <PhoneOff className="w-4 h-4" />
                                      ) : (
                                        <Phone className="w-4 h-4 animate-pulse" />
                                      )
                                    ) : (
                                      <Phone className="w-4 h-4" />
                                    )}
                                  </span>
                                  {(isVoiceTesting && testingAgentId === agent.id) ? (
                                    voiceCallStatus === VoiceCallStatus.CONNECTED ? (
                                      `END CALL ${agent.name.toUpperCase()}`
                                    ) : (
                                      `CONNECTING ${agent.name.toUpperCase()}...`
                                    )
                                  ) : (
                                    `CALL ${agent.name.toUpperCase()}`
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        // Three+ Agents: Horizontal Carousel Layout
                        <HorizontalAgentCarousel
                          agents={agents}
                          selectedAgentId={selectedAgentId}
                          onSelectAgent={handleAgentSelect}
                          aiVoiceAgentEnabled={aiVoiceAgentEnabled}
                          isVoiceTesting={isVoiceTesting}
                          testingAgentId={testingAgentId}
                          voiceCallStatus={voiceCallStatus}
                          onTestVoice={(agentId, agentName) => {
                            if (isVoiceTesting && testingAgentId === agentId) {
                              stopVoiceTest();
                            } else {
                              setTestingAgentId(agentId);
                              setIsVoiceTesting(true);
                              startVoiceTest(agentId, agentName);
                            }
                          }}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Step 1 Actions */}
                  <div className="flex justify-end pt-6">
                    <Button
                      onClick={handleNextStep}
                      disabled={!selectedAgentId}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
                    >
                      Configure Schedule
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 2: Working Hours Configuration */}
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
                  {/* Working Hours Content - Will be moved here */}
                  <div className="space-y-6">
                    {/* Business Context Quick Setup */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Setup</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const restaurantHours = { start: '12:00', end: '21:00' };
                            const newTimeWindows = { ...timeWindows };
                            Object.keys(newTimeWindows).forEach(day => {
                              newTimeWindows[day as keyof typeof newTimeWindows] = {
                                ...newTimeWindows[day as keyof typeof newTimeWindows],
                                start: restaurantHours.start,
                                end: restaurantHours.end,
                                enabled: true
                              };
                            });
                            setTimeWindows(newTimeWindows);
                            handleConfigurationChange();
                            toast.success('Applied restaurant hours (12:00-22:00) to all days');
                          }}
                          className="h-12 border-purple-500/30 text-white hover:bg-purple-500/10"
                        >
                          <span className="text-center">
                            <div className="font-medium">Restaurant Hours</div>
                            <div className="text-xs text-gray-400">12:00 - 22:00</div>
                          </span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            const allDayHours = { start: '00:00', end: '23:59' };
                            const newTimeWindows = { ...timeWindows };
                            Object.keys(newTimeWindows).forEach(day => {
                              newTimeWindows[day as keyof typeof newTimeWindows] = {
                                ...newTimeWindows[day as keyof typeof newTimeWindows],
                                start: allDayHours.start,
                                end: allDayHours.end,
                                enabled: true
                              };
                            });
                            setTimeWindows(newTimeWindows);
                            handleConfigurationChange();
                            toast.success('Applied 24/7 availability to all days');
                          }}
                          className="h-12 border-purple-500/30 text-white hover:bg-purple-500/10"
                        >
                          <span className="text-center">
                            <div className="font-medium">24/7 Availability</div>
                            <div className="text-xs text-gray-400">Always Open</div>
                          </span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            const lunchDinnerHours = { start: '11:30', end: '14:30' };
                            const newTimeWindows = { ...timeWindows };
                            Object.keys(newTimeWindows).forEach(day => {
                              newTimeWindows[day as keyof typeof newTimeWindows] = {
                                ...newTimeWindows[day as keyof typeof newTimeWindows],
                                start: lunchDinnerHours.start,
                                end: lunchDinnerHours.end,
                                enabled: true
                              };
                            });
                            setTimeWindows(newTimeWindows);
                            handleConfigurationChange();
                            toast.success('Applied lunch hours (11:30-14:30) to all days');
                          }}
                          className="h-12 border-purple-500/30 text-white hover:bg-purple-500/10"
                        >
                          <span className="text-center">
                            <div className="font-medium">Lunch Hours</div>
                            <div className="text-xs text-gray-400">11:30 - 14:30</div>
                          </span>
                        </Button>
                      </div>
                    </div>
                    
                    <Separator style={{ backgroundColor: `rgba(124, 93, 250, 0.2)` }} />

                    {/* Visual Schedule Interface */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Weekly Schedule</h4>
                        
                        {/* Quick Actions */}
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const mondayHours = timeWindows.monday;
                              setTimeWindows(prev => ({
                                ...prev,
                                tuesday: { ...prev.tuesday, start: mondayHours.start, end: mondayHours.end },
                                wednesday: { ...prev.wednesday, start: mondayHours.start, end: mondayHours.end },
                                thursday: { ...prev.thursday, start: mondayHours.start, end: mondayHours.end },
                                friday: { ...prev.friday, start: mondayHours.start, end: mondayHours.end }
                              }));
                              handleConfigurationChange();
                              toast.success('Applied Monday hours to weekdays');
                            }}
                            className="text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            Copy to Weekdays
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
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
                                handleConfigurationChange();
                                toast.success('Applied same hours to all days');
                              }
                            }}
                            className="text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            Copy to All Days
                          </Button>
                        </div>
                      </div>

                      {/* Weekly Grid with ON DUTY/OFF DUTY Status */}
                      <div className="space-y-3">
                        {Object.entries(timeWindows).map(([day, window]) => {
                          const isOnDuty = window.enabled;
                          const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
                          
                          return (
                            <div key={day} className="rounded-lg p-4 transition-all duration-200" style={{
                              backgroundColor: isOnDuty ? `rgba(124, 93, 250, 0.1)` : `rgba(30, 30, 30, 0.5)`,
                              border: `1px solid ${isOnDuty ? 'rgba(124, 93, 250, 0.4)' : 'rgba(124, 93, 250, 0.2)'}`,
                              boxShadow: isOnDuty ? '0 0 0 1px rgba(124, 93, 250, 0.1)' : 'none'
                            }}>
                              <div className="flex items-center justify-between">
                                {/* Day and Status */}
                                <div className="flex items-center space-x-4 flex-1">
                                  <div className="w-16">
                                    <span className="font-semibold text-white text-base">{dayLabel}</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    {isOnDuty ? (
                                      <>
                                        <Phone className="h-4 w-4 text-green-400" />
                                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 font-medium px-3 py-1">
                                          ON DUTY
                                        </Badge>
                                      </>
                                    ) : (
                                      <>
                                        <PhoneOff className="h-4 w-4 text-gray-500" />
                                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 font-medium px-3 py-1">
                                          OFF DUTY
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                  
                                  {/* Time Display/Pickers */}
                                  <div className="flex-1 flex items-center justify-center">
                                    {isOnDuty ? (
                                      <div className="flex items-center space-x-3">
                                        <TimePickerInput
                                          value={window.start}
                                          onChange={(start) => {
                                            setTimeWindows(prev => ({
                                              ...prev,
                                              [day]: { ...prev[day as keyof typeof prev], start }
                                            }));
                                            handleConfigurationChange();
                                          }}
                                          className="w-20 bg-gray-800/50 border-gray-600 text-white text-sm"
                                        />
                                        <span className="text-sm font-medium text-gray-400">to</span>
                                        <TimePickerInput
                                          value={window.end}
                                          onChange={(end) => {
                                            setTimeWindows(prev => ({
                                              ...prev,
                                              [day]: { ...prev[day as keyof typeof prev], end }
                                            }));
                                            handleConfigurationChange();
                                          }}
                                          className="w-20 bg-gray-800/50 border-gray-600 text-white text-sm"
                                        />
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-500 italic">Not scheduled</span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Toggle Switch */}
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
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Step 2 Actions */}
                  <div className="flex justify-between pt-6">
                    <Button
                      onClick={handlePreviousStep}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Agent Selection
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
                    >
                      Set Order Settings
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 3: Order Settings & System Configuration */}
            <TabsContent value="order-settings" className="space-y-8">
              <Card style={{
                ...cardStyle,
                borderColor: `rgba(124, 93, 250, 0.2)`,
                background: `linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(26, 26, 26, 0.9) 100%)`
              }}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Settings className="h-6 w-6 text-purple-400" />
                    <span className="text-white text-xl">Step 3: Order Settings & System Configuration</span>
                  </CardTitle>
                  <p className="text-gray-400 mt-2">
                    Configure order processing, phone settings, and system preferences.
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Order Settings */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Auto-Approve Orders */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium text-white">Auto-Approve Orders</Label>
                        <Switch
                          checked={autoApprove}
                          onCheckedChange={(checked) => {
                            setAutoApprove(checked);
                            handleConfigurationChange();
                          }}
                          className="data-[state=checked]:bg-purple-500"
                        />
                      </div>
                      <p className="text-sm leading-relaxed mt-2" style={{ color: colors.text.secondary }}>
                        Automatically approve incoming voice orders without staff review
                      </p>
                    </div>
                    
                    {/* Order Time Windows */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium text-white">Order Time Windows</Label>
                        <Switch
                          checked={enabledTimeWindows}
                          onCheckedChange={(checked) => {
                            setEnabledTimeWindows(checked);
                            handleConfigurationChange();
                          }}
                          className="data-[state=checked]:bg-purple-500"
                        />
                      </div>
                      <p className="text-sm leading-relaxed mt-2" style={{ color: colors.text.secondary }}>
                        Only accept orders during specific hours
                      </p>
                    </div>
                  </div>
                  
                  {/* Phone Configuration */}
                  <Separator style={{ backgroundColor: `rgba(124, 93, 250, 0.2)` }} />
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <PhoneCall className="h-5 w-5 text-purple-400" />
                      <span>Phone Configuration</span>
                    </h4>
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="font-medium text-white">{phoneNumber}</p>
                          <p className="text-sm text-gray-400">Primary voice line</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full`} style={{
                          backgroundColor: phoneActive ? '#10B981' : '#6B7280'
                        }} />
                        <span className="text-sm" style={{
                          color: phoneActive ? '#10B981' : '#6B7280'
                        }}>
                          {phoneActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Dashboard */}
                  <Separator style={{ backgroundColor: `rgba(124, 93, 250, 0.2)` }} />
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-purple-400" />
                      <span>Analytics Overview</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">Voice Orders Today</p>
                            <p className="text-2xl font-bold text-white">27</p>
                          </div>
                          <ShoppingCart className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">Call Success Rate</p>
                            <p className="text-2xl font-bold text-green-400">94%</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">Avg. Call Duration</p>
                            <p className="text-2xl font-bold text-blue-400">3:42</p>
                          </div>
                          <Clock className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Health & Controls */}
                  <Separator style={{ backgroundColor: `rgba(124, 93, 250, 0.2)` }} />
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-purple-400" />
                      <span>System Health & Emergency Controls</span>
                    </h4>
                    
                    {/* System Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-800/50 rounded-lg border border-green-500/20">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <div>
                            <p className="font-medium text-white">AI Voice System</p>
                            <p className="text-sm text-green-400">Operational</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-800/50 rounded-lg border border-green-500/20">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <div>
                            <p className="font-medium text-white">Order Processing</p>
                            <p className="text-sm text-green-400">Online</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Emergency Controls */}
                    <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                          <div>
                            <p className="font-medium text-white">Emergency Disable</p>
                            <p className="text-sm text-gray-400">Immediately disable AI voice agent for maintenance</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            toast.info('Emergency disable would halt all voice operations');
                          }}
                        >
                          Emergency Stop
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Step 3 Actions */}
                  <div className="flex justify-between pt-6">
                    <Button
                      onClick={handlePreviousStep}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Working Hours
                    </Button>
                    <Button
                      onClick={handleSaveConfiguration}
                      disabled={isPublishing}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving Configuration...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>






      </div>
    </div>
  );
}
