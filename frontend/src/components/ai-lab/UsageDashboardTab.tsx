/**
 * UsageDashboardTab - AI Usage Monitoring Dashboard
 *
 * Displays AI usage metrics and cost estimates:
 * - Token usage (input/output)
 * - Audio duration (voice calls)
 * - Function call frequency
 * - Cost estimates
 * - Usage trends over time
 *
 * Phase 4: GeminiVoiceLab Dashboards
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare,
  Mic,
  Zap,
  DollarSign,
  Clock,
  TrendingUp,
  Activity,
  RefreshCw,
  BarChart3,
  Wrench,
  Users,
  Calendar
} from 'lucide-react';
import { colors } from '@/utils/InternalDesignSystem';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/utils/supabaseClient';
import { toast } from 'sonner';

// ==============================================================================
// TYPES
// ==============================================================================

interface UsageStats {
  totalInteractions: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalAudioSecondsIn: number;
  totalAudioSecondsOut: number;
  totalFunctionCalls: number;
  avgLatencyMs: number;
  chatCount: number;
  voiceCount: number;
  authenticatedCount: number;
  guestCount: number;
}

interface DailyUsage {
  date: string;
  interactions: number;
  tokens: number;
  audio_seconds: number;
}

interface TopFunction {
  name: string;
  count: number;
}

// Cost estimates per unit (approximate)
const COST_PER_1K_INPUT_TOKENS = 0.00025;   // $0.25 per 1M
const COST_PER_1K_OUTPUT_TOKENS = 0.001;    // $1.00 per 1M
const COST_PER_AUDIO_MINUTE = 0.002;        // Estimated

// ==============================================================================
// COMPONENT
// ==============================================================================

export function UsageDashboardTab() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [topFunctions, setTopFunctions] = useState<TopFunction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    fetchUsageData();
  }, [timeRange]);

  const getDateRange = () => {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return {
      start: startOfDay(subDays(now, days)).toISOString(),
      end: endOfDay(now).toISOString()
    };
  };

  const fetchUsageData = async () => {
    try {
      setIsLoading(true);
      const { start, end } = getDateRange();

      // Fetch usage events
      const { data: events, error } = await supabase
        .from('ai_usage_events')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end);

      if (error) throw error;

      if (!events || events.length === 0) {
        setStats({
          totalInteractions: 0,
          totalTokensIn: 0,
          totalTokensOut: 0,
          totalAudioSecondsIn: 0,
          totalAudioSecondsOut: 0,
          totalFunctionCalls: 0,
          avgLatencyMs: 0,
          chatCount: 0,
          voiceCount: 0,
          authenticatedCount: 0,
          guestCount: 0
        });
        setDailyUsage([]);
        setTopFunctions([]);
        return;
      }

      // Calculate aggregate stats
      const totalTokensIn = events.reduce((sum, e) => sum + (e.input_tokens || 0), 0);
      const totalTokensOut = events.reduce((sum, e) => sum + (e.output_tokens || 0), 0);
      const totalAudioIn = events.reduce((sum, e) => sum + parseFloat(e.audio_seconds_in || '0'), 0);
      const totalAudioOut = events.reduce((sum, e) => sum + parseFloat(e.audio_seconds_out || '0'), 0);
      const totalFunctions = events.reduce((sum, e) => sum + (e.function_calls_count || 0), 0);
      const latencies = events.filter(e => e.latency_ms).map(e => e.latency_ms);
      const avgLatency = latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;

      const chatCount = events.filter(e => e.channel === 'chat').length;
      const voiceCount = events.filter(e => e.channel === 'voice').length;
      const authCount = events.filter(e => e.is_authenticated).length;

      setStats({
        totalInteractions: events.length,
        totalTokensIn,
        totalTokensOut,
        totalAudioSecondsIn: totalAudioIn,
        totalAudioSecondsOut: totalAudioOut,
        totalFunctionCalls: totalFunctions,
        avgLatencyMs: avgLatency,
        chatCount,
        voiceCount,
        authenticatedCount: authCount,
        guestCount: events.length - authCount
      });

      // Calculate daily usage
      const dailyMap = new Map<string, { interactions: number; tokens: number; audio_seconds: number }>();
      events.forEach(e => {
        const date = format(new Date(e.created_at), 'yyyy-MM-dd');
        const existing = dailyMap.get(date) || { interactions: 0, tokens: 0, audio_seconds: 0 };
        dailyMap.set(date, {
          interactions: existing.interactions + 1,
          tokens: existing.tokens + (e.input_tokens || 0) + (e.output_tokens || 0),
          audio_seconds: existing.audio_seconds + parseFloat(e.audio_seconds_in || '0') + parseFloat(e.audio_seconds_out || '0')
        });
      });

      const daily = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setDailyUsage(daily);

      // Calculate top functions
      const functionMap = new Map<string, number>();
      events.forEach(e => {
        if (e.function_names) {
          e.function_names.forEach((name: string) => {
            functionMap.set(name, (functionMap.get(name) || 0) + 1);
          });
        }
      });

      const top = Array.from(functionMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setTopFunctions(top);

    } catch (error: unknown) {
      console.error('Failed to fetch usage data:', error);
      toast.error('Failed to load usage data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${mins}m ${secs}s`;
    }
    return `${Math.round(seconds)}s`;
  };

  const calculateEstimatedCost = (): number => {
    if (!stats) return 0;

    const inputCost = (stats.totalTokensIn / 1000) * COST_PER_1K_INPUT_TOKENS;
    const outputCost = (stats.totalTokensOut / 1000) * COST_PER_1K_OUTPUT_TOKENS;
    const audioMinutes = (stats.totalAudioSecondsIn + stats.totalAudioSecondsOut) / 60;
    const audioCost = audioMinutes * COST_PER_AUDIO_MINUTE;

    return inputCost + outputCost + audioCost;
  };

  // Calculate max for bar chart scaling
  const maxDailyInteractions = Math.max(...dailyUsage.map(d => d.interactions), 1);

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" style={{ color: colors.accent.gold }} />
          <span className="text-sm font-medium" style={{ color: colors.text.primary }}>Time Range</span>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as '7d' | '30d' | '90d')}>
            <SelectTrigger className="w-32" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium, color: colors.text.primary }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchUsageData}
            style={{ borderColor: colors.border.medium }}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} style={{ color: colors.text.muted }} />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Interactions */}
        <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="h-8 w-8" style={{ color: colors.accent.secondary }} />
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Total
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                {isLoading ? '...' : formatNumber(stats?.totalInteractions || 0)}
              </div>
              <div className="text-xs" style={{ color: colors.text.muted }}>
                Interactions
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokens */}
        <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Zap className="h-8 w-8" style={{ color: colors.accent.gold }} />
              <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                Tokens
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                {isLoading ? '...' : formatNumber((stats?.totalTokensIn || 0) + (stats?.totalTokensOut || 0))}
              </div>
              <div className="text-xs" style={{ color: colors.text.muted }}>
                In: {formatNumber(stats?.totalTokensIn || 0)} | Out: {formatNumber(stats?.totalTokensOut || 0)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Duration */}
        <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Mic className="h-8 w-8" style={{ color: '#10B981' }} />
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Voice
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                {isLoading ? '...' : formatDuration((stats?.totalAudioSecondsIn || 0) + (stats?.totalAudioSecondsOut || 0))}
              </div>
              <div className="text-xs" style={{ color: colors.text.muted }}>
                Audio Duration
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Cost */}
        <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8" style={{ color: '#EC4899' }} />
              <Badge variant="outline" className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                Est. Cost
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                {isLoading ? '...' : `$${calculateEstimatedCost().toFixed(2)}`}
              </div>
              <div className="text-xs" style={{ color: colors.text.muted }}>
                Approximate
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Chat vs Voice */}
        <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5" style={{ color: colors.accent.secondary }} />
              <span className="text-sm" style={{ color: colors.text.muted }}>Channel Split</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-lg font-bold" style={{ color: colors.text.primary }}>
                  {stats?.chatCount || 0}
                </div>
                <div className="text-xs" style={{ color: colors.text.muted }}>Chat</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: colors.text.primary }}>
                  {stats?.voiceCount || 0}
                </div>
                <div className="text-xs" style={{ color: colors.text.muted }}>Voice</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auth vs Guest */}
        <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5" style={{ color: colors.accent.gold }} />
              <span className="text-sm" style={{ color: colors.text.muted }}>User Types</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-lg font-bold" style={{ color: colors.text.primary }}>
                  {stats?.authenticatedCount || 0}
                </div>
                <div className="text-xs" style={{ color: colors.text.muted }}>Logged In</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: colors.text.primary }}>
                  {stats?.guestCount || 0}
                </div>
                <div className="text-xs" style={{ color: colors.text.muted }}>Guests</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Function Calls */}
        <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-5 w-5" style={{ color: '#F59E0B' }} />
              <span className="text-sm" style={{ color: colors.text.muted }}>Function Calls</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              {formatNumber(stats?.totalFunctionCalls || 0)}
            </div>
          </CardContent>
        </Card>

        {/* Average Latency */}
        <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5" style={{ color: '#8B5CF6' }} />
              <span className="text-sm" style={{ color: colors.text.muted }}>Avg Latency</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              {stats?.avgLatencyMs || 0}ms
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Usage Chart */}
        <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: colors.text.primary }}>
              <BarChart3 className="h-4 w-4" style={{ color: colors.accent.gold }} />
              Daily Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyUsage.length === 0 ? (
              <div className="h-32 flex items-center justify-center" style={{ color: colors.text.muted }}>
                No data available
              </div>
            ) : (
              <div className="flex items-end gap-1 h-32">
                {dailyUsage.slice(-14).map((day, index) => (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center"
                    title={`${format(new Date(day.date), 'MMM d')}: ${day.interactions} interactions`}
                  >
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${(day.interactions / maxDailyInteractions) * 100}%`,
                        minHeight: day.interactions > 0 ? '4px' : '0',
                        backgroundColor: colors.accent.secondary
                      }}
                    />
                    {index % 2 === 0 && (
                      <div className="text-[10px] mt-1" style={{ color: colors.text.muted }}>
                        {format(new Date(day.date), 'd')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Functions */}
        <Card style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: colors.text.primary }}>
              <TrendingUp className="h-4 w-4" style={{ color: colors.accent.gold }} />
              Top Functions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topFunctions.length === 0 ? (
              <div className="h-32 flex items-center justify-center" style={{ color: colors.text.muted }}>
                No function calls recorded
              </div>
            ) : (
              <div className="space-y-2">
                {topFunctions.slice(0, 5).map((func, index) => (
                  <div key={func.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: colors.text.muted }}>
                        {index + 1}.
                      </span>
                      <span className="text-sm truncate max-w-[150px]" style={{ color: colors.text.primary }}>
                        {func.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: colors.border.medium, color: colors.text.muted }}>
                      {func.count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default UsageDashboardTab;
