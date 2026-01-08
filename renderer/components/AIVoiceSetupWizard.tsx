import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Bot, 
  Clock, 
  Phone, 
  Settings, 
  PhoneCall,
  Copy,
  Brain,
  BarChart3,
  Shield,
  Sparkles,
  User,
  Volume2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { AgentProfileOutput } from 'types';
import { TimePickerInput } from './TimePickerInput';
import { colors } from 'utils/designSystem';
import { globalColors } from 'utils/QSAIDesign';

// Props interface for the wizard
interface AIVoiceSetupWizardProps {
  open: boolean;
  onClose: () => void;
  agents: AgentProfileOutput[];
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
  aiVoiceAgentEnabled: boolean;
  onToggleAI: (enabled: boolean) => void;
  timeWindows: any;
  onTimeWindowsChange: (timeWindows: any) => void;
  phoneNumber: string;
  phoneActive: boolean;
  onPhoneToggle: (active: boolean) => void;
  onTestCall: (agentId: string) => void;
  isVoiceTesting: boolean;
  testingAgentId: string | null;
}

// Props for the trigger button
interface AIVoiceSetupWizardTriggerProps {
  onOpen: () => void;
  hasBasicSetup: boolean;
}

// Wizard steps
const WIZARD_STEPS = [
  { id: 1, title: 'Choose Your Voice Agent', icon: Bot },
  { id: 2, title: 'Set Your Business Hours', icon: Clock },
  { id: 3, title: 'Configure Voice Settings', icon: Settings },
  { id: 4, title: 'Add Your Phone Number', icon: Phone },
  { id: 5, title: 'Test Your Setup', icon: PhoneCall }
];

export function AIVoiceSetupWizard({
  open,
  onClose,
  agents,
  selectedAgentId,
  onAgentSelect,
  aiVoiceAgentEnabled,
  onToggleAI,
  timeWindows,
  onTimeWindowsChange,
  phoneNumber,
  phoneActive,
  onPhoneToggle,
  onTestCall,
  isVoiceTesting,
  testingAgentId
}: AIVoiceSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);

  if (!open) return null;

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1: return selectedAgentId !== null;
      case 2: return true; // Time windows are optional
      case 3: return true; // Voice settings are configured
      case 4: return phoneNumber.length > 0;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Simulate API call to save all settings
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('AI Voice Agent setup completed successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to complete setup');
    } finally {
      setIsCompleting(false);
    }
  };

  const copyPhoneNumber = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      toast.success('Phone number copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy phone number');
    }
  };

  const timePresets = [
    { name: "Standard Hours", hours: { start: "09:00", end: "22:00" } },
    { name: "Mon-Fri 12-22", hours: { start: "12:00", end: "22:00" } },
    { name: "Lunch+Dinner", hours: { start: "11:30", end: "14:30" } },
    { name: "Extended Hours", hours: { start: "08:00", end: "23:00" } }
  ];

  const applyTimePreset = (preset: typeof timePresets[0]) => {
    const newTimeWindows = { ...timeWindows };
    Object.keys(newTimeWindows).forEach(day => {
      newTimeWindows[day as keyof typeof newTimeWindows] = {
        ...newTimeWindows[day as keyof typeof newTimeWindows],
        start: preset.hours.start,
        end: preset.hours.end
      };
    });
    onTimeWindowsChange(newTimeWindows);
    toast.success(`Applied ${preset.name} to all days`);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Choose Your Voice Agent</h3>
              <p className="text-gray-400">Select an AI voice assistant to handle phone orders and reservations</p>
            </div>
            
            <div className="grid gap-4">
              {agents.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                return (
                  <Card
                    key={agent.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      isSelected ? 'ring-2 ring-purple-500' : 'hover:border-purple-500/50'
                    }`}
                    style={{
                      backgroundColor: isSelected 
                        ? 'rgba(124, 93, 250, 0.2)' 
                        : 'rgba(30, 30, 30, 0.8)',
                      borderColor: isSelected 
                        ? 'rgba(124, 93, 250, 0.8)' 
                        : 'rgba(124, 93, 250, 0.3)'
                    }}
                    onClick={() => onAgentSelect(agent.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{
                          backgroundColor: 'rgba(124, 93, 250, 0.2)',
                          border: '1px solid rgba(124, 93, 250, 0.3)'
                        }}>
                          {agent.avatar_url ? (
                            <img
                              src={agent.avatar_url}
                              alt={`${agent.name} avatar`}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <span className={`font-bold ${agent.avatar_url ? 'hidden' : ''}`} style={{
                            color: colors.brand.purpleLight
                          }}>
                            {agent.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-bold text-white">{agent.name}</h4>
                          <p className="text-sm text-gray-400">{agent.description || 'Voice agent for customer interactions'}</p>
                          {agent.voiceType && (
                            <Badge variant="secondary" className="text-xs mt-1" style={{
                              backgroundColor: 'rgba(124, 93, 250, 0.2)',
                              color: colors.brand.purpleLight
                            }}>
                              {agent.voiceType}
                            </Badge>
                          )}
                        </div>
                        
                        {isSelected && (
                          <Check className="h-5 w-5 text-purple-400" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Set Your Business Hours</h3>
              <p className="text-gray-400">Configure when your AI voice agent should accept calls</p>
            </div>
            
            {/* Quick Presets */}
            <div className="mb-6">
              <Label className="text-white font-medium mb-3 block">Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {timePresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTimePreset(preset)}
                    className="text-white border-gray-600 hover:border-purple-500"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Time Windows Table */}
            <div className="space-y-3">
              <Label className="text-white font-medium">Business Hours</Label>
              <div className="space-y-2">
                {Object.entries(timeWindows).map(([day, window]) => (
                  <div key={day} className="flex items-center space-x-4 p-3 rounded-lg" style={{
                    backgroundColor: 'rgba(30, 30, 30, 0.5)'
                  }}>
                    <div className="w-20">
                      <span className="text-white font-medium capitalize">{day}</span>
                    </div>
                    
                    <Switch
                      checked={window.enabled}
                      onCheckedChange={(enabled) => {
                        onTimeWindowsChange({
                          ...timeWindows,
                          [day]: { ...window, enabled }
                        });
                      }}
                      className="data-[state=checked]:bg-purple-500"
                    />
                    
                    {window.enabled && (
                      <div className="flex items-center space-x-2 flex-1">
                        <TimePickerInput
                          value={window.start}
                          onChange={(start) => {
                            onTimeWindowsChange({
                              ...timeWindows,
                              [day]: { ...window, start }
                            });
                          }}
                        />
                        <span className="text-gray-400">to</span>
                        <TimePickerInput
                          value={window.end}
                          onChange={(end) => {
                            onTimeWindowsChange({
                              ...timeWindows,
                              [day]: { ...window, end }
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Configure Voice Settings</h3>
              <p className="text-gray-400">Set up AI behavior and knowledge base connections</p>
            </div>
            
            {/* AI Toggle */}
            <Card style={{
              backgroundColor: 'rgba(30, 30, 30, 0.8)',
              borderColor: 'rgba(124, 93, 250, 0.3)'
            }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white mb-1">AI Voice Agent</h4>
                    <p className="text-sm text-gray-400">Enable or disable AI voice processing</p>
                  </div>
                  <Switch
                    checked={aiVoiceAgentEnabled}
                    onCheckedChange={onToggleAI}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Knowledge Base Status */}
            <Card style={{
              backgroundColor: 'rgba(30, 30, 30, 0.8)',
              borderColor: 'rgba(124, 93, 250, 0.3)'
            }}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5" style={{ color: colors.brand.purpleLight }} />
                  Knowledge Base Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white">Menu Corpus</span>
                  <Badge variant="secondary" className="bg-green-900/30 text-green-400 border-green-600/30">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">FAQ Corpus</span>
                  <Badge variant="secondary" className="bg-green-900/30 text-green-400 border-green-600/30">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Policy Corpus</span>
                  <Badge variant="secondary" className="bg-yellow-900/30 text-yellow-400 border-yellow-600/30">
                    Pending
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Add Your Phone Number</h3>
              <p className="text-gray-400">Configure your restaurant's phone system</p>
            </div>
            
            {/* Current Phone Number */}
            <Card style={{
              backgroundColor: 'rgba(30, 30, 30, 0.8)',
              borderColor: 'rgba(124, 93, 250, 0.3)'
            }}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Phone className="h-5 w-5" style={{ color: colors.brand.purpleLight }} />
                  Restaurant Phone Number
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{
                  backgroundColor: 'rgba(124, 93, 250, 0.1)',
                  border: '1px solid rgba(124, 93, 250, 0.3)'
                }}>
                  <span className="text-white font-mono text-lg">{phoneNumber}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPhoneNumber}
                    className="text-white border-gray-600 hover:border-purple-500"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Phone Status</h4>
                    <p className="text-sm text-gray-400">Control incoming call handling</p>
                  </div>
                  <Switch
                    checked={phoneActive}
                    onCheckedChange={onPhoneToggle}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>
                
                <Separator className="bg-gray-700" />
                
                <div className="text-center p-4 rounded-lg" style={{
                  backgroundColor: 'rgba(30, 30, 30, 0.5)'
                }}>
                  <h4 className="text-white font-medium mb-2">Coming Soon</h4>
                  <p className="text-sm text-gray-400">Custom phone number setup with Twilio integration</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Test Your Setup</h3>
              <p className="text-gray-400">Make sure everything is working correctly</p>
            </div>
            
            {/* Setup Summary */}
            <Card style={{
              backgroundColor: 'rgba(30, 30, 30, 0.8)',
              borderColor: 'rgba(124, 93, 250, 0.3)'
            }}>
              <CardHeader>
                <CardTitle className="text-white">Setup Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white">Selected Agent</span>
                  <span className="text-purple-400">
                    {agents.find(a => a.id === selectedAgentId)?.name || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">AI Voice Agent</span>
                  <Badge variant={aiVoiceAgentEnabled ? 'default' : 'secondary'} className={
                    aiVoiceAgentEnabled 
                      ? 'bg-green-900/30 text-green-400 border-green-600/30'
                      : 'bg-gray-900/30 text-gray-400 border-gray-600/30'
                  }>
                    {aiVoiceAgentEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Phone Number</span>
                  <span className="text-purple-400 font-mono">{phoneNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Business Hours</span>
                  <span className="text-purple-400">
                    {Object.values(timeWindows).filter(w => w.enabled).length} days configured
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Test Call */}
            {selectedAgentId && (
              <Card style={{
                backgroundColor: 'rgba(30, 30, 30, 0.8)',
                borderColor: 'rgba(124, 93, 250, 0.3)'
              }}>
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <Volume2 className="h-12 w-12 mx-auto mb-3" style={{ color: colors.brand.purpleLight }} />
                    <h4 className="text-white font-semibold mb-2">Test Voice Agent</h4>
                    <p className="text-gray-400 text-sm">Start a test conversation to verify your setup</p>
                  </div>
                  
                  <Button
                    onClick={() => onTestCall(selectedAgentId)}
                    disabled={isVoiceTesting}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    size="lg"
                  >
                    {isVoiceTesting && testingAgentId === selectedAgentId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <PhoneCall className="mr-2 h-4 w-4" />
                        Start Test Call
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)'
    }}>
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        borderColor: 'rgba(124, 93, 250, 0.3)',
        backdropFilter: 'blur(20px)'
      }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl mb-2">AI Voice Agent Setup</CardTitle>
              <p className="text-gray-400">Step {currentStep} of {WIZARD_STEPS.length}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {WIZARD_STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-purple-600 text-white' :
                    isCompleted ? 'bg-green-600 text-white' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-6">
          {renderStepContent()}
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="text-white border-gray-600 hover:border-purple-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <div className="text-sm text-gray-400">
              Step {currentStep} of {WIZARD_STEPS.length}
            </div>
            
            {currentStep < WIZARD_STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedFromStep(currentStep)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isCompleting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Trigger button component
export function AIVoiceSetupWizardTrigger({ onOpen, hasBasicSetup }: AIVoiceSetupWizardTriggerProps) {
  return (
    <Button
      onClick={onOpen}
      className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
      size="lg"
    >
      <Sparkles className="mr-2 h-4 w-4" />
      {hasBasicSetup ? 'Quick Setup' : 'Setup Wizard'}
    </Button>
  );
}
