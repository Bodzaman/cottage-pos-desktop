import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircleCheck, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { apiClient } from 'app';

interface SqlSetupComponentProps {
  compact?: boolean;
}

export function SqlSetupComponent({ compact = false }: SqlSetupComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);

  const setupSqlFunction = async () => {
    try {
      setIsLoading(true);
      setStatus('idle');
      setMessage('');
      setDetails(null);
      
      // Call our new endpoint
      const response = await apiClient.setup_execute_sql_function_consolidated();
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage('SQL function successfully created and verified');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to setup SQL function');
      }
      
      setDetails(data.details);
    } catch (error) {
      console.error('Error setting up SQL function:', error);
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${compact ? 'p-0' : 'p-4'}`}>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-white">Database SQL Function Setup</h3>
            <p className="text-sm text-gray-400">Create or update the execute_sql function in Supabase</p>
          </div>
          <Button 
            onClick={setupSqlFunction}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Function...
              </>
            ) : 'Setup SQL Function'}
          </Button>
        </div>

        {status === 'success' && (
          <Alert className="bg-green-900/30 border-green-800 text-green-100">
            <CircleCheck className="h-4 w-4 text-green-400" />
            <AlertTitle className="text-green-100">Success</AlertTitle>
            <AlertDescription className="text-green-200">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert className="bg-red-900/30 border-red-800 text-red-100">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-100">Error</AlertTitle>
            <AlertDescription className="text-red-200">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {details && (
          <Card className="bg-gray-800 border-gray-700 p-4 mt-4">
            <h4 className="text-sm font-medium text-gray-200 mb-2 flex items-center">
              <Info className="h-4 w-4 mr-2 text-gray-400" />
              Response Details
            </h4>
            <pre className="text-xs text-gray-300 bg-gray-900/50 p-3 rounded overflow-auto max-h-48">
              {JSON.stringify(details, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}
