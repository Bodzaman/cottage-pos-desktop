import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Activity, Phone, MessageSquare } from 'lucide-react';

interface TwilioStatus {
  status: string;
  account_sid?: string;
  account_name?: string;
  phone_numbers?: string[];
  balance?: string;
  last_checked?: string;
  error?: string;
}

interface TwilioOverviewSectionProps {
  status: TwilioStatus | null;
  currentEnvironment: string;
  isLoading: boolean;
  onRefresh: () => void;
  onTestSMS: () => void;
}

export default function TwilioOverviewSection({
  status,
  currentEnvironment,
  isLoading,
  onRefresh,
  onTestSMS
}: TwilioOverviewSectionProps) {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status?.status)}
              <span>Twilio Connection</span>
            </div>
            <Badge variant={currentEnvironment === 'live' ? 'default' : 'secondary'}>
              {currentEnvironment.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Account</p>
                <p className="text-sm text-muted-foreground">{status.account_name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground truncate">{status.account_sid}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Phone Numbers</p>
                <p className="text-sm text-muted-foreground">
                  {status.phone_numbers?.length || 0} numbers available
                </p>
                {status.phone_numbers && status.phone_numbers.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {status.phone_numbers[0]}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Balance</p>
                <p className="text-sm text-muted-foreground">{status.balance || 'N/A'}</p>
                {status.last_checked && (
                  <p className="text-xs text-muted-foreground">
                    Last checked: {new Date(status.last_checked).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-20">
              <p className="text-muted-foreground">Loading Twilio status...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button onClick={onTestSMS} disabled={isLoading} className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Test SMS
            </Button>
            <Button onClick={onRefresh} disabled={isLoading} variant="outline" className="w-full">
              <Activity className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button disabled variant="outline" className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              Test Call (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connection Error */}
      {status?.status === 'error' && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center space-x-2">
              <XCircle className="h-5 w-5" />
              <span>Connection Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{status.error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Please check your Twilio credentials and try refreshing the connection.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}