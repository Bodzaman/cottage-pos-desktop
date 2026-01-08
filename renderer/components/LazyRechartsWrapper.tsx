import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load recharts components to reduce initial bundle size
const LazyBarChart = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.BarChart 
  }))
);

const LazyResponsiveContainer = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.ResponsiveContainer 
  }))
);

const LazyBar = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.Bar 
  }))
);

const LazyXAxis = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.XAxis 
  }))
);

const LazyYAxis = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.YAxis 
  }))
);

const LazyCartesianGrid = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.CartesianGrid 
  }))
);

const LazyTooltip = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.Tooltip 
  }))
);

interface LazyRechartsWrapperProps {
  data: any[];
  dataKey: string;
  fill: string;
  height?: number;
  width?: string;
}

const ChartSkeleton = () => (
  <Card className="bg-gray-900 border-gray-800">
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    </CardContent>
  </Card>
);

export function LazyRechartsWrapper({ 
  data, 
  dataKey, 
  fill, 
  height = 300, 
  width = '100%' 
}: LazyRechartsWrapperProps) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <LazyResponsiveContainer width={width} height={height}>
        <LazyBarChart data={data}>
          <LazyCartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
          <LazyXAxis 
            dataKey="date" 
            tick={{ fill: '#9CA3AF' }}
            axisLine={{ stroke: '#374151' }}
            tickLine={{ stroke: '#374151' }}
          />
          <LazyYAxis 
            tick={{ fill: '#9CA3AF' }}
            axisLine={{ stroke: '#374151' }}
            tickLine={{ stroke: '#374151' }}
          />
          <LazyTooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
            labelStyle={{ color: '#F9FAFB' }}
          />
          <LazyBar 
            dataKey={dataKey} 
            fill={fill} 
            radius={[4, 4, 0, 0]}
          />
        </LazyBarChart>
      </LazyResponsiveContainer>
    </Suspense>
  );
}

export { LazyRechartsWrapper };