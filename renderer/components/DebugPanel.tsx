import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DebugPanelProps {
  onClose?: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ onClose }) => {
  const [conversionAttempts, setConversionAttempts] = useState<any[]>([]);
  const [renderIssues, setRenderIssues] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Get debugging data from window if available
    const updateDebugData = () => {
      try {
        if ((window as any).debugUtils) {
          // This would be expanded to get actual debugging data
          console.log('🔧 [DebugPanel] Updating debug data...');
        }
      } catch (error) {
        console.error('🔧 [DebugPanel] Error updating debug data:', error);
      }
    };

    updateDebugData();
    const interval = setInterval(updateDebugData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTestConversion = () => {
    try {
      const testObj = { test: 'value', created_at: new Date() };
      const result = String(testObj);
      console.log('✅ Test conversion successful:', result);
    } catch (error) {
      console.error('❌ Test conversion failed:', error);
    }
  };

  const handleClearLogs = () => {
    setConversionAttempts([]);
    setRenderIssues([]);
    setErrors([]);
    console.clear();
    console.log('🔧 [DebugPanel] Debug data cleared');
  };

  if (!isVisible) {
    return (
      <Button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
        variant="outline"
        size="sm"
      >
        🔧 Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 bg-white shadow-lg border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">🔧 Object-to-Primitive Debugger</CardTitle>
          <div className="flex gap-1">
            <Button 
              onClick={() => setIsVisible(false)}
              variant="ghost" 
              size="sm"
              className="h-6 w-6 p-0"
            >
              −
            </Button>
            {onClose && (
              <Button 
                onClick={onClose}
                variant="ghost" 
                size="sm"
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="status" className="text-xs">Status</TabsTrigger>
            <TabsTrigger value="errors" className="text-xs">Errors</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="mt-2">
            <div className="space-y-2">
              <Alert>
                <AlertDescription className="text-xs">
                  <div className="flex items-center justify-between">
                    <span>Debug Mode: Active</span>
                    <Badge variant="secondary">🔧</Badge>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-blue-50 rounded">
                  <div className="font-medium">Conversions</div>
                  <div className="text-blue-600">{conversionAttempts.length}</div>
                </div>
                <div className="p-2 bg-red-50 rounded">
                  <div className="font-medium">Errors</div>
                  <div className="text-red-600">{errors.length}</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="errors" className="mt-2">
            <div className="space-y-1 max-h-32 overflow-auto">
              {errors.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-2">
                  No errors detected
                </div>
              ) : (
                errors.map((error, index) => (
                  <div key={index} className="text-xs p-2 bg-red-50 rounded border">
                    <div className="font-medium text-red-700">{error.type}</div>
                    <div className="text-red-600 truncate">{error.message}</div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tools" className="mt-2">
            <div className="space-y-2">
              <Button 
                onClick={handleTestConversion}
                size="sm"
                className="w-full text-xs"
                variant="outline"
              >
                Test Conversion
              </Button>
              <Button 
                onClick={handleClearLogs}
                size="sm"
                className="w-full text-xs"
                variant="outline"
              >
                Clear Logs
              </Button>
              <Button 
                onClick={() => console.log('🔧 Current page state:', window.location.href)}
                size="sm"
                className="w-full text-xs"
                variant="outline"
              >
                Log Page State
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
