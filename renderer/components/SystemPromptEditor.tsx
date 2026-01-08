import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Save, 
  Eye, 
  Copy, 
  RotateCcw, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { colors } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';

// Template interface
interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: 'restaurant' | 'general' | 'custom';
  variables: string[];
}

// Agent Profile interface (simplified for this component)
interface AgentProfile {
  id: string;
  name: string;
  voice_type: string;
  personality: string;
}

interface SystemPromptEditorProps {
  onRefresh?: () => void;
}

export function SystemPromptEditor({ onRefresh }: SystemPromptEditorProps) {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [originalPrompt, setOriginalPrompt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);

  // Default restaurant-specific templates
  const defaultTemplates: PromptTemplate[] = [
    {
      id: 'restaurant-basic',
      name: 'Basic Restaurant Assistant',
      description: 'Standard greeting and order-taking assistant for restaurants',
      category: 'restaurant',
      content: `You are a friendly and professional AI assistant for {{restaurantName}}, a {{cuisineType}} restaurant. Your role is to:

1. **Greet customers warmly** and introduce yourself
2. **Take food orders** accurately and suggest popular items
3. **Answer questions** about menu items, ingredients, and allergens
4. **Handle reservations** and booking requests
5. **Provide restaurant information** like opening hours, location, and contact details

Key Guidelines:
- Always be polite, patient, and helpful
- Speak clearly and at a moderate pace
- Ask for clarification when orders are unclear
- Suggest popular items when customers are undecided
- Handle dietary restrictions and allergies seriously
- Thank customers and confirm their orders before ending calls

Restaurant Details:
- Name: {{restaurantName}}
- Cuisine: {{cuisineType}}
- Phone: {{phoneNumber}}
- Address: {{address}}
- Opening Hours: {{openingHours}}`,
      variables: ['restaurantName', 'cuisineType', 'phoneNumber', 'address', 'openingHours']
    },
    {
      id: 'restaurant-advanced',
      name: 'Advanced Restaurant Assistant',
      description: 'Comprehensive assistant with upselling and customer service features',
      category: 'restaurant',
      content: `You are {{agentName}}, an expert AI assistant for {{restaurantName}}. You have extensive knowledge about our {{cuisineType}} cuisine and excel at customer service.

**Primary Responsibilities:**
1. **Welcome & Engagement**: Greet customers warmly and create a positive first impression
2. **Order Management**: Take detailed orders, suggest improvements, and handle modifications
3. **Upselling & Recommendations**: Suggest complementary items, popular dishes, and special offers
4. **Customer Support**: Answer detailed questions about ingredients, preparation methods, and allergens
5. **Reservation Handling**: Process table bookings and manage seating preferences
6. **Problem Resolution**: Handle complaints professionally and offer appropriate solutions

**Communication Style:**
- {{personalityTrait}} and engaging tone
- Use natural conversation flow
- Ask clarifying questions when needed
- Confirm important details
- Express enthusiasm about menu items

**Restaurant Information:**
- Restaurant: {{restaurantName}}
- Cuisine Type: {{cuisineType}}
- Specialty: {{specialtyDish}}
- Phone: {{phoneNumber}}
- Location: {{address}}
- Hours: {{openingHours}}
- Special Offers: {{currentPromotions}}

**Important Notes:**
- Always prioritize food safety and allergen awareness
- Be transparent about ingredients and preparation methods
- Offer alternatives for dietary restrictions
- Maintain professionalism even in difficult situations`,
      variables: ['agentName', 'restaurantName', 'cuisineType', 'personalityTrait', 'specialtyDish', 'phoneNumber', 'address', 'openingHours', 'currentPromotions']
    },
    {
      id: 'takeaway-focused',
      name: 'Takeaway & Delivery Specialist',
      description: 'Optimized for takeaway orders and delivery coordination',
      category: 'restaurant',
      content: `You are a specialized AI assistant for {{restaurantName}}, focused on takeaway and delivery orders.

**Core Functions:**
1. **Order Processing**: Take accurate takeaway/delivery orders
2. **Time Management**: Provide realistic preparation and delivery times
3. **Address Verification**: Confirm delivery addresses and contact information
4. **Payment Coordination**: Guide customers through payment options
5. **Order Tracking**: Provide updates on order status when requested

**Key Processes:**
- Confirm whether order is for collection or delivery
- Verify customer contact details and delivery address
- Suggest optimal menu combinations for takeaway
- Inform about packaging and any extra charges
- Provide accurate timing for order completion
- Offer order tracking information

**Delivery Information:**
- Delivery Area: {{deliveryZones}}
- Minimum Order: {{minimumOrder}}
- Delivery Fee: {{deliveryFee}}
- Estimated Time: {{estimatedDeliveryTime}}
- Payment Methods: {{paymentMethods}}

**Restaurant Details:**
- Name: {{restaurantName}}
- Phone: {{phoneNumber}}
- Collection Address: {{collectionAddress}}
- Opening Hours: {{openingHours}}`,
      variables: ['restaurantName', 'deliveryZones', 'minimumOrder', 'deliveryFee', 'estimatedDeliveryTime', 'paymentMethods', 'phoneNumber', 'collectionAddress', 'openingHours']
    }
  ];

  useEffect(() => {
    loadAgents();
    setTemplates(defaultTemplates);
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      loadAgentPrompt(selectedAgent);
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
    } finally {
      setLoading(false);
    }
  };

  const loadAgentPrompt = async (agentId: string) => {
    try {
      // For now, we'll use a default prompt since the API might not have this endpoint yet
      const defaultPrompt = `You are a helpful AI assistant for Cottage Tandoori restaurant. You can help customers with:

1. Taking food orders
2. Answering questions about menu items
3. Making table reservations
4. Providing restaurant information

Always be polite, helpful, and professional in your responses.`;
      
      setCurrentPrompt(defaultPrompt);
      setOriginalPrompt(defaultPrompt);
    } catch (error) {
      console.error('Error loading agent prompt:', error);
      toast.error('Failed to load agent prompt');
    }
  };

  const savePrompt = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent first');
      return;
    }

    try {
      setSaving(true);
      // TODO: Implement API call to save system prompt
      // For now, we'll simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOriginalPrompt(currentPrompt);
      toast.success('System prompt saved successfully');
      onRefresh?.();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save system prompt');
    } finally {
      setSaving(false);
    }
  };

  const resetPrompt = () => {
    setCurrentPrompt(originalPrompt);
    toast.info('Prompt reset to last saved version');
  };

  const applyTemplate = (template: PromptTemplate) => {
    setCurrentPrompt(template.content);
    setShowTemplateDialog(false);
    toast.success(`Applied template: ${template.name}`);
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(currentPrompt);
    toast.success('Prompt copied to clipboard');
  };

  const renderPreview = () => {
    // Simple preview rendering with variable highlighting
    const previewContent = currentPrompt.replace(
      /\{\{([^}]+)\}\}/g, 
      '<span style="background-color: rgba(124, 93, 250, 0.2); color: #7C5DFA; padding: 2px 4px; border-radius: 3px; font-weight: 500;">{{$1}}</span>'
    );
    
    return (
      <div 
        className="prose prose-sm max-w-none text-white"
        dangerouslySetInnerHTML={{ __html: previewContent.replace(/\n/g, '<br />') }}
        style={{ color: colors.text.primary }}
      />
    );
  };

  const hasChanges = currentPrompt !== originalPrompt;
  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purpleLight }} />
        <span className="ml-3 text-white">Loading system prompts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5" style={{ color: colors.brand.purpleLight }} />
            System Prompt Editor
          </h3>
          <p style={{ color: colors.text.secondary }} className="mt-1">
            Customize AI agent system prompts with dynamic variables and templates.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
              >
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]" style={{
              backgroundColor: colors.background.primary,
              border: `1px solid rgba(124, 93, 250, 0.3)`
            }}>
              <DialogHeader>
                <DialogTitle className="text-white">Prompt Templates</DialogTitle>
                <DialogDescription className="text-[#BBC3E1]/80">
                  Choose from pre-built templates to quickly customize your agent's system prompt.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {templates.map((template) => (
                  <Card key={template.id} style={{
                    backgroundColor: `rgba(30, 30, 30, 0.5)`,
                    border: `1px solid rgba(124, 93, 250, 0.3)`
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium">{template.name}</h4>
                          <p className="text-sm" style={{ color: colors.text.secondary }}>
                            {template.description}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="text-xs" 
                          style={{ 
                            borderColor: colors.brand.purpleLight, 
                            color: colors.brand.purpleLight 
                          }}
                        >
                          {template.category}
                        </Badge>
                      </div>
                      
                      {template.variables.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs mb-2" style={{ color: colors.text.muted }}>
                            Variables: {template.variables.join(', ')}
                          </p>
                        </div>
                      )}
                      
                      <Button 
                        size="sm"
                        onClick={() => applyTemplate(template)}
                        className="bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)] border border-[rgba(124,93,250,0.3)]"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className={`border-[rgba(124,93,250,0.3)] ${previewMode ? 'bg-[rgba(124,93,250,0.2)] text-white' : 'text-[#BBC3E1]'} hover:bg-[rgba(124,93,250,0.1)]`}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>
      
      {/* Agent Selection */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="agent-select" className="text-white">Select Agent</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="mt-1 bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white">
              <SelectValue placeholder="Choose an agent to edit" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
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
              {selectedAgentData.voice_type.replace('_', ' ')}
            </Badge>
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: colors.text.secondary, 
                color: colors.text.secondary 
              }}
            >
              {selectedAgentData.personality}
            </Badge>
          </div>
        )}
      </div>
      
      {/* Editor/Preview */}
      <Card style={{
        backgroundColor: `rgba(30, 30, 30, 0.5)`,
        border: `1px solid rgba(124, 93, 250, 0.3)`
      }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">
              {previewMode ? 'Prompt Preview' : 'System Prompt Editor'}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                  Unsaved Changes
                </Badge>
              )}
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={copyPrompt}
                className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
              >
                <Copy className="h-3 w-3" />
              </Button>
              
              {hasChanges && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={resetPrompt}
                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {previewMode ? (
            <div className="min-h-[400px] p-4 rounded-md bg-[rgba(20,20,20,0.5)] border border-[rgba(124,93,250,0.2)]">
              {renderPreview()}
            </div>
          ) : (
            <Textarea
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              className="min-h-[400px] bg-[rgba(20,20,20,0.5)] border-[rgba(124,93,250,0.2)] text-white font-mono text-sm leading-relaxed"
              placeholder="Enter your system prompt here. Use {{variableName}} for dynamic variables..."
            />
          )}
          
          {!previewMode && (
            <div className="mt-4 p-3 rounded-md bg-[rgba(124,93,250,0.1)] border border-[rgba(124,93,250,0.2)]">
              <p className="text-xs" style={{ color: colors.text.secondary }}>
                <strong>Tip:</strong> Use variables like {'{'}{'{'} restaurantName{'}'}{'}'}, {'{'}{'{'} customerName{'}'}{'}'}, {'{'}{'{'} phoneNumber{'}'}{'}'}  to make your prompts dynamic.
                Variables will be automatically replaced with actual values during conversations.
              </p>
            </div>
          )}
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
            onClick={resetPrompt}
            className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)] disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button 
            onClick={savePrompt}
            disabled={!hasChanges || saving}
            className="bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)] border border-[rgba(124,93,250,0.3)] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Prompt'}
          </Button>
        </div>
      </div>
    </div>
  );
}
