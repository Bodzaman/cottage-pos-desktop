import React, { useState, useEffect, useMemo } from 'react';
import { Bot, User, Plus, Edit2, Trash2, Play, Pause, Phone, PhoneOff, Settings, Image, ExternalLink, MessageSquare, FileText, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { colors } from '../utils/designSystem';
import ImageUploadBrowser from './ImageUploadBrowser';
import { OptimizedImage } from 'components/OptimizedImage';
import { AgentProfileInput } from 'types';
import { VoiceCallStatus } from 'utils/webrtcVoiceClient';

// Local type definitions for nested objects (not exposed in API contract)
interface ConversationSettings {
  max_duration?: number;
  voice_speed?: number;
  voice_pitch?: number;
  [key: string]: any;
}

interface ToolConfig {
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}

interface KnowledgeBaseConfig {
  enabled: boolean;
  sources?: string[];
  [key: string]: any;
}

// Agent Profile interface based on backend model
interface AgentProfile {
  id: string;
  name: string;
  description?: string;
  image_id?: string;
  avatar_url?: string;
  voice_type: string;
  personality: string;
  system_prompt?: string;
  conversation_settings?: ConversationSettings;
  tools?: ToolConfig[];
  knowledge_base?: KnowledgeBaseConfig;
  is_admin_visible: boolean;
  ultravox_agent_id?: string;
  created_at: string;
  updated_at: string;
  // New passport fields
  agent_type?: string;
  agent_role?: string;
  nationality?: string;
  passport_nationality?: string;
  place_of_birth?: string;
  creation_date?: string;
  activation_date?: string;
  date_of_expiry?: string;
  authority?: string;
  gender?: string;
}

interface AgentManagementPanelProps {
  onRefresh?: () => void;
}

export function AgentManagementPanel({ onRefresh }: AgentManagementPanelProps) {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentProfile | null>(null);
  const [voiceTypes, setVoiceTypes] = useState<string[]>([]);
  const [voiceDetails, setVoiceDetails] = useState<any[]>([]);
  const [personalityTypes, setPersonalityTypes] = useState<string[]>([]);
  
  // Form states
  const [createForm, setCreateForm] = useState<AgentProfileInput>({
    name: '',
    description: '',
    voice_type: '',
    personality: '',
    system_prompt: '',
    is_admin_visible: false,
    // Default passport values
    agent_type: 'AGENT',
    agent_role: '',
    nationality: 'COTTAGE TANDOORI',
    place_of_birth: 'DEVELOPMENT LAB',
    creation_date: new Date().toISOString().split('T')[0],
    activation_date: new Date().toISOString().split('T')[0],
    date_of_expiry: 'UNLIMITED',
    authority: 'RESTAURANT ADMIN',
    gender: ''
  });
  
  const [editForm, setEditForm] = useState<AgentProfileInput>({});
  // Avatar selection states
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>('');
  const [selectedAvatarFilename, setSelectedAvatarFilename] = useState<string>('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [editAvatarFilename, setEditAvatarFilename] = useState<string>('');
  
  // Voice testing functionality - WebRTC browser voice client
  const [isVoiceTesting, setIsVoiceTesting] = useState(false);
  const [testingAgentId, setTestingAgentId] = useState<string | null>(null);
  const [testingAgentName, setTestingAgentName] = useState<string>('');
  const [voiceClient, setVoiceClient] = useState<any>(null);
  const [voiceCallStatus, setVoiceCallStatus] = useState<VoiceCallStatus>(VoiceCallStatus.IDLE);
  
  // Avatar handling functions
  // Reset avatar selection
  const clearAvatar = () => {
    setSelectedAvatarUrl('');
    setSelectedAvatarFilename('');
  };

  const clearEditAvatar = () => {
    setEditAvatarUrl('');
    setEditAvatarFilename('');
  };

  // Handle avatar selection from ImageUploadBrowser
  const handleAvatarSelect = (imageUrl: string, filename: string) => {
    setSelectedAvatarUrl(imageUrl);
    setSelectedAvatarFilename(filename);
  };

  const handleEditAvatarSelect = (imageUrl: string, filename: string) => {
    setEditAvatarUrl(imageUrl);
    setEditAvatarFilename(filename);
  };

  // Load data on mount
  useEffect(() => {
    loadAgents();
    loadVoiceTypes();
    loadPersonalityTypes();
  }, []);

  // Force refresh when dialog opens  
  useEffect(() => {
    if (isEditDialogOpen && editingAgent) {
      console.log('🔄 Dialog opened, current editForm.system_prompt:', editForm.system_prompt);
      console.log('🔄 Original agent system_prompt:', editingAgent.system_prompt);
    }
  }, [isEditDialogOpen, editingAgent, editForm.system_prompt]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get_agent_profiles_endpoint();
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.agents || []);
      } else {
        toast.error(`Failed to load agents: ${data.message}`);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const loadVoiceTypes = async () => {
    try {
      const response = await apiClient.get_voice_types();
      const data = await response.json();
      
      if (data.success) {
        // Use new detailed voice data if available, otherwise fall back to legacy voice_types
        if (data.voices && data.voices.length > 0) {
          // Use the detailed voice data
          const voiceNames = data.voices.map((voice: any) => voice.name);
          setVoiceTypes(voiceNames);
          setVoiceDetails(data.voices);
          console.log('🎤 Loaded enhanced voice data:', data.voices.length, 'voices');
        } else if (data.voice_types && data.voice_types.length > 0) {
          // Fall back to legacy voice_types
          setVoiceTypes(data.voice_types);
          console.log('🎤 Loaded legacy voice types:', data.voice_types.length, 'types');
        } else {
          // Use fallback voice types
          setVoiceTypes(['Standard', 'Male', 'Female']);
          console.log('🎤 Using fallback voice types');
        }
      } else {
        // Use fallback voice types
        setVoiceTypes(['Standard', 'Male', 'Female']);
        console.log('🎤 API returned unsuccessful, using fallback voice types');
      }
    } catch (error) {
      console.warn('Voice types API failed (expected if Ultravox not configured):', error.message || error);
      setVoiceTypes(['Standard', 'Male', 'Female']);
    }
  };

  const loadPersonalityTypes = async () => {
    try {
      const response = await apiClient.check_voice_api_health2();
      const data = await response.json();
      
      // Default personality types if API doesn't provide them
      setPersonalityTypes(['friendly', 'professional', 'enthusiastic', 'formal', 'casual']);
    } catch (error) {
      console.warn('Voice API health check failed (expected if Ultravox not configured):', error.message || error);
      setPersonalityTypes(['friendly', 'professional', 'enthusiastic', 'formal', 'casual']);
    }
  };

  const handleCreateAgent = async () => {
    try {
      if (!createForm.name || !createForm.voice_type || !createForm.personality) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Prepare the agent data
      const agentData: AgentProfileInput = {
        ...createForm
      };
      
      const response = await apiClient.create_agent(agentData);
      const data = await response.json();
      
      if (data.success) {
        // Update avatar after agent is created if avatar was selected
        if (selectedAvatarUrl && selectedAvatarFilename && data.agent?.id) {
          try {
            const avatarResponse = await apiClient.update_agent_avatar({
              agent_id: data.agent.id,
              avatar_url: selectedAvatarUrl,
              image_filename: selectedAvatarFilename
            });
            
            const avatarData = await avatarResponse.json();
            if (!avatarData.success) {
              console.warn('Failed to update avatar:', avatarData.message);
              toast.warn('Agent created but avatar upload failed');
            } else {
              console.log('✅ Avatar successfully linked to agent:', data.agent.id);
            }
          } catch (avatarError) {
            console.error('Error updating avatar:', avatarError);
            toast.warn('Agent created but avatar upload failed');
          }
        }
        
        toast.success('Agent created successfully');
        setIsCreateDialogOpen(false);
        setCreateForm({
          name: '',
          description: '',
          voice_type: '',
          personality: '',
          system_prompt: '',
          is_admin_visible: false
        });
        clearAvatar();
        loadAgents();
        onRefresh?.();
      } else {
        toast.error(`Failed to create agent: ${data.message}`);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent');
    }
  };

  const handleEditAgent = async () => {
    try {
      if (!editingAgent) return;

      const updateData = { ...editForm };
      
      // Preserve existing avatar_url if no new avatar is selected
      if (!editAvatarUrl && editingAgent.avatar_url) {
        updateData.avatar_url = editingAgent.avatar_url;
      }
      
      // Add avatar update if selected
      if (editAvatarUrl && editAvatarFilename) {
        updateData.avatar_url = editAvatarUrl;
        updateData.image_filename = editAvatarFilename;
      }

      const response = await apiClient.update_agent({ agentId: editingAgent.id }, updateData);
      const data = await response.json();
      
      if (data.success) {
        // Update avatar separately if needed
        if (editAvatarUrl && editAvatarFilename) {
          try {
            const avatarResponse = await apiClient.update_agent_avatar({
              agent_id: editingAgent.id,
              avatar_url: editAvatarUrl,
              image_filename: editAvatarFilename
            });
            
            const avatarData = await avatarResponse.json();
            if (!avatarData.success) {
              console.warn('Failed to update avatar:', avatarData.message);
            }
          } catch (avatarError) {
            console.error('Error updating avatar:', avatarError);
          }
        }
        
        toast.success('Agent updated successfully');
        setIsEditDialogOpen(false);
        setEditingAgent(null);
        setEditForm({});
        clearEditAvatar();
        loadAgents();
        onRefresh?.();
      } else {
        toast.error(`Failed to update agent: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete agent "${agentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiClient.delete_agent({ agentId });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Agent deleted successfully');
        loadAgents();
        onRefresh?.();
      } else {
        toast.error(`Failed to delete agent: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  // Toggle agent visibility function
  const toggleAgentVisibility = async (agentId: string, isVisible: boolean) => {
    try {
      const response = await apiClient.update_agent({ agentId }, { is_admin_visible: isVisible });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Agent ${isVisible ? 'shown in' : 'hidden from'} admin settings`);
        loadAgents();
        onRefresh?.();
      } else {
        toast.error(`Failed to update agent visibility: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating agent visibility:', error);
      toast.error('Failed to update agent visibility');
    }
  };
  
  // Start voice test using WebRTC direct browser connection
  const startVoiceTest = async (agentId: string, agentName: string) => {
    try {
      // Check WebRTC support
      if (!isWebRTCSupported()) {
        toast.error('WebRTC is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      console.log(`🎙️ Starting WebRTC voice test with agent: ${agentName}`);
      toast.success(`🎙️ Connecting to ${agentName}... Please allow microphone access!`);
      
      setIsVoiceTesting(true);
      setTestingAgentId(agentId);
      setTestingAgentName(agentName);
      setVoiceCallStatus(VoiceCallStatus.CONNECTING);
      
      // Create WebRTC voice client
      const client = createWebRTCVoiceClient({
        agentId: agentId,
        agentName: agentName,
        onStatusChange: (status) => {
          setVoiceCallStatus(status);
          
          if (status === VoiceCallStatus.CONNECTED) {
            toast.success(`✅ Connected to ${agentName}! Start speaking...`);
          } else if (status === VoiceCallStatus.DISCONNECTED) {
            setIsVoiceTesting(false);
            setTestingAgentId(null);
            setTestingAgentName('');
            setVoiceClient(null);
          } else if (status === VoiceCallStatus.FAILED) {
            setIsVoiceTesting(false);
            setTestingAgentId(null);
            setTestingAgentName('');
            setVoiceClient(null);
          }
        },
        onError: (error) => {
          console.error('❌ Voice test error:', error);
          toast.error(`Voice test failed: ${error}`);
          setIsVoiceTesting(false);
          setTestingAgentId(null);
          setTestingAgentName('');
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
      setTestingAgentName('');
      setVoiceClient(null);
      toast.error(`Voice test failed: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Stop voice test with proper cleanup
  const stopVoiceTest = async () => {
    try {
      // End the WebRTC voice call
      if (voiceClient) {
        await voiceClient.endCall();
        setVoiceClient(null);
      }
      
      setIsVoiceTesting(false);
      setTestingAgentId(null);
      setTestingAgentName('');
      setVoiceCallStatus(VoiceCallStatus.IDLE);
      toast.info('✅ Voice test session ended');
      
    } catch (error) {
      console.error('Error stopping voice test:', error);
      // Still clean up state even if there's an error
      setIsVoiceTesting(false);
      setTestingAgentId(null);
      setTestingAgentName('');
      setVoiceCallStatus(VoiceCallStatus.IDLE);
    }
  };
  


  const openEditDialog = (agent: AgentProfile) => {
    console.log('🎯 Opening edit dialog for agent:', agent.name);
    console.log('📝 Agent system_prompt:', agent.system_prompt);
    
    setEditingAgent(agent);
    setEditForm({
      name: agent.name,
      description: agent.description,
      voice_type: agent.voice_type,
      personality: agent.personality,
      system_prompt: agent.system_prompt,
      is_admin_visible: agent.is_admin_visible,
      // Include passport fields with defaults if not present
      agent_type: agent.agent_type || 'AGENT',
      agent_role: agent.agent_role || agent.personality,
      nationality: agent.nationality || 'COTTAGE TANDOORI',
      passport_nationality: agent.passport_nationality || 'GBR',
      place_of_birth: agent.place_of_birth || 'DEVELOPMENT LAB',
      creation_date: agent.creation_date || agent.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      activation_date: agent.activation_date || agent.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      date_of_expiry: agent.date_of_expiry || 'UNLIMITED',
      authority: agent.authority || 'RESTAURANT ADMIN',
      gender: agent.gender || ''
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purpleLight }} />
        <span className="ml-3 text-white">Loading agents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bot className="h-5 w-5" style={{ color: colors.brand.purpleLight }} />
            Agent Management Panel
          </h3>
          <p style={{ color: colors.text.secondary }} className="mt-1">
            Manage your Ultravox AI voice agents, create new agents, and configure existing ones.
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)] border border-[rgba(124,93,250,0.3)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" style={{
            backgroundColor: colors.background.primary,
            border: `1px solid rgba(124, 93, 250, 0.3)`
          }}>
            <DialogHeader>
              <DialogTitle className="text-white">Create New Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              {/* Avatar Selection Section */}
              <div>
                <Label className="text-white">Agent Avatar</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[rgba(124,93,250,0.2)] border-2 border-[rgba(124,93,250,0.3)] flex items-center justify-center overflow-hidden">
                    {selectedAvatarUrl ? (
                      <OptimizedImage
                        fallbackUrl={selectedAvatarUrl}
                        variant="thumbnail"
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8" style={{ color: colors.brand.purpleLight }} />
                    )}
                  </div>
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
                          className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Browse Avatar
                        </Button>
                      }
                    />
                    {selectedAvatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearAvatar}
                        className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
                      >
                        Clear
                      </Button>
                    )}
                    {selectedAvatarFilename && (
                      <p className="text-xs text-gray-400 mt-1">Selected: {selectedAvatarFilename}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#BBC3E1] mt-1">Upload a square image (max 5MB)</p>
              </div>
              
              <div>
                <Label htmlFor="name" className="text-white">Agent Name *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                  placeholder="e.g., Restaurant Voice Assistant"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                  placeholder="Describe this agent's purpose and characteristics"
                  rows={3}
                />
              </div>
              
              {/* Passport Fields Section */}
              <div className="space-y-4 p-4 bg-[rgba(30,30,30,0.3)] rounded-lg border border-[rgba(124,93,250,0.2)]">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Bot className="h-4 w-4" style={{ color: colors.brand.purpleLight }} />
                  Passport Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agent_type" className="text-white">Type</Label>
                    <Input
                      id="agent_type"
                      value={createForm.agent_type || ''}
                      onChange={(e) => setCreateForm({ ...createForm, agent_type: e.target.value })}
                      className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                      placeholder="AGENT"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="agent_role" className="text-white">Given Names/Role</Label>
                    <Input
                      id="agent_role"
                      value={createForm.agent_role || ''}
                      onChange={(e) => setCreateForm({ ...createForm, agent_role: e.target.value })}
                      className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                      placeholder="Voice Assistant"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nationality" className="text-white">Nationality</Label>
                    <Input
                      id="nationality"
                      value={createForm.nationality || ''}
                      onChange={(e) => setCreateForm({ ...createForm, nationality: e.target.value })}
                      className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                      placeholder="COTTAGE TANDOORI"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="passport_nationality" className="text-white">Passport/Nationality</Label>
                    <select
                      id="passport_nationality"
                      value={createForm.passport_nationality || 'GBR'}
                      onChange={(e) => setCreateForm({ ...createForm, passport_nationality: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-[rgba(30,30,30,0.5)] border border-[rgba(124,93,250,0.3)] text-white rounded-md"
                    >
                      <option value="GBR">🇬🇧 United Kingdom (GBR)</option>
                      <option value="USA">🇺🇸 United States (USA)</option>
                      <option value="IND">🇮🇳 India (IND)</option>
                      <option value="BGD">🇧🇩 Bangladesh (BGD)</option>
                      <option value="CHN">🇨🇳 China (CHN)</option>
                      <option value="ESP">🇪🇸 Spain (ESP)</option>
                      <option value="THA">🇹🇭 Thailand (THA)</option>
                      <option value="TUR">🇹🇷 Turkey (TUR)</option>
                      <option value="ARE">🇦🇪 UAE (ARE)</option>
                      <option value="DEU">🇩🇪 Germany (DEU)</option>
                      <option value="FRA">🇫🇷 France (FRA)</option>
                      <option value="ITA">🇮🇹 Italy (ITA)</option>
                      <option value="NLD">🇳🇱 Netherlands (NLD)</option>
                      <option value="AUS">🇦🇺 Australia (AUS)</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="nationality" className="text-white">Nationality</Label>
                    <Input
                      id="nationality"
                      value={createForm.nationality || ''}
                      onChange={(e) => setCreateForm({ ...createForm, nationality: e.target.value })}
                      className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                      placeholder="COTTAGE TANDOORI"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gender" className="text-white">Gender</Label>
                    <select
                      id="gender"
                      value={createForm.gender || ''}
                      onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-[rgba(30,30,30,0.5)] border border-[rgba(124,93,250,0.3)] text-white rounded-md"
                    >
                      <option value="">Select Gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="creation_date" className="text-white">Date of Birth</Label>
                    <Input
                      id="creation_date"
                      type="date"
                      value={createForm.creation_date || ''}
                      onChange={(e) => setCreateForm({ ...createForm, creation_date: e.target.value })}
                      className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="activation_date" className="text-white">Date of Issue</Label>
                    <Input
                      id="activation_date"
                      type="date"
                      value={createForm.activation_date || ''}
                      onChange={(e) => setCreateForm({ ...createForm, activation_date: e.target.value })}
                      className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="authority" className="text-white">Authority</Label>
                    <Input
                      id="authority"
                      value={createForm.authority || ''}
                      onChange={(e) => setCreateForm({ ...createForm, authority: e.target.value })}
                      className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                      placeholder="RESTAURANT ADMIN"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date_of_expiry" className="text-white">Date of Expiry</Label>
                    <Input
                      id="dateof_expiry"
                      value={createForm.date_of_expiry || ''}
                      onChange={(e) => setCreateForm({ ...createForm, date_of_expiry: e.target.value })}
                      className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                      placeholder="UNLIMITED"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="voice_type" className="text-white">Voice Type *</Label>
                  <Select 
                    value={createForm.voice_type} 
                    onValueChange={(value) => setCreateForm({ ...createForm, voice_type: value })}
                  >
                    <SelectTrigger className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto bg-[rgba(30,30,30,0.95)] border-[rgba(124,93,250,0.3)]">
                      {voiceDetails.length > 0 ? (
                        voiceDetails.map((voice) => (
                          <SelectItem 
                            key={voice.voice_id} 
                            value={voice.name}
                            className="text-white hover:bg-[rgba(124,93,250,0.2)] focus:bg-[rgba(124,93,250,0.2)]"
                          >
                            <div className="flex flex-col">
                              <span>{voice.name}</span>
                              {voice.language && (
                                <span className="text-xs text-gray-400">{voice.language}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        voiceTypes.map((voice) => (
                          <SelectItem 
                            key={voice} 
                            value={voice}
                            className="text-white hover:bg-[rgba(124,93,250,0.2)] focus:bg-[rgba(124,93,250,0.2)]"
                          >
                            {voice.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="personality" className="text-white">Personality *</Label>
                  <Select 
                    value={createForm.personality} 
                    onValueChange={(value) => setCreateForm({ ...createForm, personality: value })}
                  >
                    <SelectTrigger className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white">
                      <SelectValue placeholder="Select personality" />
                    </SelectTrigger>
                    <SelectContent>
                      {personalityTypes.map((personality) => (
                        <SelectItem key={personality} value={personality}>
                          {personality.charAt(0).toUpperCase() + personality.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#BBC3E1] mt-1">Affects agent behavior in conversations and appears as a badge on agent cards</p>
                </div>
              </div>
              
              {/* System Prompt Editor */}
              <div>
                <Label htmlFor="system_prompt" className="text-white flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  System Prompt
                </Label>
                <Textarea
                  id="system_prompt"
                  value={createForm.system_prompt || ''}
                  onChange={(e) => setCreateForm({ ...createForm, system_prompt: e.target.value })}
                  className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white font-mono text-sm"
                  placeholder="Enter custom system prompt to define agent behavior (optional - will use default if empty)"
                  rows={4}
                />
                <p className="text-xs text-[#BBC3E1] mt-1">Define how the AI agent should behave and respond to customers</p>
              </div>
              
              {/* Admin Visibility Toggle */}
              <div className="flex items-center justify-between p-4 bg-[rgba(30,30,30,0.3)] rounded-lg border border-[rgba(124,93,250,0.2)] mt-2">
                <div className="flex items-center gap-2">
                  {createForm.is_admin_visible ? (
                    <Eye className="h-4 w-4" style={{ color: colors.brand.purpleLight }} />
                  ) : (
                    <EyeOff className="h-4 w-4 text-[#BBC3E1]" />
                  )}
                  <div>
                    <Label className="text-white">Show in Admin Settings</Label>
                    <p className="text-xs text-[#BBC3E1]">Make this agent available for selection in admin voice settings</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateForm({ ...createForm, is_admin_visible: !createForm.is_admin_visible })}
                  className={`border-[rgba(124,93,250,0.3)] ${
                    createForm.is_admin_visible 
                      ? 'bg-[rgba(124,93,250,0.2)] text-white' 
                      : 'text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]'
                  }`}
                >
                  {createForm.is_admin_visible ? 'Visible' : 'Hidden'}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAgent}
                className="bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)] border border-[rgba(124,93,250,0.3)]"
              >
                Create Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Agents Grid - Now using passport cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {agents.map((agent) => (
          <PassportCardWithActions
            key={agent.id}
            agent={agent}
            isSelected={false}
            isActive={false}
            onTestVoice={() => {
              if (isVoiceTesting && testingAgentId === agent.id) {
                stopVoiceTest();
              } else {
                startVoiceTest(agent.id, agent.name);
              }
            }}
            onEdit={() => openEditDialog(agent)}
            onDelete={() => handleDeleteAgent(agent.id, agent.name)}
            onToggleVisibility={() => toggleAgentVisibility(agent.id, !agent.is_admin_visible)}
            voiceTestState={{
              isVoiceTesting: isVoiceTesting && testingAgentId === agent.id,
              voiceCallStatus,
              disabled: isVoiceTesting && testingAgentId !== agent.id
            }}
            className="w-full"
          />
        ))}
        
        {agents.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Bot className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.secondary }} />
            <h4 className="text-white font-medium mb-2">No agents found</h4>
            <p style={{ color: colors.text.secondary }}>Create your first AI voice agent to get started</p>
          </div>
        )}
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" style={{
          backgroundColor: colors.background.primary,
          border: `1px solid rgba(124, 93, 250, 0.3)`
        }}>
          <DialogHeader>
            <DialogTitle className="text-white">Edit Agent: {editingAgent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">

            
            <div>
              <Label htmlFor="edit-name" className="text-white">Agent Name</Label>
              <Input
                id="edit-name"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description" className="text-white">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                rows={3}
              />
            </div>
            
            {/* Passport Fields Section */}
            <div className="space-y-4 p-4 bg-[rgba(30,30,30,0.3)] rounded-lg border border-[rgba(124,93,250,0.2)]">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Bot className="h-4 w-4" style={{ color: colors.brand.purpleLight }} />
                Passport Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_agent_type" className="text-white">Type</Label>
                  <Input
                    id="edit_agent_type"
                    value={editForm.agent_type || ''}
                    onChange={(e) => setEditForm({ ...editForm, agent_type: e.target.value })}
                    className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                    placeholder="AGENT"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_agent_role" className="text-white">Given Names/Role</Label>
                  <Input
                    id="edit_agent_role"
                    value={editForm.agent_role || ''}
                    onChange={(e) => setEditForm({ ...editForm, agent_role: e.target.value })}
                    className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                    placeholder="Voice Assistant"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_nationality" className="text-white">Nationality</Label>
                  <Input
                    id="edit_nationality"
                    value={editForm.nationality || ''}
                    onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                    className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                    placeholder="COTTAGE TANDOORI"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_passport_nationality" className="text-white">Passport/Nationality</Label>
                  <select
                    id="edit_passport_nationality"
                    value={editForm.passport_nationality || 'GBR'}
                    onChange={(e) => setEditForm({ ...editForm, passport_nationality: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-[rgba(30,30,30,0.5)] border border-[rgba(124,93,250,0.3)] text-white rounded-md"
                  >
                    <option value="GBR">🇬🇧 United Kingdom (GBR)</option>
                    <option value="USA">🇺🇸 United States (USA)</option>
                    <option value="IND">🇮🇳 India (IND)</option>
                    <option value="BGD">🇧🇩 Bangladesh (BGD)</option>
                    <option value="CHN">🇨🇳 China (CHN)</option>
                    <option value="ESP">🇪🇸 Spain (ESP)</option>
                    <option value="THA">🇹🇭 Thailand (THA)</option>
                    <option value="TUR">🇹🇷 Turkey (TUR)</option>
                    <option value="ARE">🇦🇪 UAE (ARE)</option>
                    <option value="DEU">🇩🇪 Germany (DEU)</option>
                    <option value="FRA">🇫🇷 France (FRA)</option>
                    <option value="ITA">🇮🇹 Italy (ITA)</option>
                    <option value="NLD">🇳🇱 Netherlands (NLD)</option>
                    <option value="AUS">🇦🇺 Australia (AUS)</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="edit_place_of_birth" className="text-white">Place of Birth</Label>
                  <Input
                    id="edit_place_of_birth"
                    value={editForm.place_of_birth || ''}
                    onChange={(e) => setEditForm({ ...editForm, place_of_birth: e.target.value })}
                    className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                    placeholder="DEVELOPMENT LAB"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_gender" className="text-white">Gender</Label>
                  <select
                    id="edit_gender"
                    value={editForm.gender || ''}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-[rgba(30,30,30,0.5)] border border-[rgba(124,93,250,0.3)] text-white rounded-md"
                  >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="edit_creation_date" className="text-white">Date of Birth</Label>
                  <Input
                    id="edit_creation_date"
                    type="date"
                    value={editForm.creation_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, creation_date: e.target.value })}
                    className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_activation_date" className="text-white">Date of Issue</Label>
                  <Input
                    id="edit_activation_date"
                    type="date"
                    value={editForm.activation_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, activation_date: e.target.value })}
                    className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_authority" className="text-white">Authority</Label>
                  <Input
                    id="edit_authority"
                    value={editForm.authority || ''}
                    onChange={(e) => setEditForm({ ...editForm, authority: e.target.value })}
                    className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                    placeholder="RESTAURANT ADMIN"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_date_of_expiry" className="text-white">Date of Expiry</Label>
                  <Input
                    id="edit_date_of_expiry"
                    value={editForm.date_of_expiry || ''}
                    onChange={(e) => setEditForm({ ...editForm, date_of_expiry: e.target.value })}
                    className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                    placeholder="UNLIMITED"
                  />
                </div>
              </div>
            </div>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="edit-voice_type" className="text-white">Voice Type</Label>
                <Select 
                  value={editForm.voice_type || ''} 
                  onValueChange={(value) => setEditForm({ ...editForm, voice_type: value })}
                >
                  <SelectTrigger className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto bg-[rgba(30,30,30,0.95)] border-[rgba(124,93,250,0.3)]">
                    {voiceDetails.length > 0 ? (
                      voiceDetails.map((voice) => (
                        <SelectItem 
                          key={voice.voice_id} 
                          value={voice.name}
                          className="text-white hover:bg-[rgba(124,93,250,0.2)] focus:bg-[rgba(124,93,250,0.2)]"
                        >
                          <div className="flex flex-col">
                            <span>{voice.name}</span>
                            {voice.language && (
                              <span className="text-xs text-gray-400">{voice.language}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      voiceTypes.map((voice) => (
                        <SelectItem 
                          key={voice} 
                          value={voice}
                          className="text-white hover:bg-[rgba(124,93,250,0.2)] focus:bg-[rgba(124,93,250,0.2)]"
                        >
                          {voice.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-personality" className="text-white">Personality</Label>
                <Select 
                  value={editForm.personality || ''} 
                  onValueChange={(value) => setEditForm({ ...editForm, personality: value })}
                >
                  <SelectTrigger className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white">
                    <SelectValue placeholder="Select personality" />
                  </SelectTrigger>
                  <SelectContent>
                    {personalityTypes.map((personality) => (
                      <SelectItem key={personality} value={personality}>
                        {personality.charAt(0).toUpperCase() + personality.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#BBC3E1] mt-1">Affects agent behavior in conversations and appears as a badge on agent cards</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-system_prompt" className="text-white">System Prompt</Label>
              <Textarea
                id="edit-system_prompt"
                value={editForm.system_prompt || ''}
                onChange={(e) => setEditForm({ ...editForm, system_prompt: e.target.value })}
                className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                rows={4}
                placeholder="Configure the AI agent's behavior and personality..."
              />
              <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                Define how the agent should behave and respond to customers
              </p>
            </div>
            
            {/* Agent Avatar Upload Section */}
            <div>
              <Label className="text-white mb-2 block">Agent Avatar</Label>
              <div className="flex items-center gap-4 p-4 bg-[rgba(30,30,30,0.3)] rounded-lg border border-[rgba(124,93,250,0.2)]">
                {/* Avatar Preview */}
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {(editAvatarUrl || editingAgent?.avatar_url) ? (
                    <OptimizedImage
                      fallbackUrl={editAvatarUrl || editingAgent?.avatar_url || ''}
                      variant="thumbnail"
                      alt={`${editingAgent?.name} avatar`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-bold text-purple-400">
                      {editingAgent?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <ImageUploadBrowser
                    selectedImageUrl={editAvatarUrl}
                    selectedImageFilename={editAvatarFilename}
                    onImageSelect={handleEditAvatarSelect}
                    triggerButton={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
                      >
                        <Image className="h-4 w-4 mr-2" />
                        {editAvatarUrl ? 'Change Avatar' : 'Select Avatar'}
                      </Button>
                    }
                  />
                  {editAvatarFilename && (
                    <p className="text-xs text-gray-400">Selected: {editAvatarFilename}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-[rgba(30,30,30,0.3)] rounded border border-[rgba(124,93,250,0.2)]">
              <div className="flex items-center gap-2">
                {editForm.is_admin_visible ? (
                  <Eye className="h-4 w-4" style={{ color: colors.brand.purpleLight }} />
                ) : (
                  <EyeOff className="h-4 w-4 text-[#BBC3E1]" />
                )}
                <span className="text-sm text-white">Admin Visibility</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#BBC3E1]">
                  {editForm.is_admin_visible ? 'Visible in Admin Settings' : 'Hidden from Admin Settings'}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditForm({ ...editForm, is_admin_visible: !editForm.is_admin_visible })}
                  className={`border-[rgba(124,93,250,0.3)] text-xs px-3 py-1 h-7 ${
                    editForm.is_admin_visible 
                      ? 'bg-[rgba(124,93,250,0.2)] text-white' 
                      : 'text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]'
                  }`}
                >
                  {editForm.is_admin_visible ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditAgent}
              className="bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)] border border-[rgba(124,93,250,0.3)]"
            >
              Update Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      

    </div>
  );
}
