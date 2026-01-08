

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { QSAITheme } from '../utils/QSAIDesign';

interface PrinterStatus {
  test_system_ready: boolean;
  available_printers: Array<{
    name: string;
    driver?: string;
    status?: string;
    available?: boolean;
  }>;
  default_printer?: string;
  last_check: string;
  message?: string;
}

interface TestResult {
  success: boolean;
  message: string;
  details: any;
  timestamp: string;
}

export default function ThermalPrinterTestHarness() {
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Global hotkey listener for test print
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Ctrl+Shift+T for test print (hidden hotkey)
      if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        handleTestPrint();
        toast.info('🔥 Test print triggered by hotkey (Ctrl+Shift+T)');
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const checkPrinterStatus = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get_thermal_test_status();
      const data = await response.json();
      setPrinterStatus({
        test_system_ready: data.test_system_ready,
        available_printers: [],
        last_check: data.timestamp,
        message: data.message
      });
      
      if (data.test_system_ready) {
        toast.success('✅ Printer system ready');
      } else {
        toast.info('ℹ️ Desktop app integration pending');
      }
    } catch (error) {
      toast.error('Failed to check printer status');
      console.error('Status check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPrint = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.thermal_test_print({
        test_type: 'sample_receipt'
      });
      
      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        toast.success('✅ Test print completed!');
      } else {
        toast.info('ℹ️ ' + result.message);
      }
    } catch (error) {
      toast.error('Test print failed');
      console.error('Test print error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDesktopApp = async () => {
    try {
      toast.info('Desktop app will be available in future releases');
      
      const instructions = `
Desktop POS App Setup (Future Release):

1. Professional Windows desktop application
2. Native thermal printer integration
3. Epson TM-T20III & TM-T88V support
4. Offline POS functionality
5. Test print hotkey: Ctrl+Shift+P
      `;
      
      console.log(instructions);
      toast.success('Setup instructions logged to console');
    } catch (error) {
      toast.error('Download information not available');
    }
  };

  const renderStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'} className="flex items-center gap-1">
        {status ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Thermal Printer Test Harness</h2>
        <div className="flex gap-2">
          <Button onClick={checkPrinterStatus} disabled={isLoading}>
            <Printer className="w-4 h-4 mr-2" />
            Check Status
          </Button>
          <Button onClick={downloadDesktopApp} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Desktop App Info
          </Button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Hidden Hotkey:</strong> Press <kbd className="px-2 py-1 bg-muted rounded">Ctrl+Shift+T</kbd> to trigger test print from anywhere in the app.
        </AlertDescription>
      </Alert>

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Button 
          onClick={handleTestPrint} 
          disabled={isLoading}
          className="h-16 text-lg"
        >
          <Printer className="w-6 h-6 mr-3" />
          Test Print Sample Receipt
        </Button>
      </div>

      {/* Status Display */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Printer className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {printerStatus ? (
            <>
              <div className="flex items-center justify-between">
                <span>Desktop App:</span>
                {renderStatusBadge(printerStatus.test_system_ready, 
                  printerStatus.test_system_ready ? 'Ready' : 'Pending'
                )}
              </div>
              
              {printerStatus.message && (
                <div className="text-sm text-gray-400">
                  {printerStatus.message}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span>Last Check:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(printerStatus.last_check).toLocaleTimeString()}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Click "Check Status" to verify system readiness
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? 'Success' : 'Pending'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {testResult.message}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(testResult.timestamp).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Setup Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Printer Setup</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Install Epson TM-T20III or TM-T88V</li>
                <li>• Set as default printer in Windows</li>
                <li>• Test print from Windows first</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Desktop App (Future)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Professional Windows desktop application</li>
                <li>• Native thermal printer integration</li>
                <li>• Full POS functionality</li>
                <li>• Offline support</li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <h4 className="font-medium mb-3">Troubleshooting</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>"Print failed":</strong>
                <br />Ensure printer is online, has paper, and Windows spooler is running
              </div>
              <div>
                <strong>"Desktop app not ready":</strong>
                <br />Professional desktop application will be available in future releases
              </div>
              <div>
                <strong>"Permission denied":</strong>
                <br />Run desktop app as Administrator when available
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
