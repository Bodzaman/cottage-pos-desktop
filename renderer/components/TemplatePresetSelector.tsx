import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Receipt, UtensilsCrossed, FileText, BookOpen, Trophy, Truck, Package, Phone, Smartphone, Globe, AlertCircle, Copy, Sparkles, PenLine, Ruler, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReceiptPreviewTemplate } from './ReceiptPreviewTemplate';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TemplatePresetSelectorProps {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  previewContent: React.ReactNode;
  highlightFeatures: string[];
  presetType: 'minimal' | 'standard' | 'branded';
  paperSize?: string;
  orderType?: string;
  printType?: 'receipt' | 'kitchen';
}

const TemplatePresetSelector: React.FC<TemplatePresetSelectorProps> = ({
  title,
  description,
  selected,
  onClick,
  previewContent,
  highlightFeatures,
  presetType,
  paperSize = '80',
  orderType = 'dine-in',
  printType = 'receipt'
}) => {
  // Get icon based on preset type
  const getPresetIcon = () => {
    switch (presetType) {
      case 'minimal':
        return <FileText className="h-5 w-5" />;
      case 'standard':
        return <BookOpen className="h-5 w-5" />;
      case 'branded':
        return <PenLine className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Get color based on preset type
  const getPresetColor = () => {
    switch (presetType) {
      case 'minimal':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10';
      case 'standard':
        return 'border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-900/10';
      case 'branded':
        return 'border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10';
      default:
        return 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50';
    }
  };
  
  // Get button color based on preset type
  const getPresetButtonColor = () => {
    switch (presetType) {
      case 'minimal':
        return selected ? 'bg-blue-600 hover:bg-blue-700' : 'text-blue-600 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20';
      case 'standard':
        return selected ? 'bg-amber-600 hover:bg-amber-700' : 'text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20';
      case 'branded':
        return selected ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-600 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20';
      default:
        return selected ? 'bg-purple-600 hover:bg-purple-700' : 'text-gray-600 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20';
    }
  };
  
  // Get print type icon
  const getPrintTypeIcon = () => {
    return printType === 'kitchen' ? 
      <AlertCircle className="h-4 w-4 text-amber-500" /> : 
      <Receipt className="h-4 w-4 text-blue-500" />;
  };
  
  // Get order type icon
  const getOrderTypeIcon = () => {
    switch (orderType) {
      case 'dine-in':
        return <UtensilsCrossed className="h-4 w-4 text-amber-500" />;
      case 'collection':
        return <Package className="h-4 w-4 text-emerald-500" />;
      case 'delivery':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'online':
        return <Globe className="h-4 w-4 text-purple-500" />;
      case 'voice':
        return <Phone className="h-4 w-4 text-rose-500" />;
      default:
        return null;
    }
  };
  
  // Get order type badge
  const getOrderTypeBadge = () => {
    if (!orderType) return null;
    
    const orderTypeMap: {[key: string]: string} = {
      'dine-in': 'Dine-In',
      'collection': 'Collection',
      'delivery': 'Delivery',
      'online': 'Online',
      'voice': 'Voice'
    };
    
    return (
      <Badge variant="outline" className="text-xs flex items-center gap-1">
        {getOrderTypeIcon()}
        <span>{orderTypeMap[orderType] || orderType}</span>
      </Badge>
    );
  };
  
  // Get paper width indicator
  const getPaperWidthIndicator = () => {
    const charLimit = getPaperWidthCharLimit(paperSize);
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">
        <span className="font-mono">{paperSize}mm</span>
        <span className="text-gray-500 dark:text-gray-400">({charLimit} chars)</span>
      </div>
    );
  };
  
  // Get paper width character limit
  const getPaperWidthCharLimit = (width: string): number => {
    const numWidth = parseInt(width);
    switch(numWidth) {
      case 58: return 32;
      case 80: return 42;
      case 210: return 95;
      default: return Math.floor(numWidth * 0.525);
    }
  };

  return (
    <Card 
      className={cn(
        "w-full flex flex-col h-full border-2 transition-all duration-200 cursor-pointer hover:border-purple-300 dark:hover:border-purple-700",
        selected ? "border-purple-500 shadow-md shadow-purple-500/20" : "border-gray-200 dark:border-gray-800"
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col p-5 flex-grow">
        <div className="flex items-start mb-3">
          <div className={cn(
            "flex items-center justify-center p-2.5 rounded-full mr-3",
            presetType === 'minimal' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
            presetType === 'standard' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
            "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          )}>
            {getPresetIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-lg">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          </div>
          {selected ? (
            <div className="bg-purple-500 text-white p-1.5 rounded-full shadow-sm">
              <Check className="h-4 w-4" />
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 hover:bg-purple-100 dark:hover:bg-purple-900/20 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <Copy className="h-4 w-4 mr-1.5" />
              Use
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getOrderTypeBadge()}
            <Badge variant={printType === 'kitchen' ? "destructive" : "default"} className="text-xs flex items-center gap-1">
              {printType === 'kitchen' ? 
                <AlertCircle className="h-3.5 w-3.5 mr-0.5" /> : 
                <Receipt className="h-3.5 w-3.5 mr-0.5" />
              }
              {printType === 'kitchen' ? 'Kitchen Ticket' : 'Customer Receipt'}
            </Badge>
          </div>
          {getPaperWidthIndicator()}
        </div>
        
        <div className="border rounded-md overflow-hidden flex-1 relative bg-white dark:bg-gray-950 shadow-sm mb-3">
          <div className="absolute inset-0 overflow-auto p-3 text-[10px] leading-tight scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            {previewContent}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent"></div>
          
          {/* Paper width indicator lines */}
          <div className="absolute top-0 bottom-0 left-8 w-px bg-blue-200 dark:bg-blue-800 opacity-30"></div>
          <div className="absolute top-0 bottom-0 right-8 w-px bg-blue-200 dark:bg-blue-800 opacity-30"></div>
          
          {/* Paper width label */}
          <div className="absolute top-1 left-0 right-0 flex justify-center">
            <span className="text-[8px] bg-white dark:bg-gray-900 px-1 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded">
              {paperSize}mm
            </span>
          </div>
        </div>
        
        <div className={cn(
          "text-xs p-3 rounded-md border", 
          getPresetColor()
        )}>
          <div className="flex items-center mb-2">
            <Sparkles className="h-4 w-4 mr-1.5 text-amber-500" />
            <strong className="text-sm">Key Features:</strong>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {highlightFeatures.map((feature, i) => (
              <li key={i} className="text-gray-700 dark:text-gray-300">{feature}</li>
            ))}
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="p-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <Button 
          className="w-full" 
          variant={selected ? "default" : "outline"}
          size="sm"
          onClick={onClick}
        >
          {selected ? "Selected" : "Select"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TemplatePresetSelector;