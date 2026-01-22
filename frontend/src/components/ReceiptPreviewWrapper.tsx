
import React from 'react';
import { cn } from "@/lib/utils";

interface ReceiptPreviewWrapperProps {
  paperWidth: number;
  children: React.ReactNode;
  className?: string;
  printType?: 'receipt' | 'kitchen';
}

/**
 * A wrapper component for receipt and kitchen ticket previews that adds
 * visual paper width indicators and styling based on paper size
 */
const ReceiptPreviewWrapper: React.FC<ReceiptPreviewWrapperProps> = ({
  paperWidth = 80,
  children,
  className,
  printType = 'receipt'
}) => {
  // Calculate character limit based on paper width
  const getCharacterLimitForWidth = (width: number): number => {
    switch(width) {
      case 58: return 32; // Narrow paper
      case 80: return 45; // Standard receipt
      case 210: return 90; // A4 paper
      default: return 45;
    }
  };

  // Calculate font size based on paper width
  const getFontSizeForPaperWidth = (width: number): number => {
    switch(width) {
      case 58: return 10; // Smaller font for narrow paper
      case 80: return 11; // Standard receipt font size
      case 210: return 13; // Larger font for A4
      default: return 11;
    }
  };

  const charLimit = getCharacterLimitForWidth(paperWidth);
  const fontSize = getFontSizeForPaperWidth(paperWidth);
  
  // Create paper width visual guidelines
  const paperWidth58 = paperWidth === 58;
  const paperWidth80 = paperWidth === 80;
  const paperWidth210 = paperWidth === 210;
  
  return (
    <div className="relative">
      {/* Paper width indicator overlay */}
      <div className="absolute -top-6 left-0 right-0 flex justify-center text-xs text-muted-foreground">
        <span className="px-2 py-0.5 rounded bg-background border">
          {paperWidth}mm ({charLimit} chars/line)
        </span>
      </div>
      
      {/* Receipt content with size-appropriate styling */}
      <div 
        className={cn(
          "relative font-mono whitespace-pre-wrap border rounded-md overflow-hidden",
          "p-3 mx-auto bg-white text-black",
          "bg-white", // Pure white background for all templates
          paperWidth58 ? "w-[300px] text-[10px]" : 
          paperWidth80 ? "w-[360px] text-[11px]" : 
          "w-[600px] text-[12px]",
          className
        )}
        style={{
          maxWidth: '100%',
        }}
      >
        {/* Visual width indicators */}
        <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-indigo-100"></div>
        <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-indigo-100"></div>
        
        {/* Content */}
        {children}
        
        {/* Paper width warning if content likely exceeds width */}
        {printType === 'receipt' && (
          <div className="absolute bottom-1 right-1">
            <div className="text-[8px] opacity-50 italic">
              {paperWidth}mm
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptPreviewWrapper;
