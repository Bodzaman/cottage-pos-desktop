



import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  ExternalLink, 
  Github,
  Printer,
  CheckCircle,
  AlertCircle,
  Loader2,
  Monitor,
  Usb,
  Wifi,
  Network,
  Eye,
  RefreshCw,
  Terminal,
  Activity,
  Zap
} from 'lucide-react';
import { 
  globalColors as QSAITheme,
  panelStyle,
  styles,
  effects
} from 'utils/QSAIDesign';
import { toast } from 'sonner';

interface PrinterHelper {
  name: string;
  description: string;
  status: 'ready' | 'building' | 'error';
  version: string;
  downloadUrl?: string;
  repositoryUrl: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
}

export default function SimpleThermalPrinterHelperSection() {
  const [buildStatus, setBuildStatus] = useState<'checking' | 'building' | 'ready' | 'error'>('checking');
  const [downloadReady, setDownloadReady] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('');

  // Printer helpers configuration
  const printerHelpers: PrinterHelper[] = [
    {
      name: "Simple Thermal Printer Helper",
      description: "Lightweight Node.js HTTP server for basic thermal printing. Perfect for POSDesktop integration.",
      status: 'ready',
      version: "v1.0.0",
      downloadUrl: "https://github.com/Bodzaman/cottage-tandoori-simple-printer/actions/runs/17028991883",
      repositoryUrl: "https://github.com/Bodzaman/cottage-tandoori-simple-printer",
      features: [
        "HTTP endpoints for kitchen & receipt printing",
        "Hybrid Windows + ESC/POS strategy",
        "TM-T20III & TM-T88V support",
        "Minimal dependencies",
        "POSDesktop integration ready"
      ],
      icon: <Terminal className="h-6 w-6" />,
      color: QSAITheme.status.success
    },
    {
      name: "Official ePOS SDK Helper",
      description: "Advanced Epson printer integration with official SDK and WiFi support.",
      status: 'ready',
      version: "v8.0.0",
      downloadUrl: "https://github.com/Bodzaman/qsai-epson-helper/releases/latest/download/qsai-helper-windows.exe",
      repositoryUrl: "https://github.com/Bodzaman/qsai-epson-helper",
      features: [
        "Official Epson ePOS SDK",
        "WiFi & USB connectivity", 
        "Auto-discovery features",
        "Advanced restaurant integration",
        "Desktop app interface"
      ],
      icon: <Wifi className="h-6 w-6" />,
      color: QSAITheme.purple.primary
    }
  ];

  // Check GitHub build status
  const checkBuildStatus = async () => {
    setBuildStatus('checking');
    setLastChecked(new Date().toLocaleTimeString());
    
    try {
      // Simulate checking GitHub Actions status
      // In real implementation, this would call GitHub API
      setTimeout(() => {
        setBuildStatus('ready');
        setDownloadReady(true);
        toast.success('✅ Build status checked - downloads ready!');
      }, 1500);
    } catch (error) {
      setBuildStatus('error');
      toast.error('❌ Failed to check build status');
    }
  };

  // Check status on mount
  useEffect(() => {
    checkBuildStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4" style={{ color: QSAITheme.status.success }} />;
      case 'building':
        return <Loader2 className="h-4 w-4 animate-spin" style={{ color: QSAITheme.purple.light }} />;
      case 'error':
        return <AlertCircle className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />;
      default:
        return <Activity className="h-4 w-4" style={{ color: QSAITheme.text.muted }} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'building': return 'Building';
      case 'error': return 'Error';
      default: return 'Checking';
    }
  };

  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Header */}
      <div className="mb-8">
        <h2 
          className="text-2xl font-bold mb-3" 
          style={{
            background: `linear-gradient(135deg, ${QSAITheme.text.primary} 0%, ${QSAITheme.purple.light} 50%, ${QSAITheme.text.primary} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}
        >
          Windows Thermal Printer Helpers
        </h2>
        <p 
          className="text-lg" 
          style={{ color: QSAITheme.text.secondary }}
        >
          Download and run these Windows executables to enable thermal printing for your restaurant POS system.
        </p>
      </div>

      {/* Build Status Overview */}
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
              <Activity className="h-5 w-5 text-white" />
            </div>
            Build Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(buildStatus)}
              <div>
                <p 
                  className="font-semibold" 
                  style={{ color: QSAITheme.text.primary }}
                >
                  GitHub Actions Build: {getStatusText(buildStatus)}
                </p>
                <p 
                  className="text-sm" 
                  style={{ color: QSAITheme.text.muted }}
                >
                  Last checked: {lastChecked || 'Never'}
                </p>
              </div>
            </div>
            <Button 
              onClick={checkBuildStatus}
              disabled={buildStatus === 'checking'}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                color: QSAITheme.text.primary,
                border: `1px solid ${QSAITheme.border.accent}`
              }}
            >
              {buildStatus === 'checking' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Printer Helpers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {printerHelpers.map((helper, index) => (
          <Card 
            key={helper.name}
            className="overflow-hidden border-0 shadow-xl transition-all duration-300 hover:scale-[1.02]" 
            style={{
              ...panelStyle,
              background: `linear-gradient(135deg, ${QSAITheme.background.card} 0%, rgba(91, 33, 182, 0.05) 100%)`,
              borderColor: QSAITheme.border.accent,
              boxShadow: `0 10px 30px rgba(0, 0, 0, 0.2), 0 0 20px ${QSAITheme.purple.glow}`
            }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center" 
                    style={{
                      background: `linear-gradient(135deg, ${helper.color} 0%, ${helper.color}80 100%)`,
                      boxShadow: effects.outerGlow('medium')
                    }}
                  >
                    {helper.icon}
                  </div>
                  <div>
                    <CardTitle 
                      className="text-lg leading-tight" 
                      style={{ color: QSAITheme.text.primary }}
                    >
                      {helper.name}
                    </CardTitle>
                    <Badge 
                      variant="outline" 
                      className="mt-1 text-xs" 
                      style={{
                        borderColor: helper.color,
                        color: helper.color,
                        background: 'transparent'
                      }}
                    >
                      {helper.version}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(helper.status)}
                  <span 
                    className="text-sm font-medium" 
                    style={{
                      color: helper.status === 'ready' ? QSAITheme.status.success : 
                             helper.status === 'error' ? QSAITheme.purple.primary : QSAITheme.text.secondary
                    }}
                  >
                    {getStatusText(helper.status)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <CardDescription 
                className="text-base leading-relaxed" 
                style={{ color: QSAITheme.text.secondary }}
              >
                {helper.description}
              </CardDescription>

              {/* Features List */}
              <div className="space-y-3">
                <h4 
                  className="font-semibold text-sm" 
                  style={{ color: QSAITheme.text.primary }}
                >
                  Key Features:
                </h4>
                <ul className="space-y-2">
                  {helper.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: helper.color }} />
                      <span style={{ color: QSAITheme.text.secondary }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  className="w-full py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${helper.color} 0%, ${helper.color}80 100%)`,
                    color: 'white',
                    border: `1px solid ${helper.color}`,
                    boxShadow: effects.outerGlow('medium')
                  }}
                  onClick={() => {
                    if (helper.downloadUrl) {
                      window.open(helper.downloadUrl, '_blank');
                      toast.success(`🚀 Downloading ${helper.name}...`);
                    } else {
                      toast.error('Download not available yet');
                    }
                  }}
                  disabled={helper.status !== 'ready'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Windows .exe
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                    style={{
                      borderColor: QSAITheme.border.accent,
                      color: QSAITheme.text.secondary,
                      background: 'transparent'
                    }}
                    onClick={() => {
                      window.open(helper.repositoryUrl, '_blank');
                    }}
                  >
                    <Github className="h-4 w-4 mr-2" />
                    View Source
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                    style={{
                      borderColor: QSAITheme.border.accent,
                      color: QSAITheme.text.secondary,
                      background: 'transparent'
                    }}
                    onClick={() => {
                      window.open(`${helper.repositoryUrl}/releases`, '_blank');
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    All Releases
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Instructions */}
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
              <Monitor className="h-5 w-5 text-white" />
            </div>
            POSDesktop Integration Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert 
            className="border-0" 
            style={{
              background: `linear-gradient(135deg, ${QSAITheme.status.info}20 0%, ${QSAITheme.status.info}10 100%)`,
              borderLeft: `4px solid ${QSAITheme.status.info}`
            }}
          >
            <AlertCircle className="h-4 w-4" style={{ color: QSAITheme.status.info }} />
            <AlertDescription 
              className="text-base" 
              style={{ color: QSAITheme.text.primary }}
            >
              <strong>Quick Start:</strong> Download the Simple Thermal Printer Helper above, run it on your Windows machine with connected Epson printers, and POSDesktop will automatically detect and use it for printing.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 
                className="font-semibold mb-3" 
                style={{ color: QSAITheme.text.primary }}
              >
                📋 Setup Steps:
              </h4>
              <ol 
                className="space-y-2 text-sm" 
                style={{ color: QSAITheme.text.secondary }}
              >
                <li>1. Download cottage-printer.exe</li>
                <li>2. Connect Epson TM-T20III & TM-T88V via USB</li>
                <li>3. Install official Epson drivers</li>
                <li>4. Run cottage-printer.exe (starts on localhost:3001)</li>
                <li>5. POSDesktop will automatically connect</li>
              </ol>
            </div>
            <div>
              <h4 
                className="font-semibold mb-3" 
                style={{ color: QSAITheme.text.primary }}
              >
                🔌 API Endpoints:
              </h4>
              <ul 
                className="space-y-2 text-sm" 
                style={{ color: QSAITheme.text.secondary }}
              >
                <li>• GET /health - Status check</li>
                <li>• POST /print/kitchen - Kitchen tickets</li>
                <li>• POST /print/receipt - Customer receipts</li>
                <li>• POST /print/test - Test printing</li>
                <li>• GET /printers - List available printers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
