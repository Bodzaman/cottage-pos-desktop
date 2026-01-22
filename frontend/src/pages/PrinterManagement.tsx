import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, Printer, TestTube } from 'lucide-react';
import PrinterConfig from 'components/PrinterConfig';

export default function PrinterManagement() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
      {/* Header */}
      <div className="border-b border-gray-700/50 backdrop-blur-lg bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-6 h-6 text-purple-400" />
                  <h1 className="text-xl font-bold text-white">Printer Management</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Overview */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Epson TM-T20III Receipt Printer
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure and test your thermal receipt printer for kitchen tickets and customer receipts.
              The system automatically categorizes menu items into 7 sections for optimized kitchen workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Printer Configuration */}
              <div className="space-y-4">
                <PrinterConfig />
              </div>
              
              {/* Print Templates Info */}
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-green-400" />
                    Template Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-orange-300">🔥 Kitchen Tickets</h4>
                    <ul className="text-xs text-gray-400 space-y-1 ml-2">
                      <li>• Section-grouped items (7 categories)</li>
                      <li>• Allergen warnings & spice levels</li>
                      <li>• Preparation times & special notes</li>
                      <li>• Table numbers & guest counts</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-300">🧾 Customer Receipts</h4>
                    <ul className="text-xs text-gray-400 space-y-1 ml-2">
                      <li>• Professional invoice format</li>
                      <li>• Itemized pricing & totals</li>
                      <li>• Payment method details</li>
                      <li>• Customer information</li>
                    </ul>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-600">
                    <p className="text-xs text-gray-500">
                      Templates automatically switch between Kitchen and Customer modes based on POSDesktop workflow.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Printer Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-300">Hardware</h4>
                <ul className="text-gray-400 space-y-1">
                  <li>Model: Epson TM-T20III</li>
                  <li>Paper: 80mm thermal</li>
                  <li>Resolution: 203 x 203 DPI</li>
                  <li>Speed: 250 mm/sec</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-300">Connectivity</h4>
                <ul className="text-gray-400 space-y-1">
                  <li>USB Type-B</li>
                  <li>RS-232 Serial</li>
                  <li>Helper App (preferred)</li>
                  <li>Direct USB fallback</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-300">Features</h4>
                <ul className="text-gray-400 space-y-1">
                  <li>Real-time print queue</li>
                  <li>Error handling & retry</li>
                  <li>Template preview</li>
                  <li>Multi-printer ready</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
