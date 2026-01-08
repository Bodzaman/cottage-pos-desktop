import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type DataPoint = {
  name: string;
  [key: string]: any;
};

type BarConfig = {
  dataKey: string;
  fill: string;
  name?: string;
};

interface BarChartProps {
  data: DataPoint[];
  bars: BarConfig[];
  xAxisDataKey?: string;
  rotateXAxisLabel?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  height?: number | string;
  width?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

export const ReBarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  xAxisDataKey = 'name',
  rotateXAxisLabel = false,
  showTooltip = true,
  showLegend = true,
  showGrid = true,
  height = 300,
  width = '100%',
  margin = { top: 20, right: 30, left: 20, bottom: 5 },
}) => {
  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart
        data={data}
        margin={margin}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey={xAxisDataKey} 
          angle={rotateXAxisLabel ? -45 : 0} 
          textAnchor={rotateXAxisLabel ? 'end' : 'middle'}
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={{ stroke: '#e2e8f0' }}
          {...(rotateXAxisLabel ? { height: 60 } : {})}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={{ stroke: '#e2e8f0' }}
        />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        {bars.map((bar, index) => (
          <Bar 
            key={index} 
            dataKey={bar.dataKey} 
            fill={bar.fill} 
            name={bar.name || bar.dataKey} 
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};
