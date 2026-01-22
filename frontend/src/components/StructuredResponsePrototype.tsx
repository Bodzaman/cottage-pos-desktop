/**
 * PHASE 2: Working Prototype - Structured AI Response Component
 * 
 * This component demonstrates the complete structured response system
 * with inline rendering of menu cards, recommendations, and comparisons.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  StructuredResponse,
  StructuredElement,
  ParsedStructuredMessage,
  MenuCardElement,
  RecommendationSetElement,
  ComparisonTableElement,
  isMenuCardElement,
  isRecommendationSetElement
} from 'utils/structuredResponseTypes';
import {
  useStreamingStructuredParser,
  DEFAULT_PARSING_CONFIG
} from 'utils/structuredResponseParser';
import {
  MenuContextManager,
  MenuItemValidator,
  MenuFuzzyMatcher
} from 'utils/menuContextManager';
import {
  assembleStructuredPrompt,
  generateMenuContextSection,
  STRUCTURED_RESPONSE_SYSTEM_PROMPT
} from 'utils/structuredPromptTemplates';

// ================================
// MAIN PROTOTYPE COMPONENT
// ================================

export default function StructuredResponsePrototype() {
  const [demoMessages, setDemoMessages] = useState<DemoMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [menuContext, setMenuContext] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState<string>('menu_exploration');

  // Initialize menu context (mock for prototype)
  useEffect(() => {
    initializeMockMenuContext();
  }, []);

  const initializeMockMenuContext = () => {
    // Mock menu context for prototype demonstration
    const mockContext = {
      items: [
        {
          id: 'chicken_tikka_masala',
          name: 'Chicken Tikka Masala',
          description: 'Tender chicken in creamy tomato-based curry',
          category: 'Main Courses',
          price: 16.95,
          imageUrl: '/api/placeholder/300/200',
          dietaryTags: ['gluten-free-available'],
          spiceLevel: 2,
          popularity: 95,
          available: true,
          variants: []
        },
        {
          id: 'butter_chicken',
          name: 'Butter Chicken',
          description: 'Mild, creamy curry with tender chicken pieces',
          category: 'Main Courses',
          price: 15.95,
          imageUrl: '/api/placeholder/300/200',
          dietaryTags: ['mild'],
          spiceLevel: 1,
          popularity: 88,
          available: true,
          variants: []
        },
        {
          id: 'lamb_vindaloo',
          name: 'Lamb Vindaloo',
          description: 'Fiery hot curry with tender lamb and potatoes',
          category: 'Main Courses',
          price: 18.95,
          imageUrl: '/api/placeholder/300/200',
          dietaryTags: ['hot', 'spicy'],
          spiceLevel: 5,
          popularity: 72,
          available: true,
          variants: []
        }
      ],
      categories: [
        { id: 'mains', name: 'Main Courses', itemCount: 15, displayOrder: 2 },
        { id: 'starters', name: 'Starters', itemCount: 8, displayOrder: 1 }
      ],
      promotions: [],
      version: 'prototype_v1',
      generatedAt: new Date()
    };
    
    setMenuContext(mockContext);
  };

  const simulateStructuredResponse = async (scenario: string) => {
    setIsLoading(true);
    
    try {
      // Get scenario configuration
      const scenarioConfig = DEMO_SCENARIOS[scenario];
      if (!scenarioConfig) return;
      
      // Simulate AI response with structured elements
      const mockResponse = await simulateAIResponse(scenarioConfig);
      
      // Add to demo messages
      const newMessage: DemoMessage = {
        id: `msg_${Date.now()}`,
        scenario: scenario,
        userQuery: scenarioConfig.userQuery,
        aiResponse: mockResponse,
        timestamp: new Date()
      };
      
      setDemoMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Demo simulation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (config: DemoScenario): Promise<ParsedStructuredMessage> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create mock structured response based on scenario
    const mockElements = createMockStructuredElements(config.expectedElements);
    
    // Create content with placeholders
    const content = config.mockContent;
    
    // Parse the structured response
    const parsed: ParsedStructuredMessage = {
      textSegments: config.textSegments,
      elements: mockElements,
      rawContent: content,
      parseSuccess: true,
      parseErrors: []
    };
    
    return parsed;
  };

  const createMockStructuredElements = (elementTypes: string[]): StructuredElement[] => {
    const elements: StructuredElement[] = [];
    
    for (const type of elementTypes) {
      switch (type) {
        case 'MENU_CARD':
          elements.push({
            id: 'card_chicken_tikka',
            type: 'menu_card',
            confidence: 0.95,
            menuItem: menuContext?.items[0],
            placeholderText: '{{MENU_CARD:chicken_tikka_masala}}'
          } as MenuCardElement);
          break;
          
        case 'RECOMMENDATIONS':
          elements.push({
            id: 'recs_mild_curries',
            type: 'recommendation_set',
            confidence: 0.9,
            title: 'Mild Curry Recommendations',
            description: 'Perfect for those who prefer gentle flavors',
            recommendations: [
              {
                menuItemId: 'chicken_tikka_masala',
                reasoning: 'Creamy and mild with rich tomato flavors',
                matchScore: 0.95,
                tags: ['popular', 'mild', 'creamy']
              },
              {
                menuItemId: 'butter_chicken',
                reasoning: 'Our mildest curry with sweet undertones',
                matchScore: 0.92,
                tags: ['mild', 'sweet', 'family-friendly']
              }
            ],
            placeholderText: '{{RECOMMENDATIONS:mild_curries}}'
          } as RecommendationSetElement);
          break;
          
        case 'COMPARISON':
          elements.push({
            id: 'comp_tikka_vs_butter',
            type: 'comparison_table',
            confidence: 1.0,
            title: 'Chicken Tikka Masala vs Butter Chicken',
            items: [
              {
                menuItemId: 'chicken_tikka_masala',
                highlights: ['Tomato-based', 'Slightly tangy', 'Traditional'],
                pros: ['Rich flavor', 'Most popular', 'Great for sharing'],
                bestFor: 'First-time visitors'
              },
              {
                menuItemId: 'butter_chicken',
                highlights: ['Cream-based', 'Sweet finish', 'Mild heat'],
                pros: ['Very mild', 'Kid-friendly', 'Smooth texture'],
                bestFor: 'Those who avoid spicy food'
              }
            ],
            comparisonCriteria: ['Spice Level', 'Flavor Profile', 'Popularity'],
            placeholderText: '{{COMPARISON:tikka_vs_butter}}'
          } as ComparisonTableElement);
          break;
      }
    }
    
    return elements;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Structured AI Response Prototype</CardTitle>
          <p className="text-muted-foreground">
            Demonstration of inline menu cards, recommendations, and comparisons within AI chat responses.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(DEMO_SCENARIOS).map(([key, scenario]) => (
              <Button
                key={key}
                variant={selectedScenario === key ? "default" : "outline"}
                onClick={() => {
                  setSelectedScenario(key);
                  simulateStructuredResponse(key);
                }}
                disabled={isLoading}
              >
                {scenario.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Messages */}
      <div className="space-y-4">
        {demoMessages.map((message) => (
          <DemoMessageCard key={message.id} message={message} menuContext={menuContext} />
        ))}
        
        {isLoading && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-[250px]" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Architecture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Parsing Pipeline</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Placeholder pattern detection</li>
                <li>• Content segmentation</li>
                <li>• Element validation</li>
                <li>• Inline rendering</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Menu Integration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time availability checks</li>
                <li>• Fuzzy matching algorithm</li>
                <li>• Context-aware recommendations</li>
                <li>• Confidence scoring</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ================================
// DEMO MESSAGE COMPONENT
// ================================

interface DemoMessageCardProps {
  message: DemoMessage;
  menuContext: any;
}

function DemoMessageCard({ message, menuContext }: DemoMessageCardProps) {
  return (
    <div className="space-y-3">
      {/* User Query */}
      <div className="flex justify-end">
        <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs">
          {message.userQuery}
        </div>
      </div>
      
      {/* AI Response with Structured Elements */}
      <Card>
        <CardContent className="p-4">
          <StructuredMessageRenderer 
            parsed={message.aiResponse}
            menuContext={menuContext}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ================================
// STRUCTURED MESSAGE RENDERER
// ================================

interface StructuredMessageRendererProps {
  parsed: ParsedStructuredMessage;
  menuContext: any;
}

function StructuredMessageRenderer({ parsed, menuContext }: StructuredMessageRendererProps) {
  if (!parsed.parseSuccess) {
    return (
      <Alert>
        <AlertDescription>
          {parsed.rawContent}
        </AlertDescription>
      </Alert>
    );
  }

  const renderElement = (element: StructuredElement, index: number) => {
    if (isMenuCardElement(element)) {
      return <MenuCardRenderer key={index} element={element} />;
    }
    
    if (isRecommendationSetElement(element)) {
      return <RecommendationSetRenderer key={index} element={element} menuContext={menuContext} />;
    }
    
    // Add more element renderers as needed
    return (
      <div key={index} className="p-3 bg-muted rounded-lg">
        <p className="text-sm">Structured element: {element.type}</p>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {parsed.textSegments.map((segment, index) => (
        <div key={`segment-${index}`}>
          {segment && <p className="text-sm">{segment}</p>}
          {parsed.elements[index] && renderElement(parsed.elements[index], index)}
        </div>
      ))}
    </div>
  );
}

// ================================
// ELEMENT RENDERERS
// ================================

function MenuCardRenderer({ element }: { element: MenuCardElement }) {
  return (
    <Card className="max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <img 
            src={element.menuItem.imageUrl || '/api/placeholder/80/80'}
            alt={element.menuItem.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h4 className="font-semibold">{element.menuItem.name}</h4>
            <p className="text-sm text-muted-foreground">{element.menuItem.description}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold">£{element.menuItem.price}</span>
              <Badge variant="secondary">Spice {element.menuItem.spiceLevel}/5</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationSetRenderer({ 
  element, 
  menuContext 
}: { 
  element: RecommendationSetElement;
  menuContext: any;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{element.title}</CardTitle>
        {element.description && (
          <p className="text-sm text-muted-foreground">{element.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-3">
          {element.recommendations.map((rec, index) => {
            const item = menuContext?.items.find(i => i.id === rec.menuItemId);
            if (!item) return null;
            
            return (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{item.name}</h5>
                  <Badge>Match {Math.round(rec.matchScore * 100)}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{rec.reasoning}</p>
                <div className="flex flex-wrap gap-1">
                  {rec.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ================================
// DEMO CONFIGURATION
// ================================

interface DemoMessage {
  id: string;
  scenario: string;
  userQuery: string;
  aiResponse: ParsedStructuredMessage;
  timestamp: Date;
}

interface DemoScenario {
  name: string;
  userQuery: string;
  expectedElements: string[];
  mockContent: string;
  textSegments: string[];
}

const DEMO_SCENARIOS: Record<string, DemoScenario> = {
  menu_exploration: {
    name: '🍽️ Menu Exploration',
    userQuery: "What's your most popular dish?",
    expectedElements: ['MENU_CARD'],
    mockContent: "Our most popular dish is definitely the Chicken Tikka Masala! {{MENU_CARD:chicken_tikka_masala}} It's loved by both newcomers and regular customers.",
    textSegments: [
      "Our most popular dish is definitely the Chicken Tikka Masala!",
      "It's loved by both newcomers and regular customers."
    ]
  },
  
  decision_making: {
    name: '🤔 Decision Help',
    userQuery: "I can't decide between Chicken Tikka Masala and Butter Chicken",
    expectedElements: ['COMPARISON'],
    mockContent: "Both are excellent choices! Let me show you a side-by-side comparison: {{COMPARISON:tikka_vs_butter}} Both are creamy and mild, but with different flavor profiles.",
    textSegments: [
      "Both are excellent choices! Let me show you a side-by-side comparison:",
      "Both are creamy and mild, but with different flavor profiles."
    ]
  },
  
  recommendations: {
    name: '💡 Recommendations',
    userQuery: "What are your mildest curries?",
    expectedElements: ['RECOMMENDATIONS'],
    mockContent: "For mild curry lovers, here are my top recommendations: {{RECOMMENDATIONS:mild_curries}} All of these are under spice level 2!",
    textSegments: [
      "For mild curry lovers, here are my top recommendations:",
      "All of these are under spice level 2!"
    ]
  }
};
