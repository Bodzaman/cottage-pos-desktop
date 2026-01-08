import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Calendar, MessageSquareText, Clock, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  calls: any[];
  isLoading: boolean;
}

// Call outcome icons and colors
const outcomeIconMap = {
  completed: <Badge variant="success" className="flex gap-1 items-center"><Phone className="h-3 w-3"/> Completed</Badge>,
  reservation: <Badge variant="success" className="flex gap-1 items-center"><Calendar className="h-3 w-3"/> Reservation</Badge>,
  order: <Badge variant="success" className="flex gap-1 items-center"><MessageSquareText className="h-3 w-3"/> Order</Badge>,
  'in-progress': <Badge variant="warning" className="flex gap-1 items-center"><Clock className="h-3 w-3"/> In Progress</Badge>,
  failed: <Badge variant="destructive" className="flex gap-1 items-center"><BarChart3 className="h-3 w-3"/> Failed</Badge>,
};

const CallMonitoringPanel: React.FC<Props> = ({ calls, isLoading }) => {
  // Get the formatted date from timestamp
  const getFormattedDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      <span className="text-gray-400 text-xs">
        {formatDistanceToNow(date, { addSuffix: true })}
      </span>
    );
  };

  // Get the appropriate icon for the call outcome
  const getOutcomeIcon = (call: any) => {
    const status = call.status?.toLowerCase() || '';
    const outcome = call.outcome?.toLowerCase() || '';
    
    if (outcome === 'reservation') return outcomeIconMap.reservation;
    if (outcome === 'order') return outcomeIconMap.order;
    if (status === 'completed') return outcomeIconMap.completed;
    if (status === 'in-progress') return outcomeIconMap['in-progress'];
    return outcomeIconMap.failed;
  };

  // Determine if there are calls to display
  const hasCalls = calls && calls.length > 0;

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-400">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-4 bg-gray-700 rounded col-span-2"></div>
                <div className="h-4 bg-gray-700 rounded col-span-1"></div>
              </div>
              <div className="h-4 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
        <p className="mt-4">Loading call data...</p>
      </div>
    );
  }
  
  // If no calls, show empty state
  if (!hasCalls) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-400">
        <Phone className="h-12 w-12 mb-4 text-gray-600" />
        <p className="text-center text-lg font-medium">No call data available</p>
        <p className="text-center text-sm mt-2">
          Recent calls will appear here when your voice agent handles customer interactions
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {calls.map((call, index) => (
        <Card key={index} className="bg-gray-800 border-gray-700 overflow-hidden hover:border-gray-600 transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium text-white truncate">
                  {call.caller_number || 'Unknown Caller'}
                </div>
                {getFormattedDate(call.start_time || new Date().toISOString())}
              </div>
              <div>
                {getOutcomeIcon(call)}
              </div>
            </div>
            
            <div className="mt-3 text-sm border-t border-gray-700 pt-3">
              <div className="text-gray-300 mb-1 flex justify-between">
                <span>Duration</span>
                <span className="font-medium">{call.duration ? `${Math.round(call.duration)}s` : 'N/A'}</span>
              </div>
              {call.outcome && (
                <div className="text-gray-300 mb-1 flex justify-between">
                  <span>Outcome</span>
                  <span className="font-medium capitalize">{call.outcome}</span>
                </div>
              )}
              {call.agent_name && (
                <div className="text-gray-300 flex justify-between">
                  <span>Agent</span>
                  <span className="font-medium">{call.agent_name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CallMonitoringPanel;