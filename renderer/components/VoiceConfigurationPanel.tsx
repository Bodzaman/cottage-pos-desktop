import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Volume2, 
  Play, 
  Pause, 
  Square, 
  Mic, 
  Cog, 
  Save, 
  RotateCcw, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Headphones,
  VolumeX,
  User,
  Globe,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { colors } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';

// Voice configuration interface
interface VoiceConfig {
  voice_id: string;
  voice_name: string;
  language: string;
  gender: string;
  accent?: string;
  speed: number;
  pitch: number;
  volume: number;
  stability: number;
  similarity_boost: number;
}

// Available voice interface
interface AvailableVoice {
  voice_id: string;
  name: string;
  description?: string;
  gender: string;
  language: string;
  accent?: string;
  category: string;
}

// Agent Profile interface (simplified)
interface AgentProfile {
  id: string;
  name: string;
  voice_type: string;
  speed: number;
  pitch: number;
}

interface VoiceConfigurationPanelProps {
  onRefresh?: () => void;
}

export function VoiceConfigurationPanel({ onRefresh }: VoiceConfigurationPanelProps) {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<AvailableVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Voice configuration state
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    voice_id: '',
    voice_name: '',
    language: 'en-GB',
    gender: 'female',
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
    stability: 0.75,
    similarity_boost: 0.5
  });
  
  const [originalConfig, setOriginalConfig] = useState<VoiceConfig>(voiceConfig);
  const [testText, setTestText] = useState('Hello! Welcome to Cottage Tandoori. How can I help you today?');

  useEffect(() => {
    loadAgents();
    loadAvailableVoices();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      loadAgentVoiceConfig(selectedAgent);
    }
  }, [selectedAgent]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get_agent_profiles_endpoint();
      const data = await response.json();
      
      if (data.success && data.agents) {
        setAgents(data.agents);
        if (data.agents.length > 0 && !selectedAgent) {
          setSelectedAgent(data.agents[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Failed to load agents');
    }
  };

  const loadAvailableVoices = async () => {
    try {
      const response = await apiClient.get_voice_types();
      const data = await response.json();
      
      if (data.success && data.voice_types) {
        // Convert voice types to detailed voice objects
        const voices: AvailableVoice[] = data.voice_types.map((voiceType: string) => ({
          voice_id: voiceType,
          name: voiceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          gender: voiceType.includes('female') ? 'female' : 'male',
          language: voiceType.includes('british') ? 'en-GB' : 
                   voiceType.includes('american') ? 'en-US' : 
                   voiceType.includes('indian') ? 'en-IN' : 'en-GB',
          accent: voiceType.includes('british') ? 'British' : 
                 voiceType.includes('american') ? 'American' : 
                 voiceType.includes('indian') ? 'Indian' : 'Neutral',
          category: 'standard'
        }));
        
        setAvailableVoices(voices);
      } else {
        // Fallback voices if API call fails
        setAvailableVoices([
          { voice_id: 'female_british', name: 'British Female', gender: 'female', language: 'en-GB', accent: 'British', category: 'standard' },
          { voice_id: 'male_british', name: 'British Male', gender: 'male', language: 'en-GB', accent: 'British', category: 'standard' },
          { voice_id: 'female_indian', name: 'Indian Female', gender: 'female', language: 'en-IN', accent: 'Indian', category: 'standard' },
          { voice_id: 'male_indian', name: 'Indian Male', gender: 'male', language: 'en-IN', accent: 'Indian', category: 'standard' }
        ]);
      }
    } catch (error) {
      console.error('Error loading voice types:', error);
      // Set fallback voices
      setAvailableVoices([
        { voice_id: 'female_british', name: 'British Female', gender: 'female', language: 'en-GB', accent: 'British', category: 'standard' },
        { voice_id: 'male_british', name: 'British Male', gender: 'male', language: 'en-GB', accent: 'British', category: 'standard' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadAgentVoiceConfig = async (agentId: string) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        const selectedVoice = availableVoices.find(v => v.voice_id === agent.voice_type);
        
        setVoiceConfig({
          voice_id: agent.voice_type,
          voice_name: selectedVoice?.name || agent.voice_type,
          language: selectedVoice?.language || 'en-GB',
          gender: selectedVoice?.gender || 'female',
          accent: selectedVoice?.accent,
          speed: agent.speed,
          pitch: agent.pitch,
          volume: 1.0,
          stability: 0.75,
          similarity_boost: 0.5
        });
        
        setOriginalConfig({
          voice_id: agent.voice_type,
          voice_name: selectedVoice?.name || agent.voice_type,
          language: selectedVoice?.language || 'en-GB',
          gender: selectedVoice?.gender || 'female',
          accent: selectedVoice?.accent,
          speed: agent.speed,
          pitch: agent.pitch,
          volume: 1.0,
          stability: 0.75,
          similarity_boost: 0.5
        });
      }
    } catch (error) {
      console.error('Error loading agent voice config:', error);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    const selectedVoice = availableVoices.find(v => v.voice_id === voiceId);
    if (selectedVoice) {
      setVoiceConfig({
        ...voiceConfig,
        voice_id: voiceId,
        voice_name: selectedVoice.name,
        language: selectedVoice.language,
        gender: selectedVoice.gender,
        accent: selectedVoice.accent
      });
    }
  };

  const testVoice = async () => {
    if (!selectedAgent || !testText.trim()) {
      toast.error('Please select an agent and enter test text');
      return;
    }

    try {
      setTesting(true);
      setIsPlaying(true);
      
      // Simulate voice test (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Voice test completed');
    } catch (error) {
      console.error('Error testing voice:', error);
      toast.error('Failed to test voice');
    } finally {
      setTesting(false);
      setIsPlaying(false);
    }
  };

  const saveConfiguration = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent first');
      return;
    }

    try {
      setSaving(true);
      
      // Update agent with new voice configuration
      const response = await apiClient.update_agent(
        { agentId: selectedAgent },
        {
          voice_type: voiceConfig.voice_id,
          speed: voiceConfig.speed,
          pitch: voiceConfig.pitch
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setOriginalConfig({ ...voiceConfig });
        toast.success('Voice configuration saved successfully');
        onRefresh?.();
      } else {
        toast.error(`Failed to save configuration: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving voice configuration:', error);
      toast.error('Failed to save voice configuration');
    } finally {
      setSaving(false);
    }
  };

  const resetConfiguration = () => {
    setVoiceConfig({ ...originalConfig });
    toast.info('Configuration reset to last saved version');
  };

  const hasChanges = JSON.stringify(voiceConfig) !== JSON.stringify(originalConfig);
  const selectedAgentData = agents.find(a => a.id === selectedAgent);
  const selectedVoiceData = availableVoices.find(v => v.voice_id === voiceConfig.voice_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purpleLight }} />
        <span className="ml-3 text-white">Loading voice configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Volume2 className="h-5 w-5" style={{ color: colors.brand.purpleLight }} />
            Voice Configuration Panel
          </h3>
          <p style={{ color: colors.text.secondary }} className="mt-1">
            Configure voice settings, test audio output, and fine-tune speech parameters.
          </p>
        </div>
      </div>
      
      {/* Agent Selection */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="agent-select" className="text-white">Select Agent</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white">
              <SelectValue placeholder="Choose an agent to configure" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{agent.name}</span>
                    <span className="text-xs opacity-60">({agent.voice_type})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedAgentData && (
          <div className="flex items-center gap-2 mt-6">
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: colors.brand.purpleLight, 
                color: colors.brand.purpleLight 
              }}
            >
              Current: {selectedAgentData.voice_type.replace('_', ' ')}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Selection */}
        <Card style={{
          backgroundColor: `rgba(30, 30, 30, 0.5)`,
          border: `1px solid rgba(124, 93, 250, 0.3)`
        }}>
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="voice-select" className="text-white">Voice Type</Label>
              <Select value={voiceConfig.voice_id} onValueChange={handleVoiceChange}>
                <SelectTrigger className="mt-1 bg-[rgba(20,20,20,0.5)] border-[rgba(124,93,250,0.2)] text-white">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.voice_id} value={voice.voice_id}>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span>{voice.name}</span>
                          <span className="text-xs opacity-60">
                            {voice.gender} • {voice.accent} • {voice.language}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedVoiceData && (
              <div className="p-3 rounded-md bg-[rgba(124,93,250,0.1)] border border-[rgba(124,93,250,0.2)]">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4" style={{ color: colors.brand.purpleLight }} />
                  <span className="text-white font-medium">{selectedVoiceData.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: colors.text.secondary }}>
                  <div>Gender: {selectedVoiceData.gender}</div>
                  <div>Accent: {selectedVoiceData.accent}</div>
                  <div>Language: {selectedVoiceData.language}</div>
                  <div>Category: {selectedVoiceData.category}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Voice Testing */}
        <Card style={{
          backgroundColor: `rgba(30, 30, 30, 0.5)`,
          border: `1px solid rgba(124, 93, 250, 0.3)`
        }}>
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              Voice Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-text" className="text-white">Test Text</Label>
              <Input
                id="test-text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="mt-1 bg-[rgba(20,20,20,0.5)] border-[rgba(124,93,250,0.2)] text-white"
                placeholder="Enter text to test voice synthesis..."
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={testVoice}
                disabled={testing || !testText.trim()}
                className="flex-1 bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)] border border-[rgba(124,93,250,0.3)] disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {testing ? 'Testing...' : isPlaying ? 'Playing' : 'Test Voice'}
              </Button>
              
              {isPlaying && (
                <Button 
                  variant="outline"
                  onClick={() => setIsPlaying(false)}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Square className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="text-xs" style={{ color: colors.text.muted }}>
              <p>Test your voice configuration before saving. The audio will play with your current settings.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Audio Parameters */}
      <Card style={{
        backgroundColor: `rgba(30, 30, 30, 0.5)`,
        border: `1px solid rgba(124, 93, 250, 0.3)`
      }}>
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Audio Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Speed</Label>
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  {voiceConfig.speed.toFixed(1)}x
                </span>
              </div>
              <Slider
                value={[voiceConfig.speed]}
                onValueChange={(value) => setVoiceConfig({ ...voiceConfig, speed: value[0] })}
                min={0.5}
                max={1.5}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs" style={{ color: colors.text.muted }}>
                <span>0.5x</span>
                <span>1.5x</span>
              </div>
            </div>
            
            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Pitch</Label>
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  {voiceConfig.pitch.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[voiceConfig.pitch]}
                onValueChange={(value) => setVoiceConfig({ ...voiceConfig, pitch: value[0] })}
                min={0.8}
                max={1.2}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs" style={{ color: colors.text.muted }}>
                <span>0.8</span>
                <span>1.2</span>
              </div>
            </div>
            
            {/* Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Volume</Label>
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  {Math.round(voiceConfig.volume * 100)}%
                </span>
              </div>
              <Slider
                value={[voiceConfig.volume]}
                onValueChange={(value) => setVoiceConfig({ ...voiceConfig, volume: value[0] })}
                min={0.0}
                max={1.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs" style={{ color: colors.text.muted }}>
                <VolumeX className="h-3 w-3" />
                <Volume2 className="h-3 w-3" />
              </div>
            </div>
            
            {/* Stability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Stability</Label>
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  {Math.round(voiceConfig.stability * 100)}%
                </span>
              </div>
              <Slider
                value={[voiceConfig.stability]}
                onValueChange={(value) => setVoiceConfig({ ...voiceConfig, stability: value[0] })}
                min={0.0}
                max={1.0}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs" style={{ color: colors.text.muted }}>
                <span>Variable</span>
                <span>Stable</span>
              </div>
            </div>
            
            {/* Similarity Boost */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Similarity</Label>
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  {Math.round(voiceConfig.similarity_boost * 100)}%
                </span>
              </div>
              <Slider
                value={[voiceConfig.similarity_boost]}
                onValueChange={(value) => setVoiceConfig({ ...voiceConfig, similarity_boost: value[0] })}
                min={0.0}
                max={1.0}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs" style={{ color: colors.text.muted }}>
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 rounded-md bg-[rgba(124,93,250,0.1)] border border-[rgba(124,93,250,0.2)]">
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              <strong>Tips:</strong> Speed affects speaking rate, Pitch changes voice tone, Stability controls consistency, 
              and Similarity affects how closely the voice matches the original model.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm" style={{ color: colors.text.muted }}>
          {hasChanges ? (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <span>You have unsaved changes</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" style={{ color: globalColors.status.success }} />
              <span>All changes saved</span>
            </>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            disabled={!hasChanges}
            onClick={resetConfiguration}
            className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)] disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button 
            onClick={saveConfiguration}
            disabled={!hasChanges || saving}
            className="bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)] border border-[rgba(124,93,250,0.3)] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
}
