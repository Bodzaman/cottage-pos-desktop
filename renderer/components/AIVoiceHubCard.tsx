


import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiClient } from 'app';
import { eventBus, EVENTS } from 'utils/eventBus';
import { colors, cardStyle } from 'utils/designSystem';

interface VoiceAgentStatus {
  success: boolean;
  corpus_status: 'connected' | 'disconnected' | 'checking';
  voice_system_status: 'online' | 'offline' | 'unknown';
  overall_status: 'ready' | 'limited' | 'unavailable';
  menu_item_count: number;
  set_meal_count: number;
  total_offerings: number;
  last_check: string;
  status_message: string;
}

const AIVoiceHubCard = () => {
  const { data: status, refetch, isLoading, error } = useQuery({
    queryKey: ['voice-agent-status'],
    queryFn: async (): Promise<VoiceAgentStatus> => {
      const response = await apiClient.get_voice_agent_status();
      return response.json();
    },
    staleTime: Infinity, // Never auto-refresh - only on events
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    // Event-driven updates - no polling!
    const handleMenuPublished = () => {
      refetch(); // Refresh status after menu publish
    };

    const handleCorpusSync = () => {
      refetch(); // Refresh status after corpus sync
    };

    const handleMenuChanged = () => {
      refetch(); // Refresh status after menu changes
    };

    const handleStatusRefresh = () => {
      refetch(); // Manual refresh
    };

    // Listen for relevant events
    eventBus.on(EVENTS.MENU_PUBLISHED, handleMenuPublished);
    eventBus.on(EVENTS.CORPUS_SYNCED, handleCorpusSync);
    eventBus.on(EVENTS.MENU_CHANGED, handleMenuChanged);
    eventBus.on(EVENTS.VOICE_AGENT_STATUS_REFRESH, handleStatusRefresh);
    
    return () => {
      eventBus.off(EVENTS.MENU_PUBLISHED, handleMenuPublished);
      eventBus.off(EVENTS.CORPUS_SYNCED, handleCorpusSync);
      eventBus.off(EVENTS.MENU_CHANGED, handleMenuChanged);
      eventBus.off(EVENTS.VOICE_AGENT_STATUS_REFRESH, handleStatusRefresh);
    };
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'connected':
      case 'online': 
      case 'ready': 
        return 'text-green-500';
      case 'checking':
      case 'limited': 
        return 'text-amber-500';
      case 'disconnected':
      case 'offline':
      case 'unavailable': 
        return 'text-red-500';
      default: 
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (overall_status: string) => {
    switch(overall_status) {
      case 'ready': return '✅';
      case 'limited': return '⚠️';
      case 'unavailable': return '❌';
      default: return '⚪';
    }
  };

  const getStatusDot = (status: string) => {
    switch(status) {
      case 'connected':
      case 'online':
      case 'ready':
        return '🟢';
      case 'checking':
      case 'limited':
        return '🟡';
      case 'disconnected':
      case 'offline':
      case 'unavailable':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const formatLastCheck = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 minute ago';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      return date.toLocaleTimeString();
    } catch {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card style={cardStyle} className="h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 AI Voice Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-gray-500 animate-pulse">Loading status...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={cardStyle} className="h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 AI Voice Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">❌</div>
            <div className="text-sm text-gray-600">AI Voice Assistant</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">🔴</span>
              <span className="text-sm font-medium text-red-600">
                Unable to check status
              </span>
            </div>
          </div>
          <div className="text-center text-sm text-gray-600">
            System temporarily unavailable
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card style={cardStyle} className="h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 AI Voice Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-gray-500">No status data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={cardStyle} className="h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <CardTitle className="text-lg">AI Voice Agent</CardTitle>
        </div>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Smart voice assistant for orders & bookings
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Voice Agent Stats */}
          <div className="flex items-center gap-4 text-xs" style={{ color: colors.text.secondary }}>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                status.corpus_status === 'connected' ? 'bg-green-400' :
                status.corpus_status === 'checking' ? 'bg-yellow-400' :
                'bg-red-400'
              }`}></span>
              <span>Menu Corpus</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                status.voice_system_status === 'online' ? 'bg-green-400' :
                status.voice_system_status === 'offline' ? 'bg-red-400' :
                'bg-gray-400'
              }`}></span>
              <span>Voice System</span>
            </div>
          </div>
          
          <Separator style={{ backgroundColor: colors.border.light }} />
          
          {/* Live AI Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>AI Assistant:</div>
              <div className="text-xs" style={{ color: colors.text.secondary }}>
                {status.total_offerings} total items
              </div>
            </div>
            
            {/* Avatar Preview Section */}
            <div className="relative h-48 rounded border overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20" style={{ borderColor: colors.border.light }}>
              {/* Background Sound Waves */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Animated sound wave rings */}
                <div className="absolute w-32 h-32 rounded-full border border-purple-400/30 animate-ping" style={{ animationDuration: '2s' }}></div>
                <div className="absolute w-24 h-24 rounded-full border border-blue-400/40 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }}></div>
                <div className="absolute w-16 h-16 rounded-full border border-purple-300/50 animate-ping" style={{ animationDuration: '1s', animationDelay: '0.6s' }}></div>
              </div>
              
              {/* Main Avatar */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-lg animate-pulse"></div>
                  
                  {/* Avatar image */}
                  <img 
                    src="https://static.riff.new/public/2c7eeed4-396b-46e1-a316-2b5a4723e8f0/waiter_1.png"
                    alt="AI Voice Agent Avatar"
                    className="relative w-20 h-20 rounded-full object-cover border-2 border-purple-400/50 shadow-lg"
                  />
                  
                  {/* Speaking indicator */}
                  {status.overall_status === 'ready' && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Status overlay */}
              <div className="absolute top-2 left-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-black/50 rounded-full text-xs text-white">
                  <span className={`w-2 h-2 rounded-full ${
                    status.overall_status === 'ready' ? 'bg-green-400 animate-pulse' :
                    status.overall_status === 'limited' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`}></span>
                  <span>{status.overall_status.toUpperCase()}</span>
                </div>
              </div>
              
              {/* Voice indicator */}
              <div className="absolute bottom-2 right-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-black/50 rounded-full text-xs text-white">
                  🎤 Voice AI
                </div>
              </div>
            </div>
          </div>
          
          {/* Brain Knowledge Hub Visual */}
          <div className="mt-4 pt-3 border-t" style={{ borderColor: colors.border.light }}>
            <div className="flex items-center justify-center space-x-3">
              {/* Brain Icon with Glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-md animate-pulse"></div>
                <div className="relative w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  🧠
                </div>
              </div>
              
              {/* Knowledge Status */}
              <div className="text-center">
                <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>Knowledge Hub</div>
                <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: colors.brand.purple }}>
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <span>{status.total_offerings} total items</span>
                </div>
                <div className="text-xs" style={{ color: colors.text.secondary }}>
                  {status.menu_item_count} menu items • {status.set_meal_count} set meals
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIVoiceHubCard;
