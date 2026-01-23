/**
 * TranscriptsViewerTab - AI Conversation Transcript Viewer
 *
 * Displays AI chat and voice conversation transcripts with privacy controls:
 * - Staff sees redacted transcripts by default
 * - Admin can toggle to view raw transcripts (with audit logging)
 * - Timeline view of conversation turns
 * - PII detection indicators
 *
 * Phase 4: GeminiVoiceLab Dashboards
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare,
  Mic,
  User,
  Bot,
  Wrench,
  ShieldAlert,
  Eye,
  EyeOff,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { colors } from '@/utils/InternalDesignSystem';
import { format } from 'date-fns';
import { supabase } from '@/utils/supabaseClient';
import { useSimpleAuth } from '@/utils/simple-auth-context';
import { toast } from 'sonner';

// ==============================================================================
// TYPES
// ==============================================================================

interface TranscriptEntry {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: string;
  tool_calls?: Array<{
    name: string;
    args?: Record<string, unknown>;
    result_preview?: string;
  }>;
}

interface TranscriptSession {
  id: string;
  session_id: string;
  channel: 'chat' | 'voice';
  redacted_transcript: TranscriptEntry[];
  pii_detected: {
    types_found?: string[];
    counts?: Record<string, number>;
    total_instances?: number;
    has_sensitive?: boolean;
  };
  created_at: string;
  retention_until_redacted?: string;
}

interface TranscriptsViewerTabProps {
  isAdmin?: boolean;
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function TranscriptsViewerTab({ isAdmin = false }: TranscriptsViewerTabProps) {
  const { user } = useSimpleAuth();
  const [sessions, setSessions] = useState<TranscriptSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TranscriptSession | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [rawTranscript, setRawTranscript] = useState<TranscriptEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRaw, setIsLoadingRaw] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'chat' | 'voice'>('all');
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

  // Fetch transcript sessions
  useEffect(() => {
    fetchSessions();
  }, [channelFilter]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);

      // Use the staff view which excludes raw_transcript
      let query = supabase
        .from('ai_transcripts_staff')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSessions(data || []);
    } catch (error: unknown) {
      console.error('Failed to fetch transcripts:', error);
      toast.error('Failed to load transcripts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRaw = async (session: TranscriptSession) => {
    if (!isAdmin) {
      toast.error('Admin access required for raw transcripts');
      return;
    }

    try {
      setIsLoadingRaw(true);

      // Call the admin-only function (logs access automatically)
      const { data, error } = await supabase.rpc('get_raw_transcript', {
        p_session_id: session.session_id,
        p_viewer_id: user?.id
      });

      if (error) throw error;

      setRawTranscript(data);
      setShowRaw(true);
      toast.success('Raw transcript loaded (access logged)');
    } catch (error: unknown) {
      console.error('Failed to fetch raw transcript:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load raw transcript';
      toast.error(errorMessage);
    } finally {
      setIsLoadingRaw(false);
    }
  };

  const toggleEntryExpanded = (index: number) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const getTranscriptToDisplay = (): TranscriptEntry[] => {
    if (showRaw && rawTranscript) {
      return rawTranscript;
    }
    return selectedSession?.redacted_transcript || [];
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.session_id.toLowerCase().includes(query) ||
      session.channel.toLowerCase().includes(query)
    );
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'assistant':
        return <Bot className="h-4 w-4" />;
      case 'tool':
        return <Wrench className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'assistant':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'tool':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      {/* Session List */}
      <Card className="lg:col-span-1" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.text.primary }}>
            <MessageSquare className="h-5 w-5" style={{ color: colors.accent.gold }} />
            Transcripts
          </CardTitle>

          {/* Filters */}
          <div className="space-y-2 pt-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4" style={{ color: colors.text.muted }} />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                style={{ backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }}
              />
            </div>

            <div className="flex gap-2">
              <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as 'all' | 'chat' | 'voice')}>
                <SelectTrigger className="flex-1" style={{ backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="chat">Chat Only</SelectItem>
                  <SelectItem value="voice">Voice Only</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={fetchSessions}
                style={{ borderColor: colors.border.medium }}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} style={{ color: colors.text.muted }} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="p-4 text-center" style={{ color: colors.text.muted }}>
                Loading transcripts...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-4 text-center" style={{ color: colors.text.muted }}>
                No transcripts found
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: colors.border.medium }}>
                {filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    className={`w-full p-3 text-left transition-colors hover:bg-white/5 ${
                      selectedSession?.id === session.id ? 'bg-white/10' : ''
                    }`}
                    onClick={() => {
                      setSelectedSession(session);
                      setShowRaw(false);
                      setRawTranscript(null);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {session.channel === 'voice' ? (
                          <Mic className="h-4 w-4" style={{ color: colors.accent.gold }} />
                        ) : (
                          <MessageSquare className="h-4 w-4" style={{ color: colors.accent.secondary }} />
                        )}
                        <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                          {session.channel === 'voice' ? 'Voice' : 'Chat'}
                        </span>
                      </div>

                      {session.pii_detected?.has_sensitive && (
                        <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          PII
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs" style={{ color: colors.text.muted }}>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.created_at), 'MMM d, HH:mm')}
                      </div>
                      <div className="truncate mt-1">
                        ID: {session.session_id.slice(0, 20)}...
                      </div>
                    </div>

                    {session.pii_detected?.total_instances && session.pii_detected.total_instances > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: colors.text.muted }}>
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                        {session.pii_detected.total_instances} PII redacted
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Transcript Viewer */}
      <Card className="lg:col-span-2" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.text.primary }}>
              <Clock className="h-5 w-5" style={{ color: colors.accent.gold }} />
              Conversation Timeline
            </CardTitle>

            {selectedSession && isAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (showRaw) {
                      setShowRaw(false);
                    } else {
                      handleViewRaw(selectedSession);
                    }
                  }}
                  disabled={isLoadingRaw}
                  className="text-xs"
                  style={{ borderColor: colors.border.medium }}
                >
                  {isLoadingRaw ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : showRaw ? (
                    <EyeOff className="h-3 w-3 mr-1" />
                  ) : (
                    <Eye className="h-3 w-3 mr-1" />
                  )}
                  {showRaw ? 'Show Redacted' : 'View Raw (Audited)'}
                </Button>
              </div>
            )}
          </div>

          {selectedSession && (
            <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: colors.text.muted }}>
              <Badge variant="outline" className={`${selectedSession.channel === 'voice' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                {selectedSession.channel}
              </Badge>
              <span>{format(new Date(selectedSession.created_at), 'MMMM d, yyyy HH:mm:ss')}</span>
              {showRaw && (
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  Raw View
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[450px]">
            {!selectedSession ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: colors.text.muted }}>
                <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                <p>Select a session to view transcript</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getTranscriptToDisplay().map((entry, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getRoleColor(entry.role)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(entry.role)}
                        <span className="text-sm font-medium capitalize">{entry.role}</span>
                      </div>
                      {entry.timestamp && (
                        <span className="text-xs opacity-60">
                          {format(new Date(entry.timestamp), 'HH:mm:ss')}
                        </span>
                      )}
                    </div>

                    <div className="text-sm whitespace-pre-wrap" style={{ color: colors.text.primary }}>
                      {entry.content}
                    </div>

                    {/* Tool calls */}
                    {entry.tool_calls && entry.tool_calls.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <button
                          className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100"
                          onClick={() => toggleEntryExpanded(index)}
                        >
                          {expandedEntries.has(index) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                          {entry.tool_calls.length} tool call(s)
                        </button>

                        {expandedEntries.has(index) && (
                          <div className="mt-2 space-y-2">
                            {entry.tool_calls.map((call, callIndex) => (
                              <div
                                key={callIndex}
                                className="p-2 rounded bg-black/20 text-xs font-mono"
                              >
                                <div className="font-semibold">{call.name}</div>
                                {call.args && (
                                  <pre className="mt-1 overflow-x-auto">
                                    {JSON.stringify(call.args, null, 2)}
                                  </pre>
                                )}
                                {call.result_preview && (
                                  <div className="mt-1 opacity-60 truncate">
                                    Result: {call.result_preview}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default TranscriptsViewerTab;
