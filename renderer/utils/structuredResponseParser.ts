/**
 * PHASE 2: Frontend Parsing Strategy for Structured AI Responses
 * 
 * This module handles parsing AI responses with embedded structured elements
 * and rendering them inline within chat messages during streaming.
 */

import {
  StructuredResponse,
  StructuredElement,
  ParsedStructuredMessage,
  ParsingConfig,
  DEFAULT_PARSING_CONFIG,
  StructuredResponseError,
  FallbackResponse,
  isStructuredElement
} from './structuredResponseTypes';

// ================================
// CORE PARSING ENGINE
// ================================

/**
 * Main parser for structured AI responses
 * Extracts placeholders and maps them to structured elements
 */
export class StructuredResponseParser {
  private config: ParsingConfig;
  private menuContext: Map<string, any> = new Map();

  constructor(config: ParsingConfig = DEFAULT_PARSING_CONFIG) {
    this.config = config;
  }

  /**
   * Parse a streaming AI response with embedded structured elements
   */
  parseStructuredResponse(
    content: string,
    structuredElements: StructuredElement[] = []
  ): ParsedStructuredMessage {
    try {
      // Extract placeholders from content
      const placeholders = this.extractPlaceholders(content);
      
      // Validate and match elements
      const validatedElements = this.validateElements(structuredElements, placeholders);
      
      // Split content into text segments
      const textSegments = this.splitContentIntoSegments(content, placeholders);
      
      return {
        textSegments,
        elements: validatedElements,
        rawContent: content,
        parseSuccess: true,
        parseErrors: []
      };
    } catch (error) {
      return this.handleParsingError(content, error as Error);
    }
  }

  /**
   * Extract placeholder patterns from content
   */
  private extractPlaceholders(content: string): PlaceholderMatch[] {
    const matches: PlaceholderMatch[] = [];
    let match;
    
    // Reset regex to avoid state issues
    const regex = new RegExp(this.config.placeholderPattern.source, 'g');
    
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        fullMatch: match[0],
        type: match[1],
        identifier: match[2],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
      
      // Prevent infinite loops
      if (matches.length >= this.config.maxElements) {
        break;
      }
    }
    
    return matches;
  }

  /**
   * Validate structured elements against extracted placeholders
   */
  private validateElements(
    elements: StructuredElement[],
    placeholders: PlaceholderMatch[]
  ): StructuredElement[] {
    const validElements: StructuredElement[] = [];
    
    for (const placeholder of placeholders) {
      // Find matching element for this placeholder
      const matchingElement = elements.find(el => 
        this.elementMatchesPlaceholder(el, placeholder)
      );
      
      if (matchingElement && isStructuredElement(matchingElement)) {
        validElements.push(matchingElement);
      }
    }
    
    return validElements;
  }

  /**
   * Check if an element matches a placeholder
   */
  private elementMatchesPlaceholder(
    element: StructuredElement,
    placeholder: PlaceholderMatch
  ): boolean {
    // Convert placeholder type to match element type
    const placeholderType = placeholder.type.toLowerCase().replace('_', '_');
    return element.type === placeholderType || 
           element.id === placeholder.identifier;
  }

  /**
   * Split content into text segments around placeholders
   */
  private splitContentIntoSegments(
    content: string,
    placeholders: PlaceholderMatch[]
  ): string[] {
    if (placeholders.length === 0) {
      return [content];
    }
    
    const segments: string[] = [];
    let lastIndex = 0;
    
    for (const placeholder of placeholders) {
      // Add text before placeholder
      if (placeholder.startIndex > lastIndex) {
        const segment = content.substring(lastIndex, placeholder.startIndex).trim();
        if (segment) {
          segments.push(segment);
        }
      }
      
      lastIndex = placeholder.endIndex;
    }
    
    // Add remaining text after last placeholder
    if (lastIndex < content.length) {
      const finalSegment = content.substring(lastIndex).trim();
      if (finalSegment) {
        segments.push(finalSegment);
      }
    }
    
    return segments;
  }

  /**
   * Handle parsing errors with appropriate fallback
   */
  private handleParsingError(content: string, error: Error): ParsedStructuredMessage {
    const parseErrors = [error.message];
    
    switch (this.config.fallbackMode) {
      case 'text_only':
        return {
          textSegments: [content],
          elements: [],
          rawContent: content,
          parseSuccess: false,
          parseErrors
        };
        
      case 'partial_render':
        // Try to extract what we can
        try {
          const placeholders = this.extractPlaceholders(content);
          const textSegments = this.splitContentIntoSegments(content, placeholders);
          return {
            textSegments,
            elements: [], // No validated elements, but structure preserved
            rawContent: content,
            parseSuccess: false,
            parseErrors
          };
        } catch {
          // Fall back to text only
          return {
            textSegments: [content],
            elements: [],
            rawContent: content,
            parseSuccess: false,
            parseErrors
          };
        }
        
      case 'retry_parse':
      default:
        return {
          textSegments: [content],
          elements: [],
          rawContent: content,
          parseSuccess: false,
          parseErrors
        };
    }
  }
}

// ================================
// STREAMING RESPONSE HANDLER
// ================================

/**
 * Handles real-time parsing during AI response streaming
 */
export class StreamingStructuredParser {
  private parser: StructuredResponseParser;
  private currentContent = '';
  private currentElements: StructuredElement[] = [];
  private onUpdate?: (parsed: ParsedStructuredMessage) => void;

  constructor(
    config: ParsingConfig = DEFAULT_PARSING_CONFIG,
    onUpdate?: (parsed: ParsedStructuredMessage) => void
  ) {
    this.parser = new StructuredResponseParser(config);
    this.onUpdate = onUpdate;
  }

  /**
   * Process a new chunk of streaming content
   */
  processChunk(chunk: string): ParsedStructuredMessage {
    this.currentContent += chunk;
    
    // Parse current content
    const parsed = this.parser.parseStructuredResponse(
      this.currentContent,
      this.currentElements
    );
    
    // Notify listeners of update
    if (this.onUpdate) {
      this.onUpdate(parsed);
    }
    
    return parsed;
  }

  /**
   * Add structured elements as they become available
   */
  addStructuredElements(elements: StructuredElement[]): void {
    this.currentElements.push(...elements);
    
    // Reparse with new elements
    const parsed = this.parser.parseStructuredResponse(
      this.currentContent,
      this.currentElements
    );
    
    if (this.onUpdate) {
      this.onUpdate(parsed);
    }
  }

  /**
   * Complete the streaming process
   */
  complete(): ParsedStructuredMessage {
    return this.parser.parseStructuredResponse(
      this.currentContent,
      this.currentElements
    );
  }

  /**
   * Reset for new message
   */
  reset(): void {
    this.currentContent = '';
    this.currentElements = [];
  }
}

// ================================
// REACT INTEGRATION HOOKS
// ================================

/**
 * React hook for parsing structured responses
 */
export function useStructuredResponseParser(
  config: ParsingConfig = DEFAULT_PARSING_CONFIG
) {
  const [parser] = useState(() => new StructuredResponseParser(config));
  
  const parseResponse = useCallback(
    (content: string, elements: StructuredElement[] = []) => {
      return parser.parseStructuredResponse(content, elements);
    },
    [parser]
  );
  
  return { parseResponse };
}

/**
 * React hook for streaming structured responses
 */
export function useStreamingStructuredParser(
  config: ParsingConfig = DEFAULT_PARSING_CONFIG
) {
  const [parser] = useState(() => new StreamingStructuredParser(config));
  const [currentParsed, setCurrentParsed] = useState<ParsedStructuredMessage | null>(null);
  
  useEffect(() => {
    parser.onUpdate = setCurrentParsed;
    return () => {
      parser.onUpdate = undefined;
    };
  }, [parser]);
  
  const processChunk = useCallback(
    (chunk: string) => parser.processChunk(chunk),
    [parser]
  );
  
  const addElements = useCallback(
    (elements: StructuredElement[]) => parser.addStructuredElements(elements),
    [parser]
  );
  
  const complete = useCallback(
    () => parser.complete(),
    [parser]
  );
  
  const reset = useCallback(
    () => {
      parser.reset();
      setCurrentParsed(null);
    },
    [parser]
  );
  
  return {
    currentParsed,
    processChunk,
    addElements,
    complete,
    reset
  };
}

// ================================
// UTILITY TYPES AND INTERFACES
// ================================

interface PlaceholderMatch {
  fullMatch: string;
  type: string;
  identifier: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Configuration for inline rendering
 */
export interface InlineRenderConfig {
  /** Maximum width for inline cards */
  maxCardWidth: number;
  /** Whether to show loading states */
  showLoading: boolean;
  /** Animation duration for element appearance */
  animationDuration: number;
  /** Whether to enable click interactions */
  enableInteractions: boolean;
}

/**
 * Default inline rendering configuration
 */
export const DEFAULT_INLINE_RENDER_CONFIG: InlineRenderConfig = {
  maxCardWidth: 400,
  showLoading: true,
  animationDuration: 300,
  enableInteractions: true
};

// ================================
// ERROR HANDLING UTILITIES
// ================================

/**
 * Create a fallback response for parsing failures
 */
export function createFallbackResponse(
  content: string,
  error: StructuredResponseError,
  message: string
): FallbackResponse {
  return {
    content,
    showError: false, // Don't show errors to users by default
    errorInfo: {
      type: error,
      message,
      details: {},
      timestamp: new Date(),
      recoverable: error !== 'ai_model_error'
    },
    retryAvailable: true
  };
}

/**
 * Validate structured response format
 */
export function validateStructuredResponse(
  response: any
): response is StructuredResponse {
  return (
    response &&
    typeof response.id === 'string' &&
    typeof response.content === 'string' &&
    Array.isArray(response.structuredElements) &&
    response.metadata &&
    typeof response.metadata.modelUsed === 'string'
  );
}

// Required imports for React hooks
import { useState, useCallback, useEffect } from 'react';

export default {
  StructuredResponseParser,
  StreamingStructuredParser,
  useStructuredResponseParser,
  useStreamingStructuredParser,
  createFallbackResponse,
  validateStructuredResponse,
  DEFAULT_INLINE_RENDER_CONFIG
};
