

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cardStyle } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';

interface PrinterTestSectionProps {
  onHealthCheck: () => void;
}

export function PrinterTestSection({ onHealthCheck }: PrinterTestSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card style={cardStyle} className="border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                🖨️ Printer Testing
              </CardTitle>
              <p className="text-sm mt-1" style={{ color: '#BBC3E1' }}>
                Test printing functionality with QSAI Printer Helper app
              </p>
            </div>
            <Button 
              onClick={onHealthCheck}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              style={{
                borderColor: 'rgba(124, 93, 250, 0.3)',
                backgroundColor: 'rgba(124, 93, 250, 0.1)',
                color: '#7C5DFA'
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-lg border border-blue-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                ℹ️
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Helper App Required</h4>
                <p className="text-sm" style={{ color: '#BBC3E1' }}>
                  The QSAI Printer Helper must be running on localhost:3001 to enable printing.
                  Download and start the helper app if you haven't already.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Helper App Integration */}
      <Card style={cardStyle} className="border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">System Printer Helper</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">System printer integration will be implemented in the professional desktop POS application.</p>
            <p className="text-sm text-gray-500">Ready for systematic desktop development approach.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
