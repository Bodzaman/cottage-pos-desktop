import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wifi, Printer, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';
import { cardStyle } from '../utils/designSystem';

// Global types for ePOS SDK
declare global {
  interface Window {
    ePOSDevice: any;
  }
}

interface BrowserPrinterStatus {
  sdk_loaded: boolean;
  connected: boolean;
  ip_address?: string;
  port?: number;
  last_test?: string;
}

export function BrowserEpsonPrinter() {
  const [browserPrinter, setBrowserPrinter] = useState<BrowserPrinterStatus>({
    sdk_loaded: false,
    connected: false
  });
  const [printerIP, setPrinterIP] = useState('192.168.1.100');
  const [printerPort, setPrinterPort] = useState(8008);
  const [connectingBrowser, setConnectingBrowser] = useState(false);
  const [testingBrowser, setTestingBrowser] = useState(false);

  // Check if browser SDK is available
  useEffect(() => {
    const checkSDK = () => {
      const sdkLoaded = typeof window !== 'undefined' && !!window.ePOSDevice;
      setBrowserPrinter(prev => ({ ...prev, sdk_loaded: sdkLoaded }));
      
      if (sdkLoaded) {
        console.log('✅ Epson ePOS SDK available');
        toast.success('Browser SDK ready for network printing!');
      } else {
        console.log('⚠️ Epson ePOS SDK not detected - using mock');
      }
    };
    
    checkSDK();
    const timer = setTimeout(checkSDK, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Browser-based connection
  const connectBrowserPrinter = async () => {
    if (typeof window === 'undefined' || !window.ePOSDevice) {
      toast.error('Epson SDK not loaded. Please refresh the page.');
      return;
    }

    setConnectingBrowser(true);
    try {
      const device = new window.ePOSDevice();
      const url = `http://${printerIP}:${printerPort}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`;
      
      await new Promise((resolve, reject) => {
        device.connect(url, (data: any) => {
          if (data === 'OK') {
            resolve(data);
          } else {
            reject(new Error(`Connection failed: ${data}`));
          }
        });
      });

      setBrowserPrinter({
        sdk_loaded: true,
        connected: true,
        ip_address: printerIP,
        port: printerPort,
        last_test: undefined
      });

      toast.success(`✅ Connected to Epson printer at ${printerIP}:${printerPort}`);
    } catch (error) {
      console.error('Browser connection failed:', error);
      toast.error(`Connection failed: ${error}`);
      setBrowserPrinter(prev => ({ ...prev, connected: false }));
    } finally {
      setConnectingBrowser(false);
    }
  };

  // Browser-based test print
  const testBrowserPrint = async () => {
    if (!browserPrinter.connected) {
      toast.error('Please connect to printer first');
      return;
    }

    setTestingBrowser(true);
    try {
      const device = new window.ePOSDevice();
      const printer = device.createDevice('local_printer', device.DEVICE_TYPE_PRINTER, {
        'crypto': false,
        'buffer': false
      });

      // Format receipt
      printer.addTextAlign(printer.ALIGN_CENTER);
      printer.addTextSize(2, 2);
      printer.addText('COTTAGE TANDOORI\n');
      printer.addTextSize(1, 1);
      printer.addText('Browser SDK Test Print\n');
      
      printer.addTextAlign(printer.ALIGN_LEFT);
      const lines = [
        'Test Receipt #' + Date.now(),
        '',
        '1x Chicken Tikka Masala     £12.95',
        '1x Basmati Rice             £3.50',
        '1x Naan Bread               £2.95',
        '',
        'Subtotal:                   £19.40',
        'Tax (VAT 20%):              £3.88',
        'Total:                      £23.28',
        '',
        'Thank you for dining with us!',
        'Visit: www.cottagetandoori.co.uk',
        '',
        new Date().toLocaleString()
      ];
      
      lines.forEach(line => {
        if (line.includes('Thank you')) {
          printer.addTextAlign(printer.ALIGN_CENTER);
        }
        printer.addText(line + '\n');
      });
      
      printer.addCut(printer.CUT_FEED);

      await new Promise((resolve, reject) => {
        printer.send((response: any) => {
          if (response.success) {
            resolve(true);
          } else {
            reject(new Error(`Print failed: ${response.code || 'Unknown error'}`));
          }
        });
      });
      
      setBrowserPrinter(prev => ({ ...prev, last_test: new Date().toLocaleTimeString() }));
      toast.success('✅ Browser test print sent successfully!');
    } catch (error) {
      console.error('Browser print failed:', error);
      toast.error(`Print failed: ${error}`);
    } finally {
      setTestingBrowser(false);
    }
  };

  return (
    <Card style={{
      ...cardStyle,
      borderColor: browserPrinter.sdk_loaded ? `rgba(34, 197, 94, 0.3)` : `rgba(124, 93, 250, 0.3)`,
      background: `linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(26, 26, 26, 0.95) 100%)`
    }}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wifi className="h-5 w-5" style={{ color: browserPrinter.sdk_loaded ? globalColors.status.success : globalColors.purple.light }} />
          Browser-Based Network Printing (Official Epson SDK)
          {browserPrinter.sdk_loaded ? (
            <Badge variant="outline" style={{ borderColor: globalColors.status.success, color: globalColors.status.success }}>
              SDK Ready
            </Badge>
          ) : (
            <Badge variant="outline" style={{ borderColor: globalColors.text.muted, color: globalColors.text.muted }}>
              Using Mock
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="printer-ip" className="text-white">Printer IP Address</Label>
            <Input
              id="printer-ip"
              value={printerIP}
              onChange={(e) => setPrinterIP(e.target.value)}
              placeholder="192.168.1.100"
              className="bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="printer-port" className="text-white">Port</Label>
            <Input
              id="printer-port"
              type="number"
              value={printerPort}
              onChange={(e) => setPrinterPort(parseInt(e.target.value) || 8008)}
              placeholder="8008"
              className="bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Actions</Label>
            <div className="flex gap-2">
              <Button 
                onClick={connectBrowserPrinter}
                disabled={connectingBrowser}
                size="sm"
                className="flex-1 bg-[rgba(34,197,94,0.2)] text-white hover:bg-[rgba(34,197,94,0.3)] border-[rgba(34,197,94,0.3)]"
              >
                {connectingBrowser ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : browserPrinter.connected ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Wifi className="h-4 w-4" />
                )}
              </Button>
              <Button 
                onClick={testBrowserPrint}
                disabled={!browserPrinter.connected || testingBrowser}
                size="sm"
                className="flex-1 bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)] border-[rgba(124,93,250,0.3)]"
              >
                {testingBrowser ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {browserPrinter.connected && (
          <div className="flex items-center gap-4 p-3 rounded" style={{
            backgroundColor: `rgba(34, 197, 94, 0.1)`,
            border: `1px solid rgba(34, 197, 94, 0.3)`
          }}>
            <CheckCircle className="h-5 w-5" style={{ color: globalColors.status.success }} />
            <div>
              <p className="text-white font-medium">Connected to {browserPrinter.ip_address}:{browserPrinter.port}</p>
              <p className="text-sm" style={{ color: globalColors.text.muted }}>
                {browserPrinter.last_test ? `Last test: ${browserPrinter.last_test}` : 'Ready for printing'}
              </p>
            </div>
          </div>
        )}
        
        {!browserPrinter.sdk_loaded && (
          <div className="flex items-start gap-3 p-3 rounded" style={{
            backgroundColor: `rgba(124, 93, 250, 0.1)`,
            border: `1px solid rgba(124, 93, 250, 0.3)`
          }}>
            <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: globalColors.purple.light }} />
            <div>
              <p className="text-white font-medium">Using Mock SDK</p>
              <p className="text-sm" style={{ color: globalColors.text.muted }}>
                Upload official epos-2.27.0.js file for real printer communication.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}