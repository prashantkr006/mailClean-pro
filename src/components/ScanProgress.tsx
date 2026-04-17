import React from 'react';
import { formatNumber } from '@/utils/format';

interface ScanProgressProps {
  scanned: number;
  total: number;
  phase: string;
}

export function ScanProgress({ scanned, total, phase }: ScanProgressProps) {
  const percentage = total > 0 ? Math.min(100, Math.round((scanned / total) * 100)) : 0;
  const indeterminate = total === 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-ink">Scanning…</h3>
        <span className="text-sm text-ink-muted">
          {total > 0
            ? `${formatNumber(scanned)} / ${formatNumber(total)} (${percentage}%)`
            : formatNumber(scanned)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        {indeterminate ? (
          <div className="h-2 rounded-full bg-blue-600 animate-pulse w-1/3" />
        ) : (
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
      <p className="text-sm text-ink-muted mt-2">{phase}</p>
    </div>
  );
}
