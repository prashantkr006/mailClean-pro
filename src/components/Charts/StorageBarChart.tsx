import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SenderStats } from '@/types/domain';
import { formatBytes } from '@/utils/format';

interface StorageBarChartProps {
  data: SenderStats[];
}

export function StorageBarChart({ data }: StorageBarChartProps) {
  const chartData = data
    .filter((sender) => sender.totalSize > 0)
    .slice(0, 10)
    .map((sender) => ({
      name: sender.domain,
      size: sender.totalSize,
      count: sender.count,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Top Senders by Storage</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">Top Senders by Storage</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis
            tickFormatter={(value) => formatBytes(value)}
            fontSize={12}
          />
          <Tooltip
            formatter={(value: number) => [formatBytes(value), 'Storage']}
            labelFormatter={(label) => `Domain: ${label}`}
          />
          <Bar dataKey="size" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}