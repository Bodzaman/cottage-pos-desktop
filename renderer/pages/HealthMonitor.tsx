import { useState, useEffect } from 'react';
import { apiClient } from 'app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Database,
  CreditCard,
  Brain,
  Map,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Types
interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  details: Record<string, any>;
  last_checked: string;
  error?: string;
}

interface HealthCheckResponse {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  checked_at: string;
  total_services: number;
  healthy_count: number;
  degraded_count: number;
  unhealthy_count: number;
  cached: boolean;
}

const SERVICE_ICONS: Record<string, any> = {
  supabase: Database,
  stripe: CreditCard,
  google_ai: Brain,
  google_maps: Map
};

const SERVICE_LABELS: Record<string, string> = {
  supabase: 'Supabase',
  stripe: 'Stripe',
  google_ai: 'Google AI',
  google_maps: 'Google Maps'
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  healthy: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-500', border: 'border-green-500/20' },
  degraded: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-500', border: 'border-yellow-500/20' },
  unhealthy: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-500', border: 'border-red-500/20' }
};

const STATUS_ICONS: Record<string, any> = {
  healthy: CheckCircle2,
  degraded: AlertTriangle,
  unhealthy: XCircle
};

export default function HealthMonitor() {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Fetch health status
  const fetchHealthStatus = async (forceRefresh = false) => {
    try {
      setError(null);
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const endpoint = forceRefresh ? apiClient.health_check_all() : apiClient.get_health_status();
      const response = await endpoint;
      const data = await response.json();
      
      setHealthData(data);
    } catch (err) {
      console.error('Failed to fetch health status:', err);
      setError('Failed to load health status. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchHealthStatus();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealthStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Toggle service details
  const toggleService = (service: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(service)) {
        newSet.delete(service);
      } else {
        newSet.add(service);
      }
      return newSet;
    });
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchHealthStatus(true);
  };

  // Format timestamp
  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Render service card
  const renderServiceCard = (service: ServiceHealth) => {
    const Icon = SERVICE_ICONS[service.service] || Activity;
    const StatusIcon = STATUS_ICONS[service.status];
    const colors = STATUS_COLORS[service.status];
    const isExpanded = expandedServices.has(service.service);

    return (
      <Card key={service.service} className={`border ${colors.border}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <Icon className={`h-5 w-5 ${colors.text}`} />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {SERVICE_LABELS[service.service]}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Latency: {service.latency_ms.toFixed(0)}ms
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${colors.bg} ${colors.text} border-0 font-semibold`}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {service.status.toUpperCase()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleService(service.service)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            
            {service.error && (
              <Alert className="mb-4 border-red-500/20 bg-red-500/10">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600 dark:text-red-500">
                  {service.error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Checked:</span>
                <span className="font-mono text-xs">{formatTimestamp(service.last_checked)}</span>
              </div>
              
              <Separator />
              
              <div className="font-semibold text-foreground mb-2">Details:</div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                {Object.entries(service.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start text-xs">
                    <span className="text-muted-foreground font-medium">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                    </span>
                    <span className="font-mono ml-2 text-right break-all max-w-[60%]">
                      {typeof value === 'boolean' ? (
                        value ? '✓' : '✗'
                      ) : Array.isArray(value) ? (
                        value.length > 0 ? value.join(', ') : 'None'
                      ) : (
                        String(value)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (loading && !healthData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  const overallColors = healthData ? STATUS_COLORS[healthData.overall_status] : STATUS_COLORS.unhealthy;
  const OverallStatusIcon = healthData ? STATUS_ICONS[healthData.overall_status] : XCircle;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Activity className="h-8 w-8" />
              Health Monitor
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time service health and performance monitoring
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600 dark:text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {healthData && (
          <>
            {/* Overall Status Card */}
            <Card className={`border-2 ${overallColors.border}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${overallColors.bg}`}>
                      <OverallStatusIcon className={`h-8 w-8 ${overallColors.text}`} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        System Status: {healthData.overall_status.toUpperCase()}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {healthData.healthy_count} of {healthData.total_services} services operational
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Last checked</div>
                    <div className="font-mono text-xs mt-1">
                      {formatTimestamp(healthData.checked_at)}
                    </div>
                    {healthData.cached && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Cached
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-500">
                      {healthData.healthy_count}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Healthy</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                      {healthData.degraded_count}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Degraded</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-500">
                      {healthData.unhealthy_count}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Unhealthy</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthData.services.map(service => renderServiceCard(service))}
            </div>

            {/* Footer Info */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>Monitoring {healthData.total_services} critical services</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Auto-refresh: {autoRefresh ? '30 seconds' : 'Disabled'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
