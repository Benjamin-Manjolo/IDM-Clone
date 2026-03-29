import React from 'react';
import { formatSpeed } from '../utils/format';
import { speedToColor } from '../utils/speed';

interface SpeedIndicatorProps {
  bps: number;
  showIcon?: boolean;
  className?: string;
}

export const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({ bps, showIcon = true, className = '' }) => {
  const color = speedToColor(bps);

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs font-medium ${color} ${className}`}>
      {showIcon && bps > 0 && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {formatSpeed(bps)}
    </span>
  );
};