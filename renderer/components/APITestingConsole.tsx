import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Terminal, 
  Play, 
  Copy, 
  Trash2, 
  Plus, 
  Save, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Code,
  Database,
  Zap,
  Globe,
  Key,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { colors } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';

// API request interface
interface APIRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  headers: Record<string, string>;
  body?: string;
  timestamp?: string;
}

// API response interface
interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
  timestamp: string;
}

// Test result interface
interface TestResult {
  request: APIRequest;
  response?: APIResponse;
  error?: string;
  loading: boolean;
}

interface APITestingConsoleProps {
  onRefresh?: () => void;
}

export function APITestingConsole({ onRefresh }: APITestingConsoleProps) {
  const [activeTab, setActiveTab] = useState('test');
  const [savedRequests, setSavedRequests] = useState<APIRequest[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentRequest, setCurrentRequest] = useState<APIRequest>({
    id: '',
    name: 'Untitled Request',
    method: 'GET',
    endpoint: '/ultravox-health-check',
    headers: {
      'Content-Type': 'application/json'
    },
    body: ''
  });

  // Common Ultravox API endpoints
  const commonEndpoints = [
    { name: 'Health Check', method: 'GET', endpoint: '/ultravox-health-check' },
    { name: 'List Agents', method: 'GET', endpoint: '/get-agents' },
    { name: 'Create Agent', method: 'POST', endpoint: '/create-agent' },
    { name: 'Get Agent', method: 'GET', endpoint: '/get-agent/{agentId}' },
    { name: 'Update Agent', method: 'PATCH', endpoint: '/update-agent/{agentId}' },
    { name: 'Delete Agent', method: 'DELETE', endpoint: '/delete-agent/{agentId}' },
    { name: 'Get Voice Types', method: 'GET', endpoint: '/get-voice-types' },
    { name: 'Test Agent Call', method: 'POST', endpoint: '/test-agent-call' },
    { name: 'Webhook Handler', method: 'POST', endpoint: '/webhook-handler' }
  ];

  useEffect(() => {
    loadSavedRequests();
  }, []);

  const loadSavedRequests = () => {
    // Load from localStorage for persistence
    const saved = localStorage.getItem('api-testing-requests');
    if (saved) {
      try {
        setSavedRequests(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved requests:', error);
      }
    }
  };

  const saveRequest = () => {
    const newRequest = {
      ...currentRequest,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    const updated = [...savedRequests, newRequest];
    setSavedRequests(updated);
    localStorage.setItem('api-testing-requests', JSON.stringify(updated));
    toast.success('Request saved successfully');
  };

  const loadRequest = (request: APIRequest) => {
    setCurrentRequest({ ...request });
    setActiveTab('test');
    toast.info(`Loaded request: ${request.name}`);
  };

  const deleteRequest = (requestId: string) => {
    const updated = savedRequests.filter(req => req.id !== requestId);
    setSavedRequests(updated);
    localStorage.setItem('api-testing-requests', JSON.stringify(updated));
    toast.success('Request deleted');
  };

  const loadCommonEndpoint = (endpoint: any) => {
    setCurrentRequest({
      ...currentRequest,
      name: endpoint.name,
      method: endpoint.method,
      endpoint: endpoint.endpoint,
      body: endpoint.method === 'POST' || endpoint.method === 'PATCH' ? '{}' : ''
    });
  };

  const executeRequest = async () => {
    const testResult: TestResult = {
      request: { ...currentRequest },
      loading: true
    };
    
    setTestResults(prev => [testResult, ...prev]);
    const startTime = Date.now();

    try {
      let response;
      const apiMethod = getApiMethod(currentRequest.endpoint, currentRequest.method);
      
      if (apiMethod) {
        // Use apiClient methods
        response = await executeApiMethod(apiMethod, currentRequest);
      } else {
        // Fallback to fetch for custom endpoints
        response = await fetch(currentRequest.endpoint, {
          method: currentRequest.method,
          headers: currentRequest.headers,
          body: currentRequest.method !== 'GET' ? currentRequest.body : undefined
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
      
      const apiResponse: APIResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        duration,
        timestamp: new Date().toISOString()
      };
      
      // Update test result
      setTestResults(prev => 
        prev.map((result, index) => 
          index === 0 ? { ...result, response: apiResponse, loading: false } : result
        )
      );
      
      toast.success(`Request completed in ${duration}ms`);
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      setTestResults(prev => 
        prev.map((result, index) => 
          index === 0 ? { 
            ...result, 
            error: error instanceof Error ? error.message : 'Unknown error', 
            loading: false 
          } : result
        )
      );
      
      toast.error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getApiMethod = (endpoint: string, method: string) => {
    // Map endpoints to apiClient methods
    const endpointMap: Record<string, string> = {
      '/ultravox-health-check': 'check_voice_api_health2',
      '/get-agents': 'get_agent_profiles_endpoint',
      '/create-agent': 'create_agent',
      '/get-voice-types': 'get_voice_types',
      '/test-agent-call': 'test_agent_call',
      '/webhook-handler': 'webhook_handler'
    };
    
    return endpointMap[endpoint];
  };

  const executeApiMethod = async (methodName: string, request: APIRequest) => {
    // Execute apiClient methods
    switch (methodName) {
      case 'check_voice_api_health2':
        return await apiClient.check_voice_api_health2();
      case 'get_agent_profiles_endpoint':
        return await apiClient.get_agent_profiles_endpoint();
      case 'get_voice_types':
        return await apiClient.get_voice_types();
      case 'create_agent':
        return await apiClient.create_agent(JSON.parse(request.body || '{}'));
      case 'test_agent_call':
        return await apiClient.test_agent_call(JSON.parse(request.body || '{}'));
      case 'webhook_handler':
        return await apiClient.webhook_handler(JSON.parse(request.body || '{}'));
      default:
        throw new Error(`Unknown api method: ${methodName}`);
    }
  };

  const copyResponse = (response: APIResponse) => {
    navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
    toast.success('Response copied to clipboard');
  };

  const addHeader = () => {
    const key = prompt('Header name:');
    const value = prompt('Header value:');
    if (key && value) {
      setCurrentRequest({
        ...currentRequest,
        headers: { ...currentRequest.headers, [key]: value }
      });
    }
  };

  const removeHeader = (key: string) => {
    const { [key]: removed, ...rest } = currentRequest.headers;
    setCurrentRequest({ ...currentRequest, headers: rest });
  };

  const clearResults = () => {
    setTestResults([]);
    toast.info('Test results cleared');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Terminal className="h-5 w-5" style={{ color: colors.brand.purpleLight }} />
            API Testing Console
          </h3>
          <p style={{ color: colors.text.secondary }} className="mt-1">
            Test Ultravox API endpoints, debug requests, and monitor responses in real-time.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">Request Builder</TabsTrigger>
          <TabsTrigger value="saved">Saved Requests</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        {/* Request Builder Tab */}
        <TabsContent value="test" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Configuration */}
            <Card style={{
              backgroundColor: `rgba(30, 30, 30, 0.5)`,
              border: `1px solid rgba(124, 93, 250, 0.3)`
            }}>
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Request Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="w-32">
                    <Select value={currentRequest.method} onValueChange={(value) => 
                      setCurrentRequest({ ...currentRequest, method: value as any })
                    }>
                      <SelectTrigger className="bg-[rgba(20,20,20,0.5)] border-[rgba(124,93,250,0.2)] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    value={currentRequest.endpoint}
                    onChange={(e) => setCurrentRequest({ ...currentRequest, endpoint: e.target.value })}
                    className="flex-1 bg-[rgba(20,20,20,0.5)] border-[rgba(124,93,250,0.2)] text-white"
                    placeholder="/api/endpoint"
                  />
                </div>
                
                <div>
                  <Label className="text-white">Request Name</Label>
                  <Input
                    value={currentRequest.name}
                    onChange={(e) => setCurrentRequest({ ...currentRequest, name: e.target.value })}
                    className="mt-1 bg-[rgba(20,20,20,0.5)] border-[rgba(124,93,250,0.2)] text-white"
                    placeholder="My API Request"
                  />
                </div>
                
                {/* Headers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-white">Headers</Label>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={addHeader}
                      className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Object.entries(currentRequest.headers).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-[rgba(20,20,20,0.5)] rounded border border-[rgba(124,93,250,0.2)]">
                        <code className="text-xs flex-1 text-white">{key}: {value}</code>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeHeader(key)}
                          className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Request Body */}
                {(currentRequest.method === 'POST' || currentRequest.method === 'PUT' || currentRequest.method === 'PATCH') && (
                  <div>
                    <Label className="text-white">Request Body (JSON)</Label>
                    <Textarea
                      value={currentRequest.body || ''}
                      onChange={(e) => setCurrentRequest({ ...currentRequest, body: e.target.value })}
                      className="mt-1 bg-[rgba(20,20,20,0.5)] border-[rgba(124,93,250,0.2)] text-white font-mono text-sm"
                      placeholder='{\n  "key": "value"\n}'
                      rows={6}
                    />
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={executeRequest}
                    className="flex-1 bg-[rgba(124,93,250,0.2)] text-white hover:bg-[rgba(124,93,250,0.3)] border border-[rgba(124,93,250,0.3)]"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Execute Request
                  </Button>
                  <Button 
                    onClick={saveRequest}
                    variant="outline"
                    className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Common Endpoints */}
            <Card style={{
              backgroundColor: `rgba(30, 30, 30, 0.5)`,
              border: `1px solid rgba(124, 93, 250, 0.3)`
            }}>
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Common Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {commonEndpoints.map((endpoint, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-[rgba(20,20,20,0.5)] rounded border border-[rgba(124,93,250,0.2)] cursor-pointer hover:bg-[rgba(124,93,250,0.1)] transition-colors"
                      onClick={() => loadCommonEndpoint(endpoint)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium text-sm">{endpoint.name}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            endpoint.method === 'GET' ? 'border-green-500/30 text-green-400' :
                            endpoint.method === 'POST' ? 'border-blue-500/30 text-blue-400' :
                            endpoint.method === 'PATCH' ? 'border-yellow-500/30 text-yellow-400' :
                            endpoint.method === 'DELETE' ? 'border-red-500/30 text-red-400' :
                            'border-gray-500/30 text-gray-400'
                          }`}
                        >
                          {endpoint.method}
                        </Badge>
                      </div>
                      <code className="text-xs" style={{ color: colors.text.secondary }}>
                        {endpoint.endpoint}
                      </code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Saved Requests Tab */}
        <TabsContent value="saved" className="space-y-4">
          <Card style={{
            backgroundColor: `rgba(30, 30, 30, 0.5)`,
            border: `1px solid rgba(124, 93, 250, 0.3)`
          }}>
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Save className="h-4 w-4" />
                Saved Requests ({savedRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {savedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.secondary }} />
                  <h4 className="text-white font-medium mb-2">No saved requests</h4>
                  <p style={{ color: colors.text.secondary }}>Save requests from the Request Builder to access them later</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {savedRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="p-3 bg-[rgba(20,20,20,0.5)] rounded border border-[rgba(124,93,250,0.2)]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              request.method === 'GET' ? 'border-green-500/30 text-green-400' :
                              request.method === 'POST' ? 'border-blue-500/30 text-blue-400' :
                              request.method === 'PATCH' ? 'border-yellow-500/30 text-yellow-400' :
                              request.method === 'DELETE' ? 'border-red-500/30 text-red-400' :
                              'border-gray-500/30 text-gray-400'
                            }`}
                          >
                            {request.method}
                          </Badge>
                          <span className="text-white font-medium">{request.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => loadRequest(request)}
                            className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
                          >
                            Load
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteRequest(request.id)}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <code className="text-xs" style={{ color: colors.text.secondary }}>
                        {request.endpoint}
                      </code>
                      {request.timestamp && (
                        <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: colors.text.muted }}>
                          <Clock className="h-3 w-3" />
                          <span>Saved {new Date(request.timestamp).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">Test Results ({testResults.length})</h4>
            {testResults.length > 0 && (
              <Button 
                variant="outline" 
                onClick={clearResults}
                className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Results
              </Button>
            )}
          </div>
          
          {testResults.length === 0 ? (
            <Card style={{
              backgroundColor: `rgba(30, 30, 30, 0.5)`,
              border: `1px solid rgba(124, 93, 250, 0.3)`
            }}>
              <CardContent className="p-8">
                <div className="text-center">
                  <Terminal className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.secondary }} />
                  <h4 className="text-white font-medium mb-2">No test results</h4>
                  <p style={{ color: colors.text.secondary }}>Execute requests to see results here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <Card key={index} style={{
                  backgroundColor: `rgba(30, 30, 30, 0.5)`,
                  border: `1px solid rgba(124, 93, 250, 0.3)`
                }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            result.request.method === 'GET' ? 'border-green-500/30 text-green-400' :
                            result.request.method === 'POST' ? 'border-blue-500/30 text-blue-400' :
                            result.request.method === 'PATCH' ? 'border-yellow-500/30 text-yellow-400' :
                            result.request.method === 'DELETE' ? 'border-red-500/30 text-red-400' :
                            'border-gray-500/30 text-gray-400'
                          }`}
                        >
                          {result.request.method}
                        </Badge>
                        <span className="text-white font-medium">{result.request.name}</span>
                        <code className="text-xs" style={{ color: colors.text.secondary }}>
                          {result.request.endpoint}
                        </code>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {result.loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" style={{ color: colors.brand.purpleLight }} />
                        ) : result.error ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : result.response ? (
                          <CheckCircle className="h-4 w-4" style={{ color: globalColors.status.success }} />
                        ) : null}
                        
                        {result.response && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyResponse(result.response!)}
                            className="text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {result.loading ? (
                      <div className="flex items-center gap-2 text-sm" style={{ color: colors.text.secondary }}>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Executing request...</span>
                      </div>
                    ) : result.error ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                          <span className="text-red-400 font-medium">Error</span>
                        </div>
                        <p className="text-red-300 text-sm">{result.error}</p>
                      </div>
                    ) : result.response ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                          <Badge 
                            variant="outline" 
                            className={`${
                              result.response.status >= 200 && result.response.status < 300 ? 'border-green-500/30 text-green-400' :
                              result.response.status >= 400 ? 'border-red-500/30 text-red-400' :
                              'border-yellow-500/30 text-yellow-400'
                            }`}
                          >
                            {result.response.status} {result.response.statusText}
                          </Badge>
                          <span style={{ color: colors.text.secondary }}>
                            {result.response.duration}ms
                          </span>
                          <span style={{ color: colors.text.muted }}>
                            {new Date(result.response.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div>
                          <Label className="text-white text-sm">Response Body</Label>
                          <pre className="mt-1 p-3 bg-[rgba(20,20,20,0.5)] border border-[rgba(124,93,250,0.2)] rounded text-xs text-white overflow-x-auto max-h-64 overflow-y-auto">
                            {JSON.stringify(result.response.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
