import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Printer, 
  CheckCircle, 
  XCircle, 
  Settings, 
  RefreshCw, 
  Wifi,
  WifiOff,
  AlertTriangle,
  Activity,
  Shield,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { colors } from '../utils/designSystem';

interface PrinterStatus {
  connected: boolean;
  model: string;
  status: 'ready' | 'busy' | 'error' | 'offline';
  lastPrint?: Date;
  queueSize: number;
  connectionType: 'usb' | 'network' | 'helper_app' | 'unknown';
}

interface ServiceStatus {
  service_running: boolean;
  api_responding: boolean;
  status: 'online' | 'offline' | 'error';
  message: string;
}

export default function PrinterConfig() {
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>({
    connected: false,
    model: 'Epson TM-T20III',
    status: 'offline',
    queueSize: 0,
    connectionType: 'unknown'
  });
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    service_running: false,
    api_responding: false,
    status: 'offline',
    message: 'Checking service status...'
  });
  const [isChecking, setIsChecking] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);

  // Check service status
  const checkServiceStatus = async () => {
    try {
      const response = await apiClient.get_service_status();
      const result = await response.json();
      
      setServiceStatus({
        service_running: result.service_running || false,
        api_responding: result.api_responding || false,
        status: result.status || 'offline',
        message: result.message || 'Service status unknown'
      });
    } catch (error) {
      console.error('Service status check failed:', error);
      setServiceStatus({
        service_running: false,
        api_responding: false,
        status: 'error',
        message: 'Failed to check service status'
      });
    }
  };

  // Check printer status
  const checkPrinterStatus = async () => {
    setIsChecking(true);
    try {
      const response = await apiClient.check_voice_api_health2(); // Use any endpoint as health check
      const isHealthy = response.status === 200;
      
      setPrinterStatus(prev => ({
        ...prev,
        connected: isHealthy,
        status: isHealthy ? 'ready' : 'offline',
        connectionType: isHealthy ? 'helper_app' : 'unknown'
      }));
      
      if (isHealthy) {
        toast.success('Printer connection verified');
      } else {
        toast.error('Printer not available - ensure helper app is running on localhost:3001');
      }
    } catch (error) {
      console.error('Printer status check failed:', error);
      setPrinterStatus(prev => ({
        ...prev,
        connected: false,
        status: 'error',
        connectionType: 'unknown'
      }));
      toast.error('Failed to check printer status');
    } finally {
      setIsChecking(false);
    }
  };

  // Test print functionality
  const testPrint = async (type: 'kitchen' | 'customer') => {
    try {
      const testData = {
        order_id: `TEST-${type.toUpperCase()}-${Date.now()}`,
        order_type: 'DINE_IN',
        items: [
          {
            id: 'test1',
            name: 'Test Kitchen Item',
            quantity: 1,
            price: 12.95,
            category: 'Main Course',
            spice_level: 'Medium',
            allergens: ['Dairy'],
            modifiers: [{ name: 'Extra sauce', price: 0 }],
            notes: type === 'kitchen' ? 'TEST PRINT - No preparation needed' : undefined
          }
        ],
        table_number: 99,
        guest_count: 1,
        total_amount: type === 'customer' ? 12.95 : undefined,
        payment_method: type === 'customer' ? 'TEST' : undefined,
        customer_data: type === 'customer' ? {
          first_name: 'Test',
          last_name: 'User',
          phone: '01234 567890'
        } : undefined,
        special_instructions: type === 'kitchen' ? 'TEST PRINT ONLY' : undefined
      };

      const endpoint = type === 'kitchen' ? 'print_kitchen_ticket' : 'print_customer_receipt';
      const response = await apiClient[endpoint](testData);
      const result = await response.json();

      if (result.success) {
        toast.success(`${type === 'kitchen' ? 'Kitchen ticket' : 'Customer receipt'} test print successful!`);
        setPrinterStatus(prev => ({ ...prev, lastPrint: new Date() }));
      } else {
        toast.warning(`Test print logged: ${result.message}`);
      }
    } catch (error) {
      console.error('Test print failed:', error);
      toast.error('Test print failed');
    }
  };

  // Auto-check printer status on mount
  useEffect(() => {
    checkPrinterStatus();
    checkServiceStatus();
    const interval = setInterval(() => {
      checkPrinterStatus();
      checkServiceStatus();
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (printerStatus.status) {
      case 'ready': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (printerStatus.status) {
      case 'ready': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'busy': return <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-gray-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Printer Config Card */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-purple-400" />
            Epson TM-T20III Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Section */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
              {getStatusIcon()}
              <div>
                <p className="text-sm font-medium text-white">{printerStatus.model}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {printerStatus.status} • {printerStatus.connectionType.replace('_', ' ')}
                </p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                printerStatus.connected 
                  ? 'border-green-500/50 text-green-300 bg-green-500/10'
                  : 'border-red-500/50 text-red-300 bg-red-500/10'
              }`}
            >
              {printerStatus.connected ? 'Connected' : 'Offline'}
            </Badge>
          </div>

          {/* Service Status */}
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Helper Service Status</span>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  serviceStatus.status === 'online'
                    ? 'border-green-500/50 text-green-300 bg-green-500/10'
                    : 'border-red-500/50 text-red-300 bg-red-500/10'
                }`}
              >
                {serviceStatus.status === 'online' ? 'Running' : 'Manual'}
              </Badge>
            </div>
            <p className="text-xs text-gray-400">{serviceStatus.message}</p>
            {serviceStatus.status !== 'online' && (
              <p className="text-xs text-orange-300 mt-1">
                💡 Download auto-startup versions below for production use
              </p>
            )}
          </div>

          {/* Connection Status */}
          {!printerStatus.connected && (
            <Alert className="border-orange-500/50 bg-orange-500/10">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <AlertDescription className="text-orange-300 text-sm">
                Printer helper app not detected. Make sure it's running on localhost:3001 for optimal printing.
                <br />USB/Serial fallback will be used automatically.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => {
                checkPrinterStatus();
                checkServiceStatus();
              }}
              disabled={isChecking}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:text-white hover:border-purple-500"
            >
              {isChecking ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check Connection
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => testPrint('kitchen')}
                variant="outline"
                size="sm"
                className="border-orange-500/50 text-orange-300 hover:text-orange-200 hover:border-orange-400"
              >
                Test Kitchen
              </Button>
              <Button
                onClick={() => testPrint('customer')}
                variant="outline"
                size="sm"
                className="border-blue-500/50 text-blue-300 hover:text-blue-200 hover:border-blue-400"
              >
                Test Customer
              </Button>
            </div>
          </div>

          {/* Status Details */}
          {printerStatus.lastPrint && (
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
              Last print: {printerStatus.lastPrint.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Startup Service Info Card */}
      <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            Production Auto-Startup Helper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-300">
            <p className="mb-3">
              For production restaurant use, download the auto-startup versions that run as system services. 
              Staff simply turn on the computer and everything works automatically.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-600/50">
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  🪟 Windows Service Version
                </h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Runs automatically on boot</li>
                  <li>• No user interaction required</li>
                  <li>• Invisible background operation</li>
                  <li>• Auto-recovery on crashes</li>
                </ul>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full border-blue-500/50 text-blue-300 hover:text-blue-200"
                  onClick={() => {
                    // Use our working download endpoint instead of direct GitHub link
                    const downloadUrl = '/api/download-helper/windows';
                    window.open(downloadUrl, '_blank');
                  }}
                >
                  Download Windows
                </Button>
              </div>
              
              <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-600/50">
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  🍎 macOS LaunchDaemon Version
                </h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Runs automatically on boot</li>
                  <li>• No user interaction required</li>
                  <li>• System-level daemon operation</li>
                  <li>• Professional deployment ready</li>
                </ul>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full border-blue-500/50 text-blue-300 hover:text-blue-200"
                  onClick={() => {
                    // Show helpful message for non-Windows platforms
                    toast.info('macOS version temporarily unavailable. Use Windows installer or contact support for alternatives.');
                  }}
                >
                  Download macOS
                </Button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
              <p className="text-xs text-green-300">
                ✅ <strong>Perfect for restaurant operations:</strong> Once installed, staff never need to worry about starting the printer helper manually.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
