

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminSelect } from 'components/AdminSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Bell, Check, MessageCircle, Send, RefreshCw, AlertCircle, ClipboardList, BellRing, UserCog, Settings, Cog } from 'lucide-react';
import { apiClient } from 'app';
import { CustomerPreferencesPanel } from './CustomerPreferencesPanel';

interface NotificationTemplate {
  id: string;
  name: string;
  type: "SMS" | "WHATSAPP";
  template: string;
  description?: string;
  variables: string[];
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NotificationHistoryItem {
  notification_id: string;
  template_id: string;
  phone_number: string;
  message: string;
  variables: Record<string, any>;
  status: string;
  sent_at: string;
  order_id?: string;
  delivery_status?: string;
  updated_at?: string;
}

interface VoiceOrderNotificationPanelProps {
  compact?: boolean;
}

export function VoiceOrderNotificationPanel({ compact = false }: VoiceOrderNotificationPanelProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>("+44");
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});

  // Fetch notification templates
  const fetchTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const response = await apiClient.list_templates();
      const data = await response.json();
      
      if (data.success && data.templates) {
        setTemplates(data.templates);
        if (data.templates.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(data.templates[0].id);
          setSelectedTemplate(data.templates[0]);
        }
      } else {
        toast.error("Failed to load notification templates");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Error loading notification templates");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Fetch notification history
  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await apiClient.get_notification_history({ limit: compact ? 5 : 20 });
      const data = await response.json();
      
      if (data.success && data.history) {
        setHistory(data.history);
      } else {
        console.error("Failed to load notification history:", data.message);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      if (!selectedTemplateId || !testPhoneNumber) {
        toast.error("Please select a template and enter a phone number");
        return;
      }

      setIsSendingTest(true);
      const response = await apiClient.test_template({
        template_id: selectedTemplateId,
        phone_number: testPhoneNumber,
        variables: testVariables
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Test notification sent successfully");
        // Refresh notification history
        fetchHistory();
      } else {
        toast.error(`Failed to send test notification: ${data.message}`);
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Error sending test notification");
    } finally {
      setIsSendingTest(false);
    }
  };

  // Update template variables when selected template changes
  useEffect(() => {
    if (selectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setSelectedTemplate(template);
        
        // Initialize variables for the template
        const initialVariables: Record<string, string> = {};
        template.variables.forEach(variable => {
          initialVariables[variable] = testVariables[variable] || "";
        });
        setTestVariables(initialVariables);
      }
    }
  }, [selectedTemplateId, templates]);

  // Load data on component mount
  useEffect(() => {
    fetchTemplates();
    fetchHistory();
  }, []);

  // Handle variable input change
  const handleVariableChange = (variable: string, value: string) => {
    setTestVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-purple-400" />
            <h3 className="text-white text-sm font-medium">Notification Service</h3>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs bg-gray-800 hover:bg-gray-700 border-gray-700"
              onClick={fetchTemplates}
              disabled={isLoadingTemplates}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingTemplates ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge className="bg-green-900/30 text-green-300 border-green-800">
              {templates.length} Templates
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <AdminSelect
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
              disabled={isLoadingTemplates}
              placeholder="Select a template"
              options={templates.map(template => ({
                value: template.id,
                label: `${template.name} (${template.type})`
              }))}
              variant="purple"
              size="sm"
            />
            
            <Input
              type="text"
              placeholder="+44 Phone Number"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white text-sm h-8"
            />
            
            <Button
              size="sm"
              className="h-8 bg-purple-900 hover:bg-purple-800"
              onClick={sendTestNotification}
              disabled={isSendingTest || !selectedTemplateId}
            >
              {isSendingTest ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <MessageCircle className="h-3 w-3 mr-1" />
              )}
              Test
            </Button>
          </div>
          
          {selectedTemplate && (
            <div className="grid grid-cols-2 gap-2">
              {selectedTemplate.variables.map(variable => (
                <Input
                  key={variable}
                  placeholder={variable}
                  value={testVariables[variable] || ""}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white text-sm h-8"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-white">Customer Notifications</h2>
          <Badge className="bg-purple-900/70 text-purple-200 border-purple-700 hover:bg-purple-900/90">
            Twilio Integration
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-gray-800 hover:bg-gray-700 border-gray-700"
            onClick={() => {
              fetchTemplates();
              fetchHistory();
            }}
            disabled={isLoadingTemplates || isLoadingHistory}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTemplates || isLoadingHistory ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <p className="text-gray-400">
        Send SMS and WhatsApp notifications to customers for order confirmations, payment receipts, 
        and delivery updates. Particularly useful for orders placed through the Ultravox AI voice agent.
      </p>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="bg-gray-800 mb-6">
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span>Test Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Notification Templates</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notification History</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span>Customer Preferences</span>
          </TabsTrigger>
        </TabsList>

        {/* Test Notification Tab */}
        <TabsContent value="test" className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
            <h3 className="text-white text-md font-medium mb-4">Send Test Notification</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-select" className="text-gray-400 text-sm mb-1 block">Notification Template</Label>
                  <AdminSelect
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                    placeholder="Select a template"
                    options={templates.map(template => ({
                      value: template.id,
                      label: `${template.name} (${template.type})`
                    }))}
                    variant="purple"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone-number" className="text-gray-400 text-sm mb-1 block">Phone Number</Label>
                  <Input
                    id="phone-number"
                    type="text"
                    placeholder="+44 Phone Number"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>
              
              {selectedTemplate && (
                <>
                  <div className="bg-gray-900 p-3 rounded-md border border-gray-700">
                    <p className="text-gray-400 text-sm mb-2">Template Preview:</p>
                    <p className="text-white whitespace-pre-wrap">{selectedTemplate.template}</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-400 text-sm mb-2 block">Template Variables</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTemplate.variables.map(variable => (
                        <div key={variable}>
                          <Label htmlFor={`var-${variable}`} className="text-gray-400 text-xs mb-1 block">{variable}</Label>
                          <Input
                            id={`var-${variable}`}
                            placeholder={variable}
                            value={testVariables[variable] || ""}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex justify-end mt-4">
                <Button
                  onClick={sendTestNotification}
                  disabled={isSendingTest || !selectedTemplateId}
                  className="bg-purple-900 hover:bg-purple-800"
                >
                  {isSendingTest ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Test Notification
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Customer Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
            <h3 className="text-white text-md font-medium mb-4">Manage Customer Notification Preferences</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer-phone" className="text-gray-400 text-sm mb-1 block">Customer Phone Number</Label>
                <div className="flex gap-3">
                  <Input
                    id="customer-phone"
                    type="text"
                    placeholder="+44 Phone Number"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <Button 
                    variant="outline" 
                    className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                    onClick={() => {
                      if (testPhoneNumber) {
                        // Force refresh of the CustomerPreferencesPanel
                        setTestPhoneNumber(prev => prev);
                      } else {
                        toast.error("Please enter a phone number");
                      }
                    }}
                  >
                    <Cog className="h-4 w-4 mr-2" />
                    Load Settings
                  </Button>
                </div>
              </div>
              
              {testPhoneNumber && (
                <CustomerPreferencesPanel 
                  phone_number={testPhoneNumber} 
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
            <h3 className="text-white text-md font-medium mb-4">Notification Templates</h3>
            
            {isLoadingTemplates ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="bg-gray-900 p-4 rounded-md border border-gray-700 text-center">
                <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">No notification templates found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map(template => (
                  <div key={template.id} className="bg-gray-900 p-4 rounded-md border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">{template.name}</h4>
                        <Badge className={template.type === "SMS" ? 
                          "bg-blue-900/30 text-blue-300 border-blue-800" : 
                          "bg-green-900/30 text-green-300 border-green-800"}
                        >
                          {template.type}
                        </Badge>
                        {template.enabled ? (
                          <Badge className="bg-green-900/30 text-green-300 border-green-800">Enabled</Badge>
                        ) : (
                          <Badge className="bg-red-900/30 text-red-300 border-red-800">Disabled</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">Enabled</span>
                          <Switch checked={template.enabled} disabled />
                        </div>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="mb-3">
                      <p className="text-gray-400 text-sm mb-1">Template:</p>
                      <p className="text-white text-sm whitespace-pre-wrap">{template.template}</p>
                    </div>
                    {template.variables.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Variables:</p>
                        <div className="flex flex-wrap gap-2">
                          {template.variables.map(variable => (
                            <Badge key={variable} className="bg-gray-800 text-gray-300 border-gray-700">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
            <h3 className="text-white text-md font-medium mb-4">Notification History</h3>
            
            {isLoadingHistory ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="bg-gray-900 p-4 rounded-md border border-gray-700 text-center">
                <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">No notification history found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map(item => (
                  <div key={item.notification_id} className="bg-gray-900 p-4 rounded-md border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{item.template_id}</p>
                        <Badge className={item.status === "SENT" ? 
                          "bg-green-900/30 text-green-300 border-green-800" : 
                          "bg-red-900/30 text-red-300 border-red-800"}
                        >
                          {item.status}
                        </Badge>
                        {item.order_id && (
                          <Badge className="bg-blue-900/30 text-blue-300 border-blue-800">
                            Order: {item.order_id}
                          </Badge>
                        )}
                      </div>
                      <span className="text-gray-400 text-xs">
                        {new Date(item.sent_at).toLocaleString()}
                      </span>
                    </div>
                    <Separator className="my-3" />
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Recipient:</p>
                      <p className="text-white text-sm">{item.phone_number}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-400 text-sm mb-1">Message:</p>
                      <p className="text-white text-sm whitespace-pre-wrap">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
