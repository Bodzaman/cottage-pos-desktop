import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Globe, Server, Monitor } from 'lucide-react';
import { colors, cardStyle } from '../../utils/designSystem';

interface DeploymentStatusCardProps {
  title: string;
  type: 'website' | 'backend' | 'desktop';
  status: 'online' | 'offline' | 'loading';
  details?: string;
  version?: string;
  url?: string;
}

const typeIcons = {
  website: Globe,
  backend: Server,
  desktop: Monitor,
};

const typeColors = {
  website: colors.brand.turquoise,
  backend: colors.brand.purple,
  desktop: colors.brand.blue,
};

export default function DeploymentStatusCard({ title, type, status, details, version, url }: DeploymentStatusCardProps) {
  const Icon = typeIcons[type];
  const color = typeColors[type];

  return (
    <Card style={{ ...cardStyle, borderLeft: `3px solid ${color}` }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: color + '15' }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: colors.text.primary }}>{title}</p>
              {details && <p className="text-xs" style={{ color: colors.text.secondary }}>{details}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {version && (
              <Badge variant="outline" className="text-xs" style={{ borderColor: color + '50', color }}>
                {version}
              </Badge>
            )}
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: colors.text.secondary }} />
            ) : status === 'online' ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Live
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                <XCircle className="h-3 w-3 mr-1" /> Down
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
