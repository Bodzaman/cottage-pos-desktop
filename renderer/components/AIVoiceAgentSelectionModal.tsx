import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { apiClient } from 'app';
import { AgentProfileOutput } from 'types';
import { useVoiceAgentStore } from 'utils/voiceAgentStore';
import { MultiNationalityPassportCard } from './MultiNationalityPassportCard';
import { HorizontalAgentCarousel } from './HorizontalAgentCarousel';
import { colors } from 'utils/designSystem';

interface AIVoiceAgentSelectionModalProps {
  open: boolean;
  onClose: () => void;
}

export function AIVoiceAgentSelectionModal({ open, onClose }: AIVoiceAgentSelectionModalProps) {
  // Global voice agent store
  const {
    selectedAgent: globalSelectedAgent,
    setSelectedAgent: setGlobalSelectedAgent
  } = useVoiceAgentStore();
  
  // Minimal modal state
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(globalSelectedAgent?.id || null);
  const [agents, setAgents] = useState<AgentProfileOutput[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load agents from database
  useEffect(() => {
    const fetchAgents = async () => {
      if (!open) return;
      setAgentsLoading(true);
      try {
        const response = await apiClient.get_agent_profiles_endpoint();
        const data: AgentProfileOutput[] = await response.json();
        setAgents(data.filter((agent) => agent.is_active));
      } catch (error) {
        console.error('[Agent Selection Modal] Failed to load agents:', error);
        toast.error('Failed to load available agents');
      } finally {
        setAgentsLoading(false);
      }
    };

    fetchAgents();
  }, [open]);

  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    toast.success('Agent selected');
  };

  // Handle save and close
  const handleSaveAndClose = async () => {
    if (!selectedAgentId) {
      toast.error('Please select an AI agent');
      return;
    }

    try {
      setIsSaving(true);
      
      // Find the full agent object and save to global store
      const selectedAgentObject = agents.find(agent => agent.id === selectedAgentId);
      if (selectedAgentObject) {
        setGlobalSelectedAgent(selectedAgentObject);
        toast.success(`${selectedAgentObject.name} selected for voice ordering`);
        onClose();
      } else {
        toast.error('Selected agent not found');
      }
    } catch (error) {
      console.error('Error saving agent selection:', error);
      toast.error('Failed to save agent selection');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedAgentId(globalSelectedAgent?.id || null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" style={{
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        borderColor: 'rgba(124, 93, 250, 0.3)',
        backdropFilter: 'blur(20px)'
      }}>
        <DialogHeader className="border-b border-gray-800 pb-4">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            🎙️ Select AI Voice Agent
          </DialogTitle>
          <p className="text-gray-400 mt-2">
            Choose an AI assistant to handle voice orders on the online menu
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-6">
          {/* Loading state */}
          {agentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purpleLight }} />
              <span className="ml-2 text-gray-400">Loading AI agents...</span>
            </div>
          ) : agents.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2 text-white">No AI Agents Found</h3>
              <p className="text-gray-400">Please create AI agents in the Admin Dashboard first.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Agent Selection */}
              <Card style={{
                backgroundColor: 'rgba(30, 30, 30, 0.5)',
                borderColor: 'rgba(124, 93, 250, 0.3)'
              }}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Available AI Agents</h3>
                  
                  {agents.length === 1 ? (
                    // Single Agent: Large Passport Card
                    <div className="flex justify-center">
                      <div className="transition-all duration-500 ease-out cursor-pointer"
                        style={{
                          transform: `scale(${selectedAgentId === agents[0].id ? 1.02 : 0.98})`,
                          opacity: selectedAgentId === agents[0].id ? 1 : 0.8
                        }}
                        onClick={() => handleAgentSelect(agents[0].id)}
                      >
                        <MultiNationalityPassportCard
                          agent={agents[0]}
                          isSelected={selectedAgentId === agents[0].id}
                          size="large"
                          className="transition-all duration-500 ease-out"
                        />
                      </div>
                    </div>
                  ) : (
                    // Multiple Agents: Horizontal Carousel
                    <HorizontalAgentCarousel
                      agents={agents}
                      selectedAgentId={selectedAgentId}
                      onSelectAgent={handleAgentSelect}
                      aiVoiceAgentEnabled={true}
                      isVoiceTesting={false}
                      testingAgentId={null}
                      voiceCallStatus={'idle' as any}
                      onTestVoice={() => {}} // No testing in this simple modal
                    />
                  )}
                </CardContent>
              </Card>

              {/* Selected Agent Info */}
              {selectedAgentId && (
                <Card style={{
                  backgroundColor: 'rgba(30, 30, 30, 0.5)',
                  borderColor: 'rgba(124, 93, 250, 0.3)'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-400" />
                        <div>
                          <h4 className="font-semibold text-white">
                            {agents.find(a => a.id === selectedAgentId)?.name}
                          </h4>
                          <p className="text-sm text-gray-400">
                            Selected for voice ordering
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Voice Type</p>
                        <p className="text-sm text-purple-400">
                          {agents.find(a => a.id === selectedAgentId)?.voice_type?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-800">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="border-gray-600 hover:border-gray-500 text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              onClick={handleSaveAndClose}
              disabled={!selectedAgentId || isSaving}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Select Agent
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AIVoiceAgentSelectionModal;
