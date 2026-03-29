import React from 'react';

interface ProgressBarProps {
  percent: number;   // 0–100
  status?: string;
  animated?: boolean;
  height?: number;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}

const colorMap = {
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  red:    'bg-red-500',
  yellow: 'bg-yellow-400',
  gray:   'bg-gray-400',
};

const statusColor: Record<string, ProgressBarProps['color']> = {
  downloading: 'blue',
  completed:   'green',
  error:       'red',
  paused:      'yellow',
  queued:      'gray',
  merging:     'blue',
  checking:    'blue',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  status = 'downloading',
  animated = true,
  height = 4,
  showLabel = false,
  color,
}) => {
  const c = color ?? statusColor[status] ?? 'blue';
  const barColor = colorMap[c];
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="w-full">
      <div
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor} ${
            animated && status === 'downloading' ? 'relative overflow-hidden' : ''
          }`}
          style={{ width: `${clamped}%` }}
        >
          {animated && status === 'downloading' && (
            <span
              className="absolute inset-0 block opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
                animation: 'shimmer 1.5s infinite',
                backgroundSize: '200% 100%',
              }}
            />
          )}
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
};