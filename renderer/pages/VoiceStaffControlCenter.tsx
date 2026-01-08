import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle,
  Download,
  ExternalLink,
  Github,
  Info,
  Loader2,
  Monitor,
  MonitorSpeaker,
  Network,
  Phone,
  Printer,
  RefreshCw,
  Settings,
  Terminal,
  Zap
} from 'lucide-react';
import { APITestingConsole } from '../components/APITestingConsole';
import { AgentManagementPanel } from '../components/AgentManagementPanel';
import { CorpusManagementPanel } from '../components/CorpusManagementPanel';
import { StripeManagement } from '../components/StripeManagement';
import { toast } from 'sonner';
import { 
  globalColors as QSAITheme,
  panelStyle,
  styles,
  effects
} from 'utils/QSAIDesign';
import { apiClient } from 'app';

// Types for service health status
type ServiceStatus = 'connected' | 'disconnected' | 'error' | 'checking';

interface ServiceHealth {
  status: ServiceStatus;
  lastChecked?: string;
  error?: string;
}

interface ServicesHealth {
  ultravox: ServiceHealth;
  stripe: ServiceHealth;
}

export default function VoiceStaffControlCenter() {
  const [activeTab, setActiveTab] = useState('ultravox');
  const [serviceHealth, setServiceHealth] = useState<ServicesHealth>({
    ultravox: { status: 'disconnected' },
    stripe: { status: 'disconnected' }
  });
  
  // GitHub release management state
  const [latestRelease, setLatestRelease] = useState<any>(null);
  const [loadingRelease, setLoadingRelease] = useState(false);
  const [creatingRelease, setCreatingRelease] = useState(false);

  // Fetch latest release information
  const fetchLatestRelease = async () => {
    setLoadingRelease(true);
    try {
      const response = await apiClient.check_latest_release();
      const data = await response.json();
      setLatestRelease(data);
    } catch (error) {
      console.error('Failed to fetch latest release:', error);
    } finally {
      setLoadingRelease(false);
    }
  };

  // Create v8.0.0 GitHub release
  const createV8Release = async () => {
    setCreatingRelease(true);
    try {
      const response = await apiClient.create_v8_epos_sdk_release();
      const data = await response.json();
      
      if (data.success) {
        toast.success('✅ GitHub release v8.0.0 created successfully!');
        // Refresh release data
        await fetchLatestRelease();
      } else {
        toast.error(`❌ Failed to create release: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to create release:', error);
      toast.error('Failed to create GitHub release');
    } finally {
      setCreatingRelease(false);
    }
  };

  // Auto-fetch release data on mount
  useEffect(() => {
    fetchLatestRelease();
  }, []);

  // Health check functions
  const checkUltravoxHealth = async () => {
    try {
      setServiceHealth(prev => ({ 
        ...prev, 
        ultravox: { status: 'checking' } 
      }));
      
      const response = await apiClient.test_connection();
      const data = await response.json();

      setServiceHealth(prev => ({
        ...prev,
        ultravox: {
          status: data.success ? 'connected' : 'error',
          lastChecked: new Date().toISOString(),
          error: data.success ? undefined : data.message
        }
      }));
    } catch (error) {
      setServiceHealth(prev => ({
        ...prev,
        ultravox: {
          status: 'error',
          lastChecked: new Date().toISOString(),
          error: 'Failed to connect to Ultravox API'
        }
      }));
    }
  };

  const checkStripeHealth = async () => {
    try {
      setServiceHealth(prev => ({ 
        ...prev, 
        stripe: { status: 'checking' } 
      }));
      
      const response = await apiClient.check_stripe_health();
      const data = await response.json();

      setServiceHealth(prev => ({
        ...prev,
        stripe: {
          status: data.status === 'connected' ? 'connected' : 'error',
          lastChecked: new Date().toISOString(),
          error: data.status === 'connected' ? undefined : data.error
        }
      }));
    } catch (error) {
      setServiceHealth(prev => ({
        ...prev,
        stripe: {
          status: 'error',
          lastChecked: new Date().toISOString(),
          error: 'Failed to connect to Stripe API'
        }
      }));
    }
  };

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4" style={{ color: QSAITheme.status.success }} />;
      case 'error':
        return <AlertCircle className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin" style={{ color: QSAITheme.purple.light }} />;
      default:
        return <AlertCircle className="h-4 w-4" style={{ color: QSAITheme.text.muted }} />;
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'error': return 'Error';
      case 'checking': return 'Checking...';
      default: return 'Disconnected';
    }
  };

  return (
    <div 
      className="min-h-screen p-8 lg:p-12" 
      style={{
        background: QSAITheme.background.primary,
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(91, 33, 182, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(91, 33, 182, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(91, 33, 182, 0.05) 0%, transparent 50%)
        `
      }}
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header with QSAI styling */}
        <div className="mb-10 lg:mb-12">
          <h1 
            className="text-4xl font-bold mb-4" 
            style={{
              background: `linear-gradient(135deg, ${QSAITheme.text.primary} 0%, ${QSAITheme.purple.light} 50%, ${QSAITheme.text.primary} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: `0 0 20px ${QSAITheme.purple.glow}`
            }}
          >
            Voice Staff Control Center
          </h1>
          <p 
            className="text-lg" 
            style={{ color: QSAITheme.text.secondary }}
          >
            Manage your restaurant's AI staff members and voice assistants
          </p>
        </div>

        {/* Service Status Overview with QSAI design */}
        <Card 
          className="overflow-hidden border-0 shadow-2xl" 
          style={{
            ...panelStyle,
            background: `linear-gradient(135deg, ${QSAITheme.background.tertiary} 0%, ${QSAITheme.background.secondary} 100%)`,
            borderColor: QSAITheme.border.accent,
            boxShadow: `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px ${QSAITheme.purple.glow}`
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle 
              className="flex items-center gap-3 text-xl" 
              style={{ color: QSAITheme.text.primary }}
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center" 
                style={{
                  background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                  boxShadow: effects.outerGlow('medium')
                }}
              >
                <Activity className="h-5 w-5 text-white" />
              </div>
              System Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
              {/* Helper App Status */}
              <div 
                className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-105" 
                style={{
                  background: `linear-gradient(135deg, ${QSAITheme.background.card} 0%, rgba(76, 29, 149, 0.1) 100%)`,
                  border: `1px solid ${QSAITheme.border.accent}`,
                  boxShadow: effects.innerGlow('subtle')
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center" 
                    style={{
                      background: `linear-gradient(135deg, ${QSAITheme.purple.dark} 0%, ${QSAITheme.purple.primary} 100%)`,
                      boxShadow: effects.outerGlow('subtle')
                    }}
                  >
                    <Monitor className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: QSAITheme.text.primary }}>
                      Helper App
                    </p>
                    <p className="text-xs" style={{ color: QSAITheme.text.muted }}>
                      {serviceHealth.ultravox.lastChecked ? new Date(serviceHealth.ultravox.lastChecked).toLocaleTimeString() : 'Not checked'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(serviceHealth.ultravox.status)}
                  <div className="text-right">
                    <span 
                      className="text-sm font-medium" 
                      style={{
                        color: serviceHealth.ultravox.status === 'connected' ? QSAITheme.status.success : 
                               serviceHealth.ultravox.status === 'error' ? QSAITheme.purple.primary : QSAITheme.text.secondary
                      }}
                    >
                      {serviceHealth.ultravox.status === 'connected' ? 'Ready' : 'Offline'}
                    </span>
                    <p className="text-xs" style={{ color: QSAITheme.text.muted }}>localhost:3001</p>
                  </div>
                </div>
              </div>
              
              {Object.entries(serviceHealth).map(([service, health]) => (
                <div 
                  key={service} 
                  className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-105" 
                  style={{
                    background: `linear-gradient(135deg, ${QSAITheme.background.card} 0%, rgba(91, 33, 182, 0.1) 100%)`,
                    border: `1px solid ${QSAITheme.border.accent}`,
                    boxShadow: effects.innerGlow('subtle')
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center" 
                      style={{
                        background: (service === 'ultravox' || service === 'stripe') ? 
                          `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)` : 
                          `linear-gradient(135deg, ${QSAITheme.background.tertiary} 0%, ${QSAITheme.background.card} 100%)`,
                        boxShadow: effects.outerGlow('subtle')
                      }}
                    >
                      {service === 'ultravox' && <Bot className="h-5 w-5 text-white" />}
                      {service === 'stripe' && <Zap className="h-5 w-5 text-white" />}
                    </div>
                    <div>
                      <p className="font-semibold capitalize" style={{ color: QSAITheme.text.primary }}>
                        {service}
                      </p>
                      <p className="text-xs" style={{ color: QSAITheme.text.muted }}>
                        {health.lastChecked ? new Date(health.lastChecked).toLocaleTimeString() : 'Not checked'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(health.status)}
                    <span 
                      className="text-sm font-medium" 
                      style={{
                        color: health.status === 'connected' ? QSAITheme.status.success : 
                               health.status === 'error' ? QSAITheme.purple.primary : QSAITheme.text.secondary
                      }}
                    >
                      {getStatusText(health.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Developer Console with QSAI design */}
        <Card 
          className="overflow-hidden border-0 shadow-2xl" 
          style={{
            ...panelStyle,
            background: `linear-gradient(135deg, ${QSAITheme.background.tertiary} 0%, ${QSAITheme.background.secondary} 100%)`,
            borderColor: QSAITheme.border.accent,
            boxShadow: `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px ${QSAITheme.purple.glow}`
          }}
        >
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab Navigation with QSAI styling */}
              <div 
                className="border-b" 
                style={{ 
                  borderColor: QSAITheme.border.accent,
                  background: `linear-gradient(135deg, ${QSAITheme.background.panel} 0%, ${QSAITheme.background.tertiary} 100%)`
                }}
              >
                <TabsList className="grid w-full grid-cols-6 bg-transparent h-auto p-0">
                  <TabsTrigger 
                    value="ultravox" 
                    className="flex items-center gap-2 p-4 rounded-none border-r transition-all duration-200"
                    style={{
                      borderColor: QSAITheme.border.medium,
                      color: activeTab === 'ultravox' ? QSAITheme.text.primary : QSAITheme.text.secondary,
                      background: activeTab === 'ultravox' ? 
                        `linear-gradient(135deg, ${QSAITheme.purple.primary}20 0%, ${QSAITheme.purple.light}20 100%)` : 
                        'transparent'
                    }}
                  >
                    <Bot className="h-4 w-4" />
                    AI Voice
                    <Badge 
                      variant="outline" 
                      className="ml-2 text-xs" 
                      style={{
                        borderColor: serviceHealth.ultravox.status === 'connected' ? QSAITheme.status.success : QSAITheme.purple.primary,
                        color: serviceHealth.ultravox.status === 'connected' ? QSAITheme.status.success : QSAITheme.purple.primary,
                        background: 'transparent'
                      }}
                    >
                      {getStatusText(serviceHealth.ultravox.status)}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stripe" 
                    className="flex items-center gap-2 p-4 rounded-none border-r transition-all duration-200"
                    style={{
                      borderColor: QSAITheme.border.medium,
                      color: activeTab === 'stripe' ? QSAITheme.text.primary : QSAITheme.text.secondary,
                      background: activeTab === 'stripe' ? 
                        `linear-gradient(135deg, ${QSAITheme.purple.primary}20 0%, ${QSAITheme.purple.light}20 100%)` : 
                        'transparent'
                    }}
                  >
                    <Zap className="h-4 w-4" />
                    Stripe
                    <Badge 
                      variant="outline" 
                      className="ml-2 text-xs" 
                      style={{
                        borderColor: serviceHealth.stripe.status === 'connected' ? QSAITheme.status.success : QSAITheme.purple.primary,
                        color: serviceHealth.stripe.status === 'connected' ? QSAITheme.status.success : QSAITheme.purple.primary,
                        background: 'transparent'
                      }}
                    >
                      {getStatusText(serviceHealth.stripe.status)}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ultravox-management" 
                    className="flex items-center gap-2 p-4 rounded-none border-r transition-all duration-200"
                    style={{
                      borderColor: QSAITheme.border.medium,
                      color: activeTab === 'ultravox-management' ? QSAITheme.text.primary : QSAITheme.text.secondary,
                      background: activeTab === 'ultravox-management' ? 
                        `linear-gradient(135deg, ${QSAITheme.purple.primary}20 0%, ${QSAITheme.purple.light}20 100%)` : 
                        'transparent'
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    AI Management
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stripe-management" 
                    className="flex items-center gap-2 p-4 rounded-none border-r transition-all duration-200"
                    style={{
                      borderColor: QSAITheme.border.medium,
                      color: activeTab === 'stripe-management' ? QSAITheme.text.primary : QSAITheme.text.secondary,
                      background: activeTab === 'stripe-management' ? 
                        `linear-gradient(135deg, ${QSAITheme.purple.primary}20 0%, ${QSAITheme.purple.light}20 100%)` : 
                        'transparent'
                    }}
                  >
                    <MonitorSpeaker className="h-4 w-4" />
                    Payment Control
                  </TabsTrigger>
                  <TabsTrigger 
                    value="epson-printer" 
                    className="flex items-center gap-2 p-4 rounded-none transition-all duration-200"
                    style={{
                      color: activeTab === 'epson-printer' ? QSAITheme.text.primary : QSAITheme.text.secondary,
                      background: activeTab === 'epson-printer' ? 
                        `linear-gradient(135deg, ${QSAITheme.purple.primary}20 0%, ${QSAITheme.purple.light}20 100%)` : 
                        'transparent'
                    }}
                  >
                    <Printer className="h-4 w-4" />
                    Epson Printing
                    <Badge 
                      variant="outline" 
                      className="ml-2 text-xs" 
                      style={{
                        borderColor: serviceHealth.ultravox.status === 'connected' ? QSAITheme.status.success : QSAITheme.purple.primary,
                        color: serviceHealth.ultravox.status === 'connected' ? QSAITheme.status.success : QSAITheme.purple.primary,
                        background: 'transparent'
                      }}
                    >
                      {getStatusText(serviceHealth.ultravox.status)}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content with QSAI background */}
              <div 
                className="p-8 lg:p-10" 
                style={{ background: QSAITheme.background.primary }}
              >
                <TabsContent value="ultravox" className="space-y-8 lg:space-y-10">
                  <UltravoxVoiceAISection onHealthCheck={checkUltravoxHealth} />
                </TabsContent>

                <TabsContent value="stripe" className="space-y-8 lg:space-y-10">
                  <StripeTestingSection onHealthCheck={checkStripeHealth} />
                </TabsContent>

                <TabsContent value="ultravox-management" className="space-y-8 lg:space-y-10">
                  <UltravoxManagement />
                </TabsContent>

                <TabsContent value="stripe-management" className="space-y-8 lg:space-y-10">
                  <StripeManagement />
                </TabsContent>

                <TabsContent value="epson-printer" className="space-y-8 lg:space-y-10">
                  <SimpleThermalPrinterHelperSection />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Ultravox Voice AI Management Section
function UltravoxVoiceAISection({ onHealthCheck }: { onHealthCheck: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState('agents');

  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Sub-navigation for Ultravox features */}
      <div className="flex items-center gap-3 pb-6 border-b" style={{ borderColor: `rgba(124, 93, 250, 0.1)` }}>
        <Button
          variant={activeSubTab === 'agents' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSubTab('agents')}
          className={`flex items-center gap-2 ${
            activeSubTab === 'agents' 
              ? 'bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)]' 
              : 'text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]'
          }`}
        >
          <Bot className="h-4 w-4" />
          Agent Profiles
        </Button>
        <Button
          variant={activeSubTab === 'corpus' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSubTab('corpus')}
          className={`flex items-center gap-2 ${
            activeSubTab === 'corpus' 
              ? 'bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)]' 
              : 'text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]'
          }`}
        >
          <Settings className="h-4 w-4" />
          Knowledge Base
        </Button>
        <Button
          variant={activeSubTab === 'api' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSubTab('api')}
          className={`flex items-center gap-2 ${
            activeSubTab === 'api' 
              ? 'bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)]' 
              : 'text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]'
          }`}
        >
          <Terminal className="h-4 w-4" />
          API Testing
        </Button>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'agents' && (
        <AgentManagementPanel onRefresh={onHealthCheck} />
      )}

      {activeSubTab === 'corpus' && (
        <CorpusManagementPanel onRefresh={onHealthCheck} />
      )}

      {activeSubTab === 'api' && (
        <APITestingConsole onRefresh={onHealthCheck} />
      )}
    </div>
  );
}

// Stripe Testing Section with QSAI styling
function StripeTestingSection({ onHealthCheck }: { onHealthCheck: () => void }) {
  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Stripe Health Status */}
      <Card 
        className="overflow-hidden border-0 shadow-xl" 
        style={{
          ...panelStyle,
          background: `linear-gradient(135deg, ${QSAITheme.background.card} 0%, rgba(91, 33, 182, 0.05) 100%)`,
          borderColor: QSAITheme.border.accent,
          boxShadow: `0 10px 30px rgba(0, 0, 0, 0.2), 0 0 20px ${QSAITheme.purple.glow}`
        }}
      >
        <CardHeader className="pb-4">
          <CardTitle 
            className="flex items-center gap-3 text-xl" 
            style={{ color: QSAITheme.text.primary }}
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center" 
              style={{
                background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                boxShadow: effects.outerGlow('medium')
              }}
            >
              <Zap className="h-5 w-5 text-white" />
            </div>
            Stripe Payment Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: QSAITheme.text.secondary }}>
                Test Stripe payment processing and webhook integration
              </p>
            </div>
            <Button
              onClick={onHealthCheck}
              className="flex items-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                color: 'white',
                border: 'none'
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple Thermal Printer Helper Section Component
function SimpleThermalPrinterHelperSection() {
  const [printerStatus, setPrinterStatus] = useState<{
    service_running: boolean;
    kitchen_printer_connected: boolean;
    receipt_printer_connected: boolean;
    last_checked?: string;
    error?: string;
  }>({ service_running: false, kitchen_printer_connected: false, receipt_printer_connected: false });
  
  const [statusLoading, setStatusLoading] = useState(false);
  const [printingKitchen, setPrintingKitchen] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  // Check printer status
  const checkPrinterStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await apiClient.get_printer_status();
      const data = await response.json();
      
      setPrinterStatus({
        service_running: data.service_running || false,
        kitchen_printer_connected: data.kitchen_printer_connected || false,
        receipt_printer_connected: data.receipt_printer_connected || false,
        last_checked: data.last_checked,
        error: data.error
      });
      
      if (data.success && data.service_running) {
        toast.success('✅ Printer service connected!');
      } else {
        toast.error(`❌ ${data.error || 'Printer service not responding'}`);
      }
    } catch (error) {
      console.error('Printer status check failed:', error);
      toast.error('Failed to check printer status');
      setPrinterStatus({
        service_running: false,
        kitchen_printer_connected: false,
        receipt_printer_connected: false,
        error: 'Service unavailable'
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // Send test print to kitchen printer
  const testKitchenPrint = async () => {
    setPrintingKitchen(true);
    try {
      const response = await apiClient.test_print({
        printer_type: 'kitchen',
        test_message: testMessage || 'Test print from Boss🫡 development console'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('🍽️ Kitchen test print sent!');
      } else {
        toast.error(`❌ Kitchen print failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Kitchen print error:', error);
      toast.error('Failed to send kitchen test print');
    } finally {
      setPrintingKitchen(false);
    }
  };

  // Send test print to receipt printer
  const testReceiptPrint = async () => {
    setPrintingReceipt(true);
    try {
      const response = await apiClient.test_print({
        printer_type: 'receipt',
        test_message: testMessage || 'Test receipt from Boss🫡 development console'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('🧾 Receipt test print sent!');
      } else {
        toast.error(`❌ Receipt print failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Receipt print error:', error);
      toast.error('Failed to send receipt test print');
    } finally {
      setPrintingReceipt(false);
    }
  };

  // Auto-check status on mount
  useEffect(() => {
    checkPrinterStatus();
  }, []);

  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Thermal Printer Control Center</h3>
          <p style={{ color: QSAITheme.text.secondary }}>Live printer status & test printing for TM-T20III & TM-T88V</p>
        </div>
        <Button
          onClick={checkPrinterStatus}
          disabled={statusLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
          style={{
            background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
            color: 'white',
            border: 'none'
          }}
        >
          {statusLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Check Status
        </Button>
      </div>

      {/* Live Status Dashboard */}
      <Card 
        className="overflow-hidden border-0 shadow-xl" 
        style={{
          ...panelStyle,
          background: `linear-gradient(135deg, ${QSAITheme.background.card} 0%, rgba(91, 33, 182, 0.05) 100%)`,
          borderColor: QSAITheme.border.accent,
          boxShadow: `0 10px 30px rgba(0, 0, 0, 0.2), 0 0 20px ${QSAITheme.purple.glow}`
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-3" style={{ color: QSAITheme.text.primary }}>
            <div 
              className="p-2 rounded-lg"
              style={{ 
                background: printerStatus.service_running ? 
                  `linear-gradient(135deg, ${QSAITheme.status.success}20 0%, ${QSAITheme.status.success}30 100%)` :
                  `linear-gradient(135deg, ${QSAITheme.purple.primary}20 0%, ${QSAITheme.purple.light}20 100%)`,
                border: `1px solid ${printerStatus.service_running ? QSAITheme.status.success : QSAITheme.purple.primary}30`
              }}
            >
              <Network className="h-5 w-5" style={{ 
                color: printerStatus.service_running ? QSAITheme.status.success : QSAITheme.purple.primary 
              }} />
            </div>
            Printer Service Status
            <Badge 
              variant="outline" 
              style={{
                borderColor: printerStatus.service_running ? QSAITheme.status.success : QSAITheme.purple.primary,
                color: printerStatus.service_running ? QSAITheme.status.success : QSAITheme.purple.primary,
                background: 'transparent'
              }}
            >
              {printerStatus.service_running ? 'Online' : 'Offline'}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Service & Printer Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Service Status */}
            <div className="text-center p-4 rounded-lg" style={{ 
              background: QSAITheme.background.tertiary,
              border: `1px solid ${printerStatus.service_running ? QSAITheme.status.success : QSAITheme.purple.primary}30`
            }}>
              {printerStatus.service_running ? (
                <CheckCircle className="h-8 w-8 mx-auto mb-2" style={{ color: QSAITheme.status.success }} />
              ) : (
                <AlertCircle className="h-8 w-8 mx-auto mb-2" style={{ color: QSAITheme.purple.primary }} />
              )}
              <p className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>HTTP Service</p>
              <p className="text-xs" style={{ color: QSAITheme.text.secondary }}>localhost:3001</p>
            </div>
            
            {/* Kitchen Printer */}
            <div className="text-center p-4 rounded-lg" style={{ 
              background: QSAITheme.background.tertiary,
              border: `1px solid ${printerStatus.kitchen_printer_connected ? QSAITheme.status.success : QSAITheme.purple.primary}30`
            }}>
              {printerStatus.kitchen_printer_connected ? (
                <Printer className="h-8 w-8 mx-auto mb-2" style={{ color: QSAITheme.status.success }} />
              ) : (
                <Printer className="h-8 w-8 mx-auto mb-2" style={{ color: QSAITheme.purple.primary }} />
              )}
              <p className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>Kitchen (TM-T20III)</p>
              <p className="text-xs" style={{ color: QSAITheme.text.secondary }}>
                {printerStatus.kitchen_printer_connected ? 'Connected' : 'Not Connected'}
              </p>
            </div>
            
            {/* Receipt Printer */}
            <div className="text-center p-4 rounded-lg" style={{ 
              background: QSAITheme.background.tertiary,
              border: `1px solid ${printerStatus.receipt_printer_connected ? QSAITheme.status.success : QSAITheme.purple.primary}30`
            }}>
              {printerStatus.receipt_printer_connected ? (
                <Printer className="h-8 w-8 mx-auto mb-2" style={{ color: QSAITheme.status.success }} />
              ) : (
                <Printer className="h-8 w-8 mx-auto mb-2" style={{ color: QSAITheme.purple.primary }} />
              )}
              <p className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>Receipt (TM-T88V)</p>
              <p className="text-xs" style={{ color: QSAITheme.text.secondary }}>
                {printerStatus.receipt_printer_connected ? 'Connected' : 'Not Connected'}
              </p>
            </div>
          </div>

          {/* Error Display */}
          {printerStatus.error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription style={{ color: QSAITheme.text.secondary }}>
                {printerStatus.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Last Checked */}
          {printerStatus.last_checked && (
            <p className="text-xs text-center" style={{ color: QSAITheme.text.muted }}>
              Last checked: {new Date(printerStatus.last_checked).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test Printing Section */}
      <Card 
        className="overflow-hidden border-0 shadow-xl" 
        style={{
          ...panelStyle,
          background: `linear-gradient(135deg, ${QSAITheme.background.card} 0%, rgba(91, 33, 182, 0.05) 100%)`,
          borderColor: QSAITheme.border.accent,
          boxShadow: `0 10px 30px rgba(0, 0, 0, 0.2), 0 0 20px ${QSAITheme.purple.glow}`
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-3" style={{ color: QSAITheme.text.primary }}>
            <div 
              className="p-2 rounded-lg"
              style={{ 
                background: `linear-gradient(135deg, ${QSAITheme.purple.primary}20 0%, ${QSAITheme.purple.light}20 100%)`,
                border: `1px solid ${QSAITheme.purple.primary}30`
              }}
            >
              <Terminal className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
            </div>
            Test Print Functions
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Custom Test Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
              Custom Test Message (Optional)
            </label>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter custom message for test prints..."
              className="resize-none"
              style={{
                background: QSAITheme.background.tertiary,
                border: `1px solid ${QSAITheme.border.accent}`,
                color: QSAITheme.text.primary
              }}
            />
          </div>

          {/* Test Print Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kitchen Test Print */}
            <Button
              onClick={testKitchenPrint}
              disabled={printingKitchen || !printerStatus.service_running}
              className="flex items-center justify-center gap-2 p-4 h-auto flex-col transition-all duration-200 hover:scale-105"
              style={{
                background: printingKitchen ? 
                  `linear-gradient(135deg, ${QSAITheme.text.muted} 0%, ${QSAITheme.text.muted} 100%)` :
                  `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                color: 'white',
                border: 'none',
                opacity: (!printerStatus.service_running) ? 0.5 : 1
              }}
            >
              {printingKitchen ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Printer className="h-6 w-6" />
              )}
              <div className="text-center">
                <div className="font-semibold">Test Kitchen Print</div>
                <div className="text-xs opacity-90">TM-T20III • Order ticket</div>
              </div>
            </Button>

            {/* Receipt Test Print */}
            <Button
              onClick={testReceiptPrint}
              disabled={printingReceipt || !printerStatus.service_running}
              className="flex items-center justify-center gap-2 p-4 h-auto flex-col transition-all duration-200 hover:scale-105"
              style={{
                background: printingReceipt ? 
                  `linear-gradient(135deg, ${QSAITheme.text.muted} 0%, ${QSAITheme.text.muted} 100%)` :
                  `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                color: 'white',
                border: 'none',
                opacity: (!printerStatus.service_running) ? 0.5 : 1
              }}
            >
              {printingReceipt ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Printer className="h-6 w-6" />
              )}
              <div className="text-center">
                <div className="font-semibold">Test Receipt Print</div>
                <div className="text-xs opacity-90">TM-T88V • Customer receipt</div>
              </div>
            </Button>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-lg" style={{ 
            background: `${QSAITheme.purple.primary}10`, 
            border: `1px solid ${QSAITheme.purple.primary}30` 
          }}>
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5" style={{ color: QSAITheme.purple.primary }} />
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: QSAITheme.text.primary }}>Test Print Instructions</p>
                <ol className="text-xs space-y-1" style={{ color: QSAITheme.text.secondary }}>
                  <li>1. Make sure cottage-tandoori-printer.exe is running</li>
                  <li>2. Check that both printers show as "Connected" above</li>
                  <li>3. Click test buttons to send sample orders to each printer</li>
                  <li>4. Kitchen prints order details, Receipt prints customer receipts</li>
                  <li>5. Ready for live POSDesktop integration! 🚀</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card 
        className="overflow-hidden border-0 shadow-xl" 
        style={{
          ...panelStyle,
          background: `linear-gradient(135deg, ${QSAITheme.background.card} 0%, rgba(91, 33, 182, 0.05) 100%)`,
          borderColor: QSAITheme.border.accent,
          boxShadow: `0 10px 30px rgba(0, 0, 0, 0.2), 0 0 20px ${QSAITheme.purple.glow}`
        }}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${QSAITheme.purple.primary}20 0%, ${QSAITheme.purple.light}20 100%)`,
                  border: `1px solid ${QSAITheme.purple.primary}30`
                }}
              >
                <Download className="h-6 w-6" style={{ color: QSAITheme.purple.primary }} />
              </div>
              <div>
                <CardTitle style={{ color: QSAITheme.text.primary }}>
                  Windows Thermal Printer Helper
                </CardTitle>
                <p className="text-sm mt-1" style={{ color: QSAITheme.text.secondary }}>
                  HTTP server for TM-T20III (kitchen) & TM-T88V (receipt) printing
                </p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              style={{
                borderColor: QSAITheme.status.success,
                color: QSAITheme.status.success,
                background: 'transparent'
              }}
            >
              Ready
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Download Section */}
          <div className="p-6 rounded-lg" style={{ background: QSAITheme.background.secondary, border: `1px solid ${QSAITheme.border.accent}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold" style={{ color: QSAITheme.text.primary }}>cottage-tandoori-printer.exe</h4>
                <p className="text-sm" style={{ color: QSAITheme.text.secondary }}>Windows executable for thermal printing</p>
              </div>
              <a
                href="https://github.com/Bodzaman/cottage-tandoori-simple-printer/actions/runs/17028991883"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                  color: 'white',
                  border: 'none'
                }}
              >
                <Download className="h-4 w-4" />
                Download .exe
              </a>
            </div>
            
            {/* API Endpoints */}
            <div className="space-y-2">
              <p className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>Available Endpoints:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{ color: QSAITheme.text.secondary }}>
                <div>• POST /print/kitchen</div>
                <div>• POST /print/receipt</div>
                <div>• GET /health</div>
                <div>• POST /print/test</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
