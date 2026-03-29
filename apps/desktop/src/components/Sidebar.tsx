import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',          icon: '⬇',  label: 'Downloads' },
  { to: '/queue',     icon: '📋', label: 'Queue' },
  { to: '/scheduler', icon: '🕐', label: 'Scheduler' },
  { to: '/grabber',   icon: '🕸', label: 'Grabber' },
  { to: '/categories',icon: '🗂', label: 'Categories' },
  { to: '/settings',  icon: '⚙',  label: 'Settings', bottom: true },
];

export const Sidebar: React.FC = () => {
  const top = NAV_ITEMS.filter(n => !n.bottom);
  const bottom = NAV_ITEMS.filter(n => n.bottom);

  const renderLink = (item: typeof NAV_ITEMS[0]) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group
         ${isActive
           ? 'bg-blue-600 text-white'
           : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
         }`
      }
    >
      <span className="text-base w-5 text-center">{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  );

  return (
    <div className="w-48 flex-shrink-0 flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-gray-900 dark:text-white text-sm">IDM Clone</span>
        </div>
      </div>

      {/* Top nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {top.map(renderLink)}
      </nav>

      {/* Bottom nav */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-0.5">
        {bottom.map(renderLink)}
      </div>
    </div>
  );
};
