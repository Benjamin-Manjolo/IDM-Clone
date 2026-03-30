import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',           icon: '⬇', label: 'Downloads' },
  { to: '/queue',      icon: '📋', label: 'Queue' },
  { to: '/scheduler',  icon: '🕐', label: 'Scheduler' },
  { to: '/grabber',    icon: '🕸', label: 'Grabber' },
  { to: '/categories', icon: '🗂', label: 'Categories' },
];

const CATEGORY_ITEMS = [
  { to: '/?cat=video',      icon: '🎬', label: 'Video' },
  { to: '/?cat=audio',      icon: '🎵', label: 'Audio' },
  { to: '/?cat=documents',  icon: '📄', label: 'Documents' },
  { to: '/?cat=compressed', icon: '🗜', label: 'Archives' },
  { to: '/?cat=programs',   icon: '⚙', label: 'Programs' },
];

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 200,
    flexShrink: 0,
    background: 'var(--bg-panel)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    userSelect: 'none',
  },
  logo: {
    padding: '14px 16px 12px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'var(--display)',
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: 1,
    color: 'var(--accent)',
  },
  section: { padding: '10px 6px 4px' },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
    padding: '0 8px',
    marginBottom: 4,
  },
  bottom: {
    marginTop: 'auto',
    padding: '8px 6px',
    borderTop: '1px solid var(--border)',
  },
};

const linkBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '7px 10px',
  borderRadius: 5,
  cursor: 'pointer',
  fontSize: 13,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  marginBottom: 1,
  transition: 'all 0.15s',
};

export const Sidebar: React.FC = () => (
  <div style={styles.sidebar}>
    <div style={styles.logo}>
      <span style={{ fontSize: 20 }}>⚡</span>
      IDM CLONE
    </div>

    <div style={styles.section}>
      <div style={styles.sectionLabel}>Navigate</div>
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          style={({ isActive }) => ({
            ...linkBase,
            background: isActive ? 'var(--accent-glow)' : 'transparent',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            border: isActive ? '1px solid rgba(14,165,233,0.2)' : '1px solid transparent',
          })}
        >
          <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </div>

    <div style={{ ...styles.section, marginTop: 8 }}>
      <div style={styles.sectionLabel}>Categories</div>
      {CATEGORY_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            ...linkBase,
            background: isActive ? 'var(--accent-glow)' : 'transparent',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            border: isActive ? '1px solid rgba(14,165,233,0.2)' : '1px solid transparent',
          })}
        >
          <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </div>

    <div style={styles.bottom}>
      <NavLink
        to="/settings"
        style={({ isActive }) => ({
          ...linkBase,
          background: isActive ? 'var(--accent-glow)' : 'transparent',
          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
          border: isActive ? '1px solid rgba(14,165,233,0.2)' : '1px solid transparent',
        })}
      >
        <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>⚙</span>
        Settings
      </NavLink>
    </div>
  </div>
);
