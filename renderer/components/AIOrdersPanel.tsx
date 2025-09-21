

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Settings, Mic, MicOff, Upload, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { globalColors } from '../utils/QSAIDesign';
import { POSViewProps } from './POSViewContainer';
import { useAIVoiceStore, useAIVoiceMasterToggle, useAIVoiceLiveCalls, useAIVoiceAgents } from '../utils/aiVoiceStore';

interface AIOrdersPanelProps extends POSViewProps {
  autoApproveEnabled?: boolean;
  onAutoApproveToggle?: (enabled: boolean) => void;
}

/**
 * AI Voice Orders Management Panel
 * 
 * Now uses AIVoiceStore for real-time synchronization across all pages.
 * Provides unified state management with OnlineMenu and AIVoiceAgentSettings.
 */
export function AIOrdersPanel({ onBack }: AIOrdersPanelProps) {
  // Use AIVoiceStore for real-time synchronization
  const { enabled: aiVoiceEnabled, isLoading: storeLoading, toggle: toggleMasterSwitch, agentName, avatarUrl } = useAIVoiceMasterToggle();
  const { liveCalls, totalActiveCalls, refresh: refreshLiveCalls } = useAIVoiceLiveCalls();
  const { agents, selectedAgent, selectAgent } = useAIVoiceAgents();
  const { settings, updateSettings, hasUnsavedChanges, isSaving } = useAIVoiceStore();

  // Local UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [customName, setCustomName] = useState(settings?.custom_name || '');
  const [selectedAgentId, setSelectedAgentId] = useState(settings?.selected_agent_id || '');

  // Update local state when store updates
  React.useEffect(() => {
    if (settings) {
      setCustomName(settings.custom_name || '');
      setSelectedAgentId(settings.selected_agent_id || '');
    }
  }, [settings]);

  // Handle master toggle
  const handleMasterToggle = async (enabled: boolean) => {
    const success = await toggleMasterSwitch(enabled);
    if (success) {
      toast.success(`AI Voice Assistant ${enabled ? 'enabled' : 'disabled'}`);
    }
  };

  // Handle settings save
  const handleSaveSettings = async () => {
    if (!hasUnsavedChanges && customName === settings?.custom_name && selectedAgentId === settings?.selected_agent_id) {
      toast.info('No changes to save');
      return;
    }

    const success = await updateSettings({
      custom_name: customName,
      selected_agent_id: selectedAgentId
    });

    if (success) {
      selectAgent(selectedAgentId); // Update selected agent in store
    }
  };

  // Convert mock voice orders for display (using live calls as proxy)
  const voiceOrders = liveCalls.map(call => ({
    id: call.call_id,
    customer_name: call.agent_name,
    customer_phone: call.customer_phone,
    order_type: 'COLLECTION', // Default since calls don't specify
    status: call.status === 'active' ? 'in_progress' : 'completed',
    total_amount: call.order_total || 0, // Add fallback for undefined values
    items: call.order_items || [], // Add fallback for undefined arrays
    created_at: new Date().toISOString(),
    source: 'AI_VOICE'
  }));

  // Show loading only if settings haven't been loaded yet
  if (storeLoading && !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: globalColors.background.primary }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading AI Voice Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: globalColors.background.primary }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ 
        backgroundColor: globalColors.background.secondary,
        borderColor: globalColors.accent.secondary 
      }}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10"
            >
              ← Back to POS
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-orange-600 flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                AI Voice Orders
              </h1>
            </div>
          </div>
          
          {/* Master Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="master-toggle" className="text-gray-300">AI Assistant</Label>
              <Switch
                id="master-toggle"
                checked={aiVoiceEnabled}
                onCheckedChange={handleMasterToggle}
                className="data-[state=checked]:bg-purple-600"
              />
              {aiVoiceEnabled ? (
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3" style={{ backgroundColor: globalColors.background.secondary }}>
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">Overview</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">Settings</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-purple-600">Live Orders</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status Card */}
              <Card style={{ backgroundColor: globalColors.background.secondary, borderColor: globalColors.accent.secondary }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    {aiVoiceEnabled ? <Mic className="w-5 h-5 text-green-400" /> : <MicOff className="w-5 h-5 text-gray-400" />}
                    AI Assistant Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Status:</span>
                      <Badge variant={aiVoiceEnabled ? "default" : "secondary"}>
                        {aiVoiceEnabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Agent:</span>
                      <span className="text-white">{agentName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Calls Today:</span>
                      <span className="text-white">{totalActiveCalls}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card style={{ backgroundColor: globalColors.background.secondary, borderColor: globalColors.accent.secondary }}>
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setActiveTab('settings')} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Settings
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('orders')} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    View Live Orders
                  </Button>
                  <Button 
                    onClick={refreshLiveCalls} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card style={{ backgroundColor: globalColors.background.secondary, borderColor: globalColors.accent.secondary }}>
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Last call:</span>
                      <span className="text-white">2 mins ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Orders processed:</span>
                      <span className="text-white">8 today</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Success rate:</span>
                      <span className="text-green-400">95%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card style={{ backgroundColor: globalColors.background.secondary, borderColor: globalColors.accent.secondary }}>
              <CardHeader>
                <CardTitle className="text-white">AI Voice Assistant Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Custom Name */}
                <div className="space-y-2">
                  <Label htmlFor="custom-name" className="text-gray-300">Assistant Name</Label>
                  <Input
                    id="custom-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Cottage Tandoori Assistant"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                {/* Agent Selection */}
                <div className="space-y-3">
                  <Label className="text-gray-300">Select AI Agent</Label>
                  <div className="space-y-2">
                    {agents.map((agent) => (
                      <div 
                        key={agent.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAgentId === agent.id 
                            ? 'border-purple-500 bg-purple-500/10' 
                            : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                        }`}
                        onClick={() => setSelectedAgentId(agent.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-purple-600 text-white text-xs">
                              {agent.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-white font-medium">{agent.name}</div>
                            <div className="text-gray-400 text-sm">{agent.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings} 
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card style={{ backgroundColor: globalColors.background.secondary, borderColor: globalColors.accent.secondary }}>
              <CardHeader>
                <CardTitle className="text-white">AI Voice Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {voiceOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No voice orders yet</p>
                    <p className="text-gray-500 text-sm">Orders will appear here when customers call</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {voiceOrders.map((order) => (
                      <div 
                        key={order.id}
                        className="p-4 border border-gray-600 rounded-lg bg-gray-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-orange-600 text-white text-xs">
                                {order.customer_name?.split(' ').map(n => n[0]).join('') || 'AI'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-white font-medium">{order.customer_name || 'Voice Order'}</div>
                              <div className="text-gray-400 text-sm">{order.customer_phone}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">£{(order.total_amount || 0).toFixed(2)}</div>
                            <Badge variant="outline" className="text-xs">
                              {order.order_type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-gray-300 text-sm">
                          {(order.items || []).length} items • {new Date(order.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
