import React, { useState, useEffect, useRef } from 'react';
import { formatSpeed, formatBytes } from '../utils/format';
import { isValidUrl } from '../utils/file';
import type { AddDownloadOptions } from '@idm/shared';

interface ToolbarProps {
  stats: { total: number; active: number; completed: number; speed: number };
  onAdd: (opts: AddDownloadOptions) => void;
  onPauseAll: () => void;
  onResumeAll: () => void;
  searchQuery: string;
  onSearch: (q: string) => void;
}

const tb: React.CSSProperties = {
  height: 48,
  background: 'var(--bg-dark)',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 10px',
  gap: 2,
  flexShrink: 0,
  userSelect: 'none',
};

const btnBase: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
  padding: '4px 12px',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  borderRadius: 4,
  fontSize: 10,
  fontFamily: 'var(--sans)',
  fontWeight: 500,
  minWidth: 52,
  transition: 'all 0.15s',
};

const TbBtn: React.FC<{
  icon: string; label: string; onClick: () => void;
  primary?: boolean; danger?: boolean; disabled?: boolean;
}> = ({ icon, label, onClick, primary, danger, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      ...btnBase,
      color: disabled ? 'var(--text-muted)' : primary ? 'var(--accent)' : danger ? 'var(--red)' : 'var(--text-secondary)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
    onMouseEnter={e => {
      if (!disabled) (e.currentTarget as HTMLElement).style.background = primary ? 'var(--accent-glow)' : 'var(--bg-hover)';
    }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
  >
    <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
    {label}
  </button>
);

const Sep = () => (
  <div style={{ width: 1, height: 30, background: 'var(--border)', margin: '0 4px' }} />
);

export const Toolbar: React.FC<ToolbarProps> = ({
  stats, onAdd, onPauseAll, onResumeAll, searchQuery, onSearch,
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const off1 = window.idm?.on('ui:add-url', () => setShowModal(true));
    const off2 = window.idm?.on('ui:pause-all', onPauseAll);
    const off3 = window.idm?.on('ui:resume-all', onResumeAll);
    return () => { off1?.(); off2?.(); off3?.(); };
  }, []);

  return (
    <>
      <div style={tb}>
        <TbBtn icon="⊕" label="Add URL" onClick={() => setShowModal(true)} primary />
        <TbBtn icon="⊞" label="Add Batch" onClick={() => {}} />
        <Sep />
        <TbBtn icon="▶" label="Resume" onClick={onResumeAll} />
        <TbBtn icon="⏹" label="Stop All" onClick={onPauseAll} disabled={stats.active === 0} />
        <TbBtn icon="🗑" label="Delete" onClick={() => {}} danger />
        <Sep />
        <TbBtn icon="🕐" label="Scheduler" onClick={() => {}} />
        <TbBtn icon="⚙" label="Options" onClick={() => {}} />

        {/* search + live stats */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="text"
            placeholder="🔍  Search downloads..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-bright)',
              borderRadius: 5,
              padding: '5px 10px',
              color: 'var(--text-primary)',
              fontSize: 12,
              width: 190,
              fontFamily: 'var(--sans)',
              outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-bright)')}
          />
          {stats.active > 0 && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse-dot 1.5s infinite' }} />
              {stats.active} active · {formatSpeed(stats.speed)}
            </span>
          )}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {stats.total} total · {stats.completed} done
          </span>
        </div>
      </div>

      {showModal && (
        <AddUrlModal
          onAdd={opts => { onAdd(opts); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

/* ── ADD URL MODAL ── */
const AddUrlModal: React.FC<{ onAdd: (opts: AddDownloadOptions) => void; onClose: () => void }> = ({ onAdd, onClose }) => {
  const [url, setUrl] = useState('');
  const [savePath, setSavePath] = useState('');
  const [maxConn, setMaxConn] = useState(8);
  const [adv, setAdv] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    navigator.clipboard.readText().then(t => {
      if (isValidUrl(t.trim())) setUrl(t.trim());
    }).catch(() => {});
  }, []);

  const valid = isValidUrl(url.trim());

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200,
    animation: 'fadeIn 0.2s ease',
  };
  const modal: React.CSSProperties = {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-bright)',
    borderRadius: 8,
    width: 520,
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  };
  const header: React.CSSProperties = {
    padding: '14px 18px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-deep)',
    border: '1px solid var(--border-bright)',
    borderRadius: 5,
    padding: '9px 12px',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: 'var(--mono)',
    outline: 'none',
    marginBottom: 14,
  };
  const label: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6, display: 'block',
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={header}>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            ⊕ Add New Download
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ padding: 18 }}>
          <label style={label}>Enter address to download</label>
          <input
            ref={inputRef}
            style={inputStyle}
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && valid && onAdd({ url: url.trim(), savePath: savePath || undefined, maxConnections: maxConn })}
            placeholder="https://  ·  ftp://  ·  magnet:..."
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-bright)')}
          />

          {/* adv toggle */}
          <button
            onClick={() => setAdv(a => !a)}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}
          >
            {adv ? '▲' : '▼'} Advanced options
          </button>

          {adv && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 5, padding: 12, marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={label}>Save to folder</label>
                  <input style={{ ...inputStyle, marginBottom: 0, fontSize: 12 }} value={savePath} onChange={e => setSavePath(e.target.value)} placeholder="~/Downloads" />
                </div>
                <div>
                  <label style={label}>Max connections: {maxConn}</label>
                  <input type="range" min={1} max={32} value={maxConn}
                    onChange={e => setMaxConn(+e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--accent)', marginTop: 8 }} />
                </div>
              </div>
            </div>
          )}

          <label style={label}>Use Authorization</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input style={{ ...inputStyle, marginBottom: 0 }} value={login} onChange={e => setLogin(e.target.value)} placeholder="Login" />
            <input style={{ ...inputStyle, marginBottom: 0 }} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          </div>
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-bright)', fontFamily: 'var(--sans)' }}>
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() => onAdd({ url: url.trim(), savePath: savePath || undefined, maxConnections: maxConn })}
            style={{ padding: '8px 18px', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: valid ? 'pointer' : 'not-allowed', background: valid ? 'var(--accent)' : 'var(--bg-card)', color: '#fff', border: 'none', fontFamily: 'var(--sans)', opacity: valid ? 1 : 0.5, boxShadow: valid ? '0 0 20px rgba(14,165,233,0.3)' : 'none' }}
          >
            Start Download
          </button>
        </div>
      </div>
    </div>
  );
};
