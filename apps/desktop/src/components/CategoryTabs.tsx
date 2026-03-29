import React from 'react';
import type { DownloadCategory } from '@idm/shared';

const TABS: Array<{ key: DownloadCategory | 'all'; label: string; icon: string }> = [
  { key: 'all',        label: 'All',       icon: '📦' },
  { key: 'video',      label: 'Video',     icon: '🎬' },
  { key: 'audio',      label: 'Audio',     icon: '🎵' },
  { key: 'documents',  label: 'Docs',      icon: '📄' },
  { key: 'programs',   label: 'Programs',  icon: '⚙️'  },
  { key: 'compressed', label: 'Archives',  icon: '🗜'  },
  { key: 'images',     label: 'Images',    icon: '🖼'  },
  { key: 'other',      label: 'Other',     icon: '📁'  },
];

interface CategoryTabsProps {
  active: DownloadCategory | 'all';
  onChange: (cat: DownloadCategory | 'all') => void;
  counts?: Partial<Record<DownloadCategory | 'all', number>>;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ active, onChange, counts = {} }) => (
  <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-x-auto flex-shrink-0">
    {TABS.map(tab => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0
          ${active === tab.key
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
      >
        <span>{tab.icon}</span>
        <span>{tab.label}</span>
        {counts[tab.key] !== undefined && counts[tab.key]! > 0 && (
          <span className={`text-[10px] px-1 rounded-full font-bold
            ${active === tab.key ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
            {counts[tab.key]}
          </span>
        )}
      </button>
    ))}
  </div>
);
