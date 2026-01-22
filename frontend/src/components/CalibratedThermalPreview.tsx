
/**
 * Calibrated Thermal Preview Component
 * Provides pixel-perfect preview matching actual thermal printer output
 */

import React from 'react';
import { 
  getCalibratedConfig, 
  getThermalPreviewCSS, 
  getPreviewAccuracyInfo,
  CalibratedThermalConfig
} from 'utils/thermalCalibration';
import { parseAndFormatEnhanced, validateAlignment } from 'utils/enhancedThermalFormatting';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface CalibratedThermalPreviewProps {
  content: string;
  paperWidth: 58 | 80;
  fillStyle: 'dots' | 'spaces';
  showAlignment?: boolean;
  showAccuracy?: boolean;
  showDebugInfo?: boolean; // New prop for debug mode
  className?: string;
}

export const CalibratedThermalPreview: React.FC<CalibratedThermalPreviewProps> = ({
  content,
  paperWidth,
  fillStyle,
  showAlignment = false,
  showAccuracy = false, // Default to false for clean UX
  showDebugInfo = false, // New debug mode - default false
  className = ''
}) => {
  const config = getCalibratedConfig(paperWidth, fillStyle);
  const formattedContent = parseAndFormatEnhanced(content, paperWidth, fillStyle);
  const previewCSS = getThermalPreviewCSS(config);
  const accuracyInfo = getPreviewAccuracyInfo(config);
  const validation = validateAlignment(formattedContent, config);
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Accuracy Information - Only show in debug mode */}
      {showDebugInfo && showAccuracy && (
        <Card className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" />
                Preview Accuracy
              </h4>
              <Badge variant={validation.isValid ? 'default' : 'destructive'}>
                {validation.isValid ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Perfect</>
                ) : (
                  <><AlertTriangle className="h-3 w-3 mr-1" /> Issues</>
                )}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Paper Width:</span>
                  <span className="font-mono">{accuracyInfo.paperWidth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Characters:</span>
                  <span className="font-mono">{accuracyInfo.totalChars}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Char Width:</span>
                  <span className="font-mono">{accuracyInfo.charWidth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
                  <span className="font-mono text-green-600">{accuracyInfo.accuracy}</span>
                </div>
              </div>
            </div>
            {!validation.isValid && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">Alignment Issues:</p>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
                  {validation.issues.map((issue, idx) => (
                    <li key={idx}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Column Alignment Guide - Only show in debug mode */}
      {showDebugInfo && showAlignment && (
        <div className="text-xs font-mono text-gray-500 dark:text-gray-400 space-y-1">
          <div>Column Layout: Qty({config.columns.qty_width}) | Item({config.columns.item_width}) | Price({config.columns.price_width})</div>
          <div>Positions: {config.columns.qty_start}-{config.columns.qty_end} | {config.columns.item_start}-{config.columns.item_end} | {config.columns.price_start}-{config.columns.price_end}</div>
          <div className="border-t pt-1">
            {''.padEnd(config.columns.qty_end, '1').padEnd(config.columns.item_end, '2').padEnd(config.total_chars, '3')}
          </div>
        </div>
      )}
      
      {/* Calibrated Thermal Preview */}
      <div className="relative">
        <div 
          style={previewCSS}
          className="relative"
        >
          {formattedContent}
        </div>
        
        {/* Visual alignment indicators */}
        {showAlignment && (
          <div 
            className="absolute top-0 left-0 right-0 pointer-events-none opacity-30"
            style={{ height: '100%' }}
          >
            {/* Quantity column indicator */}
            <div 
              className="absolute top-0 bottom-0 bg-blue-200"
              style={{
                left: `${(config.columns.qty_start / config.total_chars) * 100}%`,
                width: `${(config.columns.qty_width / config.total_chars) * 100}%`
              }}
            />
            {/* Item column indicator */}
            <div 
              className="absolute top-0 bottom-0 bg-green-200"
              style={{
                left: `${(config.columns.item_start / config.total_chars) * 100}%`,
                width: `${(config.columns.item_width / config.total_chars) * 100}%`
              }}
            />
            {/* Price column indicator */}
            <div 
              className="absolute top-0 bottom-0 bg-red-200"
              style={{
                left: `${(config.columns.price_start / config.total_chars) * 100}%`,
                width: `${(config.columns.price_width / config.total_chars) * 100}%`
              }}
            />
          </div>
        )}
      </div>
      
      {/* Font Information */}
      {showAccuracy && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>Font: {config.preview_css.fontFamily.split(',')[0]} • Size: {config.preview_css.fontSize}</div>
          <div>{accuracyInfo.note}</div>
        </div>
      )}
    </div>
  );
};

export default CalibratedThermalPreview;
