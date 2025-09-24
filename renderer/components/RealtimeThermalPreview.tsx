
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CanvasElement } from 'utils/visualTemplateTypes';
import { debounce } from 'lodash';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer, Eye, Maximize2, RefreshCw, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface OrderData {
  order_id: string;
  order_type: string;
  customer_name: string;
  date: string;
  time: string;
  total: string;
  items: Array<{
    name: string;
    price: string;
    quantity: number;
  }>;
}

interface ThermalElement {
  id: string;
  content: string;
  charWidth: number;
  align: 'left' | 'center' | 'right';
  style: {
    bold: boolean;
    size: 'small' | 'normal' | 'large';
    doubleHeight: boolean;
    doubleWidth: boolean;
    underline?: boolean;
    inverse?: boolean;
  };
  spacing: {
    before: number;
    after: number;
  };
  type: 'text' | 'qr' | 'image' | 'separator';
  error?: string;
}

interface ConversionError {
  elementId: string;
  message: string;
  severity: 'warning' | 'error';
}

interface RealtimeThermalPreviewProps {
  elements: CanvasElement[];
  paperWidth: 58 | 80;
  orderData?: OrderData | null;
  onElementsChange?: (elements: CanvasElement[]) => void;
  updateTrigger?: number; // Force updates when manipulating elements
  className?: string;
}

const CHAR_WIDTHS = {
  58: 32, // Characters per line for 58mm paper
  80: 42  // Characters per line for 80mm paper
};

const THERMAL_FONTS = {
  small: { size: '8px', lineHeight: '1.0' },
  normal: { size: '10px', lineHeight: '1.1' },
  large: { size: '12px', lineHeight: '1.2' }
};

// QR Code generation (simple placeholder)
const generateQRPlaceholder = (data: string, size: number): string => {
  const qrSize = Math.min(size, 15); // Max 15 chars for thermal
  const qrLines = [];
  
  // Generate a simple QR-like pattern
  for (let i = 0; i < qrSize; i++) {
    let line = '';
    for (let j = 0; j < qrSize; j++) {
      // Simple pattern based on data hash
      const hash = (data.charCodeAt(j % data.length) + i + j) % 3;
      line += hash === 0 ? '█' : hash === 1 ? '▄' : '░';
    }
    qrLines.push(line);
  }
  
  return qrLines.join('\n');
};

// Image dithering simulation
const generateImageDither = (width: number, height: number): string => {
  const ditherLines = [];
  const patterns = ['█', '▓', '▒', '░', ' '];
  
  for (let i = 0; i < height; i++) {
    let line = '';
    for (let j = 0; j < width; j++) {
      // Simple dither pattern
      const intensity = Math.sin(i * 0.3) * Math.cos(j * 0.3);
      const patternIndex = Math.floor((intensity + 1) * 2.5);
      line += patterns[Math.min(patternIndex, patterns.length - 1)];
    }
    ditherLines.push(line);
  }
  
  return ditherLines.join('\n');
};

export default function RealtimeThermalPreview({
  elements,
  paperWidth,
  orderData,
  onElementsChange,
  updateTrigger,
  className
}: RealtimeThermalPreviewProps) {
  const [thermalElements, setThermalElements] = useState<ThermalElement[]>([]);
  const [conversionErrors, setConversionErrors] = useState<ConversionError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewKey, setPreviewKey] = useState(0); // Force re-renders
  const [renderTime, setRenderTime] = useState(0);
  const [processingStats, setProcessingStats] = useState({ elementsProcessed: 0, errorsFound: 0 });

  const charWidth = CHAR_WIDTHS[paperWidth];

  // Default order data for preview
  const defaultOrderData: OrderData = useMemo(() => ({
    order_id: 'CT-2024-001',
    order_type: 'COLLECTION',
    customer_name: 'Preview Customer',
    date: new Date().toLocaleDateString('en-GB'),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    total: '24.95',
    items: [
      { name: 'Chicken Tikka Masala', price: '12.95', quantity: 1 },
      { name: 'Garlic Naan', price: '3.50', quantity: 2 },
      { name: 'Basmati Rice', price: '2.95', quantity: 1 },
      { name: 'Mango Lassi', price: '2.50', quantity: 2 }
    ]
  }), []);

  const activeOrderData = orderData || defaultOrderData;

  // Enhanced thermal conversion engine with error handling
  const convertElementsToThermal = useCallback((canvasElements: CanvasElement[]): { elements: ThermalElement[], errors: ConversionError[] } => {
    const startTime = performance.now();
    const errors: ConversionError[] = [];
    
    // Sort elements by Y position (top to bottom)
    const sortedElements = [...canvasElements]
      .filter(el => el.visible)
      .sort((a, b) => a.y - b.y);
    
    const converted: ThermalElement[] = sortedElements.map((element) => {
      try {
        let content = element.data?.text || element.content || '';
        let elementType: 'text' | 'qr' | 'image' | 'separator' = 'text';
        
        // Detect element types
        if (content.toLowerCase().includes('qr:') || element.type === 'qr_code') {
          elementType = 'qr';
          const qrData = content.replace(/qr:/i, '').trim() || 'Sample QR Data';
          content = generateQRPlaceholder(qrData, Math.min(charWidth, 15));
        } else if (content.toLowerCase().includes('image:') || element.type === 'image') {
          elementType = 'image';
          const imgWidth = Math.min(charWidth, 20);
          const imgHeight = Math.min(10, Math.floor(imgWidth * 0.6));
          content = generateImageDither(imgWidth, imgHeight);
        } else if (content === '---' || content === '===' || element.type === 'separator') {
          elementType = 'separator';
          content = '='.repeat(charWidth);
        } else {
          // Replace dynamic fields with actual data
          content = replaceDynamicFields(content, activeOrderData);
        }
        
        // Validate content length
        const maxLength = charWidth * 10; // Max 10 lines per element
        if (content.length > maxLength) {
          errors.push({
            elementId: element.id,
            message: `Content too long (${content.length} chars, max ${maxLength})`,
            severity: 'warning'
          });
          content = content.substring(0, maxLength - 3) + '...';
        }
        
        // Text wrapping for long lines
        content = wrapText(content, charWidth);
        
        // Calculate spacing from position
        const spacingBefore = Math.max(0, Math.floor((element.style?.margin_top || 0) / 8));
        const spacingAfter = Math.max(0, Math.floor((element.style?.margin_bottom || 0) / 8));
        
        // Determine thermal styling
        const fontSize = element.style?.font_size || 12;
        const thermalSize = fontSize >= 16 ? 'large' : fontSize >= 12 ? 'normal' : 'small';
        
        return {
          id: element.id,
          content,
          charWidth,
          align: (element.style?.text_align as 'left' | 'center' | 'right') || 'left',
          style: {
            bold: element.style?.font_weight === 'bold',
            size: thermalSize,
            doubleHeight: fontSize >= 20,
            doubleWidth: fontSize >= 18,
            underline: element.style?.text_decoration === 'underline',
            inverse: element.style?.background_color !== 'transparent' && element.style?.background_color !== '#ffffff'
          },
          spacing: {
            before: spacingBefore,
            after: spacingAfter
          },
          type: elementType
        };
      } catch (error) {
        errors.push({
          elementId: element.id,
          message: `Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        });
        
        // Return fallback element
        return {
          id: element.id,
          content: '[ERROR: Could not render element]',
          charWidth,
          align: 'left' as const,
          style: {
            bold: false,
            size: 'normal' as const,
            doubleHeight: false,
            doubleWidth: false
          },
          spacing: { before: 0, after: 1 },
          type: 'text' as const,
          error: `Conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
    
    const endTime = performance.now();
    setRenderTime(endTime - startTime);
    setProcessingStats({ elementsProcessed: sortedElements.length, errorsFound: errors.length });
    
    return { elements: converted, errors };
  }, [charWidth, activeOrderData]);

  // Text wrapping utility
  const wrapText = (text: string, maxWidth: number): string => {
    const lines = text.split('\n');
    const wrappedLines: string[] = [];
    
    lines.forEach(line => {
      if (line.length <= maxWidth) {
        wrappedLines.push(line);
      } else {
        // Word wrap
        const words = line.split(' ');
        let currentLine = '';
        
        words.forEach(word => {
          if ((currentLine + word).length <= maxWidth) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) wrappedLines.push(currentLine);
            currentLine = word.length <= maxWidth ? word : word.substring(0, maxWidth - 3) + '...';
          }
        });
        
        if (currentLine) wrappedLines.push(currentLine);
      }
    });
    
    return wrappedLines.join('\n');
  };

  // Debounced conversion to prevent excessive updates
  const debouncedConvert = useMemo(
    () => debounce((elements: CanvasElement[]) => {
      setIsProcessing(true);
      const { elements: converted, errors } = convertElementsToThermal(elements);
      setThermalElements(converted);
      setConversionErrors(errors);
      setPreviewKey(prev => prev + 1);
      setIsProcessing(false);
      
      // Show error notifications
      if (errors.length > 0) {
        const errorCount = errors.filter(e => e.severity === 'error').length;
        const warningCount = errors.filter(e => e.severity === 'warning').length;
        
        if (errorCount > 0) {
          toast.error(`${errorCount} element error(s) detected`);
        } else if (warningCount > 0) {
          toast.warning(`${warningCount} element warning(s) detected`);
        }
      }
    }, 150), // 150ms debounce for smooth real-time updates
    [convertElementsToThermal]
  );

  // Effect for real-time updates
  useEffect(() => {
    debouncedConvert(elements);
    return () => {
      debouncedConvert.cancel();
    };
  }, [elements, debouncedConvert, updateTrigger]);

  // Dynamic field replacement
  const replaceDynamicFields = (text: string, data: OrderData): string => {
    return text
      .replace(/\{order\.id\}/g, data.order_id)
      .replace(/\{order\.type\}/g, data.order_type.toUpperCase())
      .replace(/\{order\.date\}/g, data.date)
      .replace(/\{order\.time\}/g, data.time)
      .replace(/\{order\.total\}/g, `£${data.total}`)
      .replace(/\{customer\.name\}/g, data.customer_name)
      .replace(/\{items\.list\}/g, formatItemsList(data.items))
      .replace(/\{items\.simple\}/g, formatItemsSimple(data.items))
      .replace(/\{items\.compact\}/g, formatItemsCompact(data.items));
  };

  // Item formatting functions
  const formatItemsList = (items: OrderData['items']): string => {
    return items.map(item => {
      const itemLine = `${item.quantity}x ${item.name}`;
      const price = `£${item.price}`;
      const maxItemWidth = charWidth - price.length - 1;
      const truncatedItem = itemLine.length > maxItemWidth 
        ? itemLine.substring(0, maxItemWidth - 3) + '...'
        : itemLine;
      const spaces = ' '.repeat(Math.max(0, charWidth - truncatedItem.length - price.length));
      return `${truncatedItem}${spaces}${price}`;
    }).join('\n');
  };

  const formatItemsSimple = (items: OrderData['items']): string => {
    return items.map(item => `${item.quantity}x ${item.name}`).join('\n');
  };

  const formatItemsCompact = (items: OrderData['items']): string => {
    return items.map(item => 
      `${item.quantity}x ${item.name.substring(0, 15)}... £${item.price}`
    ).join('\n');
  };

  // Text alignment function
  const alignText = (text: string, align: 'left' | 'center' | 'right'): string => {
    const lines = text.split('\n');
    return lines.map(line => {
      if (align === 'center') {
        const padding = Math.max(0, Math.floor((charWidth - line.length) / 2));
        return ' '.repeat(padding) + line;
      } else if (align === 'right') {
        const padding = Math.max(0, charWidth - line.length);
        return ' '.repeat(padding) + line;
      }
      return line; // left align (default)
    }).join('\n');
  };

  // Force refresh function
  const forceRefresh = () => {
    setIsProcessing(true);
    const { elements: converted, errors } = convertElementsToThermal(elements);
    setThermalElements(converted);
    setConversionErrors(errors);
    setPreviewKey(prev => prev + 1);
    setIsProcessing(false);
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Printer className="h-4 w-4" />
            <span>Thermal Preview</span>
            <Badge variant="outline" className="text-xs">
              {paperWidth}mm • {charWidth} chars
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {isProcessing && (
              <Badge variant="secondary" className="text-xs animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Processing...
              </Badge>
            )}
            {conversionErrors.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {conversionErrors.length} issues
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {renderTime.toFixed(1)}ms
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={forceRefresh}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Processing Stats */}
        {processingStats.elementsProcessed > 0 && (
          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
            <span>{processingStats.elementsProcessed} elements processed</span>
            {processingStats.errorsFound > 0 && (
              <span className="text-orange-500">{processingStats.errorsFound} errors found</span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto p-0">
        <div className="h-full bg-gray-50 border border-gray-200 rounded-md">
          {/* Thermal Receipt Preview */}
          <AnimatePresence mode="wait">
            <motion.div
              key={previewKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 font-mono text-black bg-white border-l-4 border-gray-300"
              style={{
                fontFamily: 'Courier, monospace',
                fontSize: THERMAL_FONTS.normal.size,
                lineHeight: THERMAL_FONTS.normal.lineHeight,
                whiteSpace: 'pre-wrap',
                letterSpacing: '0.5px',
                width: 'fit-content',
                maxWidth: '100%',
                margin: '0 auto'
              }}
            >
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                <div className="text-xs text-gray-500">
                  {'▲'.repeat(charWidth)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {charWidth} Character Width • Live Preview
                </div>
              </div>
              
              {/* Rendered Elements */}
              {thermalElements.map((thermalElement, index) => {
                const alignedContent = alignText(thermalElement.content, thermalElement.align);
                
                return (
                  <div key={`${thermalElement.id}-${index}`}>
                    {/* Spacing before */}
                    {thermalElement.spacing.before > 0 && (
                      <div style={{ height: `${thermalElement.spacing.before * 8}px` }} />
                    )}
                    
                    {/* Element content */}
                    <div
                      className={thermalElement.error ? 'bg-red-100 border border-red-300' : ''}
                      style={{
                        fontSize: THERMAL_FONTS[thermalElement.style.size].size,
                        lineHeight: THERMAL_FONTS[thermalElement.style.size].lineHeight,
                        fontWeight: thermalElement.style.bold ? 'bold' : 'normal',
                        transform: thermalElement.style.doubleWidth ? 'scaleX(2)' : 'none',
                        transformOrigin: 'left',
                        textDecoration: thermalElement.style.underline ? 'underline' : 'none',
                        backgroundColor: thermalElement.style.inverse ? '#000' : 'transparent',
                        color: thermalElement.style.inverse ? '#fff' : '#000'
                      }}
                    >
                      {alignedContent}
                      {thermalElement.error && (
                        <div className="text-xs text-red-600 mt-1">
                          ⚠ {thermalElement.error}
                        </div>
                      )}
                    </div>
                    
                    {/* Spacing after */}
                    {thermalElement.spacing.after > 0 && (
                      <div style={{ height: `${thermalElement.spacing.after * 8}px` }} />
                    )}
                  </div>
                );
              })}
              
              {/* Receipt Footer */}
              <div className="text-center border-t border-dashed border-gray-400 pt-2 mt-4">
                <div className="text-xs text-gray-500">
                  {'='.repeat(charWidth)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Real-time Thermal Preview • {paperWidth}mm Paper
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* No elements state */}
          {thermalElements.length === 0 && !isProcessing && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Printer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No elements to preview</p>
                <p className="text-xs mt-1">Add elements to see thermal representation</p>
              </div>
            </div>
          )}
          
          {/* Error Panel */}
          {conversionErrors.length > 0 && (
            <div className="absolute bottom-4 right-4 max-w-sm">
              <Card className="bg-red-50 border-red-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      Conversion Issues ({conversionErrors.length})
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {conversionErrors.slice(0, 3).map((error, index) => (
                      <div key={index} className="text-xs text-red-600">
                        <span className="font-medium">{error.elementId}:</span> {error.message}
                      </div>
                    ))}
                    {conversionErrors.length > 3 && (
                      <div className="text-xs text-red-500">
                        +{conversionErrors.length - 3} more issues...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
