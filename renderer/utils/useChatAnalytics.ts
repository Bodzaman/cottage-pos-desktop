import { useState, useEffect } from 'react';
import { apiClient } from 'app';

interface ChatMetrics {
  activeSessions: number;
  messagesTotal: number;
  avgResponseTime: string;
  ordersGenerated: number;
  conversationRate: number;
  satisfaction: number;
  escalationRate: number;
  avgSessionLength: string;
  messagesPerSession: number;
}

interface ModelPerformance {
  openai: {
    responseTime: string;
    messagesHandled: number;
    orderConversion: number;
    satisfaction: number;
  };
  gemini: {
    responseTime: string;
    messagesHandled: number;
    orderConversion: number;
    satisfaction: number;
  };
}

interface CustomerIntent {
  intent: string;
  count: number;
  percentage: number;
}

interface ChatAnalyticsData {
  metrics: ChatMetrics;
  modelPerformance: ModelPerformance;
  topIntents: CustomerIntent[];
  systemHealth: {
    apiStatus: 'operational' | 'degraded' | 'down';
    databaseStatus: 'connected' | 'disconnected';
    aiModelsStatus: 'available' | 'limited' | 'unavailable';
  };
  escalationDetails: {
    complexOrders: number;
    allergenQueries: number;
    paymentIssues: number;
    contentFiltered: number;
  };
  qualityMetrics: {
    menuCardsShown: number;
    successfulHandoffs: number;
    intentRecognition: number;
  };
}

export function useChatAnalytics() {
  const [data, setData] = useState<ChatAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test API availability
      const healthResponse = await apiClient.check_analytics_health();
      if (healthResponse.status !== 200) {
        throw new Error('Analytics service unavailable');
      }

      // Fetch real-time stats
      const statsResponse = await apiClient.get_real_time_stats();
      const conversationResponse = await apiClient.get_conversation_analytics();
      
      if (statsResponse.status === 200 && conversationResponse.status === 200) {
        const statsData = await statsResponse.json();
        const conversationData = await conversationResponse.json();
        
        // Transform real data into our format - NO MOCK DATA FALLBACKS
        const realData: ChatAnalyticsData = {
          metrics: {
            activeSessions: conversationData.metrics?.activeSessions || 0,
            messagesTotal: conversationData.metrics?.messagesTotal || 0,
            avgResponseTime: conversationData.metrics?.avgResponseTime || '0.0ms',
            ordersGenerated: conversationData.metrics?.ordersGenerated || 0,
            conversationRate: conversationData.metrics?.conversationRate || 0,
            satisfaction: conversationData.metrics?.satisfaction || 0,
            escalationRate: statsData.escalations_last_24h > 0 && conversationData.metrics?.activeSessions > 0 
              ? (statsData.escalations_last_24h / conversationData.metrics.activeSessions * 100) : 0,
            avgSessionLength: '0m 0s', // Will be calculated when session duration tracking is implemented
            messagesPerSession: conversationData.metrics?.activeSessions > 0 
              ? conversationData.metrics.messagesTotal / conversationData.metrics.activeSessions : 0
          },
          modelPerformance: {
            openai: {
              responseTime: conversationData.modelPerformance?.openai?.responseTime || '0.0ms',
              messagesHandled: conversationData.modelPerformance?.openai?.messagesHandled || 0,
              orderConversion: conversationData.modelPerformance?.openai?.orderConversion || 0,
              satisfaction: 0 // Will be calculated when per-model satisfaction tracking is implemented
            },
            gemini: {
              responseTime: conversationData.modelPerformance?.google?.responseTime || '0.0ms',
              messagesHandled: conversationData.modelPerformance?.google?.messagesHandled || 0,
              orderConversion: conversationData.modelPerformance?.google?.orderConversion || 0,
              satisfaction: 0 // Will be calculated when per-model satisfaction tracking is implemented
            }
          },
          topIntents: conversationData.topIntents || [],
          escalationDetails: {
            complexOrders: conversationData.escalationDetails?.complexOrders || 0,
            allergenQueries: conversationData.escalationDetails?.allergenQueries || 0,
            paymentIssues: conversationData.escalationDetails?.paymentIssues || 0,
            contentFiltered: conversationData.escalationDetails?.contentFiltered || 0
          },
          qualityMetrics: {
            menuCardsShown: conversationData.qualityMetrics?.menuCardsShown || 0,
            successfulHandoffs: conversationData.qualityMetrics?.successfulHandoffs || 0,
            intentRecognition: conversationData.qualityMetrics?.intentRecognition || 0
          }
        };
        
        setData(realData);
      } else {
        throw new Error('Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Error fetching chat analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set empty data instead of mock data on error
      setData({
        metrics: {
          activeSessions: 0,
          messagesTotal: 0,
          avgResponseTime: '0.0ms',
          ordersGenerated: 0,
          conversationRate: 0,
          satisfaction: 0,
          escalationRate: 0,
          avgSessionLength: '0m 0s',
          messagesPerSession: 0
        },
        modelPerformance: {
          openai: {
            responseTime: '0.0ms',
            messagesHandled: 0,
            orderConversion: 0,
            satisfaction: 0
          },
          gemini: {
            responseTime: '0.0ms',
            messagesHandled: 0,
            orderConversion: 0,
            satisfaction: 0
          }
        },
        topIntents: [],
        escalationDetails: {
          complexOrders: 0,
          allergenQueries: 0,
          paymentIssues: 0,
          contentFiltered: 0
        },
        qualityMetrics: {
          menuCardsShown: 0,
          successfulHandoffs: 0,
          intentRecognition: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    fetchAnalytics();
  };

  return {
    data,
    loading,
    error,
    refresh
  };
}

export type { ChatAnalyticsData, ChatMetrics, ModelPerformance, CustomerIntent };
