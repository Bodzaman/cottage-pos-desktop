import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, User, Bot } from 'lucide-react';
import { colors } from 'utils/designSystem';
import { 
  SAMPLE_CONVERSATIONS, 
  SAMPLE_QUESTIONS,
  getRandomQuestions,
  SampleMessage,
  SampleConversation 
} from 'utils/previewSampleData';

interface ChatPreviewProps {
  agentName?: string;
  systemPrompt?: string;
  tone?: string;
  isEmpty?: boolean;
}

/**
 * Interactive chat preview component
 * Simulates realistic chat conversations with typing indicators
 */
export const ChatPreview: React.FC<ChatPreviewProps> = ({
  agentName = 'AI Assistant',
  systemPrompt,
  tone,
  isEmpty = false
}) => {
  const [messages, setMessages] = useState<SampleMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<SampleConversation | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with random suggestions
  useEffect(() => {
    setSuggestedQuestions(getRandomQuestions(3));
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate typing delay and show message
  const simulateAgentResponse = async (message: string, delay: number = 800) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, delay));
    setIsTyping(false);
    
    setMessages(prev => [...prev, {
      role: 'agent',
      content: message,
      timestamp: new Date()
    }]);
  };

  // Handle sample question click
  const handleSampleQuestion = async (question: string) => {
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: question,
      timestamp: new Date()
    }]);

    // Find matching conversation or use generic response
    const matchingConvo = SAMPLE_CONVERSATIONS.find(c => 
      c.messages[0].content === question
    );

    if (matchingConvo) {
      setCurrentScenario(matchingConvo);
      // Send first agent response
      const agentResponse = matchingConvo.messages[1].content;
      await simulateAgentResponse(agentResponse);
    } else {
      // Generic response based on system prompt
      const response = `${agentName ? `Hi! I'm ${agentName}. ` : ''}Based on my configuration, I'll help answer your question with the personality and tone you've set up. This is a preview of how I'll respond to customers.`;
      await simulateAgentResponse(response);
    }

    // Refresh suggestions
    setSuggestedQuestions(getRandomQuestions(3));
  };

  // Reset conversation
  const handleReset = () => {
    setMessages([]);
    setCurrentScenario(null);
    setSuggestedQuestions(getRandomQuestions(3));
  };

  // Load a complete sample conversation
  const loadSampleConversation = async (conversation: SampleConversation) => {
    setMessages([]);
    setCurrentScenario(conversation);

    // Simulate the conversation message by message
    for (let i = 0; i < conversation.messages.length; i++) {
      const msg = conversation.messages[i];
      
      if (msg.role === 'user') {
        setMessages(prev => [...prev, msg]);
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        await simulateAgentResponse(msg.content, 800);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  if (isEmpty) {
    return (
      <div className="text-center p-6 space-y-3" style={{ color: colors.text.tertiary }}>
        <Bot className="h-12 w-12 mx-auto opacity-30" />
        <p className="text-sm">Configure your chat bot to see a preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="animate-pulse"
            style={{ 
              borderColor: colors.accent.turquoise, 
              color: colors.accent.turquoise,
              backgroundColor: 'rgba(14, 186, 177, 0.1)'
            }}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Live Preview
          </Badge>
          {systemPrompt && (
            <Badge variant="outline" style={{ borderColor: colors.accent.turquoise, color: colors.accent.turquoise }}>
              ✓ Configured
            </Badge>
          )}
        </div>
        {messages.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="text-xs"
            style={{ color: colors.text.tertiary }}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Chat Container */}
      <div 
        className="rounded-lg p-4 space-y-3 min-h-[300px] max-h-[500px] overflow-y-auto"
        style={{ backgroundColor: colors.background.tertiary }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="space-y-2">
              <Bot className="h-12 w-12 mx-auto" style={{ color: colors.brand.purple, opacity: 0.5 }} />
              <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                This is how customers will chat with {agentName}
              </p>
              <p className="text-xs" style={{ color: colors.text.tertiary }}>
                Click a sample question below to see the conversation flow
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
                  }`}
                  style={{
                    backgroundColor: msg.role === 'user' 
                      ? colors.brand.purple 
                      : colors.background.primary,
                    borderLeft: msg.role === 'agent' ? `3px solid ${colors.accent.turquoise}` : 'none'
                  }}
                >
                  {msg.role === 'agent' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="h-3 w-3" style={{ color: colors.accent.turquoise }} />
                      <span className="text-xs font-medium" style={{ color: colors.accent.turquoise }}>
                        {agentName}
                      </span>
                    </div>
                  )}
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ 
                      color: msg.role === 'user' ? '#FFFFFF' : colors.text.primary 
                    }}
                  >
                    {msg.content}
                  </p>
                  {msg.timestamp && (
                    <p className="text-xs mt-1 opacity-60" style={{ 
                      color: msg.role === 'user' ? '#FFFFFF' : colors.text.tertiary 
                    }}>
                      {msg.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-in fade-in">
                <div
                  className="rounded-lg p-3 rounded-bl-none flex items-center gap-2"
                  style={{
                    backgroundColor: colors.background.primary,
                    borderLeft: `3px solid ${colors.accent.turquoise}`
                  }}
                >
                  <Bot className="h-3 w-3" style={{ color: colors.accent.turquoise }} />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.accent.turquoise, animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.accent.turquoise, animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.accent.turquoise, animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sample Questions */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: colors.text.secondary }}>
            Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleSampleQuestion(question)}
                className="text-xs transition-all hover:scale-105"
                style={{ 
                  borderColor: colors.border.purple,
                  color: colors.text.secondary,
                  backgroundColor: colors.background.secondary
                }}
                disabled={isTyping}
              >
                <User className="h-3 w-3 mr-1" />
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Sample Scenarios */}
      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: colors.text.secondary }}>
          Or explore a full scenario:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SAMPLE_CONVERSATIONS.slice(0, 4).map((convo) => (
            <Button
              key={convo.id}
              variant="outline"
              size="sm"
              onClick={() => loadSampleConversation(convo)}
              className="text-xs h-auto py-2 px-3 text-left justify-start"
              style={{ 
                borderColor: currentScenario?.id === convo.id ? colors.accent.turquoise : colors.border.medium,
                color: colors.text.secondary,
                backgroundColor: currentScenario?.id === convo.id ? 'rgba(14, 186, 177, 0.1)' : colors.background.secondary
              }}
              disabled={isTyping}
            >
              <div>
                <div className="font-medium">{convo.title}</div>
                <div className="text-xs opacity-60">{convo.scenario}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-xs text-center space-y-1" style={{ color: colors.text.tertiary }}>
        <p>💡 The chat bot uses your system prompt to guide all conversations</p>
        {tone && (
          <p>Tone: <span style={{ color: colors.accent.turquoise }}>{tone}</span></p>
        )}
      </div>
    </div>
  );
};
