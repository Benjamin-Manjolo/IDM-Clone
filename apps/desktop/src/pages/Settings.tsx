import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settings.store';
import type { AppSettings } from '@idm/shared';

type Tab = 'connection' | 'save' | 'integration' | 'notifications' | 'antivirus' | 'general';

const TABS: Array<{ key: Tab; icon: string; label: string }> = [
  { key: 'general',      icon: '⚙️',  label: 'General' },
  { key: 'connection',   icon: '🔗', label: 'Connection' },
  { key: 'save',         icon: '💾', label: 'Save Paths' },
  { key: 'integration',  icon: '🧩', label: 'Integration' },
  { key: 'notifications',icon: '🔔', label: 'Notifications' },
  { key: 'antivirus',    icon: '🛡',  label: 'Antivirus' },
];

export const Settings: React.FC = () => {
  const { settings, setSettings, patchSettings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.idm.settings.get().then((s: AppSettings) => setSettings(s));
  }, []);

  const patch = async (partial: Partial<AppSettings>) => {
    patchSettings(partial);
    const updated = await window.idm.settings.set(partial);
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!settings) return <div className="flex items-center justify-center h-full text-gray-400">Loading settings…</div>;

  const s = settings;

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Tab sidebar */}
      <div className="w-44 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-2 space-y-0.5">
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-600">Settings</p>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg">
          {saved && (
            <div className="mb-4 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
              ✓ Settings saved
            </div>
          )}

          {/* ── General ── */}
          {activeTab === 'general' && (
            <Section title="General">
              <Row label="Theme">
                <select value={s.theme} onChange={e => patch({ theme: e.target.value as any })} className={sel}>
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </Row>
              <Toggle label="Start minimized to tray" checked={s.startMinimized} onChange={v => patch({ startMinimized: v })} />
              <Toggle label="Minimize to tray on close" checked={s.minimizeToTray} onChange={v => patch({ minimizeToTray: v })} />
              <Toggle label="Show speed in tray" checked={s.showSpeedInTray} onChange={v => patch({ showSpeedInTray: v })} />
              <Toggle label="Check for updates automatically" checked={s.checkForUpdates} onChange={v => patch({ checkForUpdates: v })} />
            </Section>
          )}

          {/* ── Connection ── */}
          {activeTab === 'connection' && (
            <Section title="Connection">
              <Row label={`Max connections per download: ${s.connection.maxConnections}`}>
                <input type="range" min={1} max={32} value={s.connection.maxConnections}
                  onChange={e => patch({ connection: { ...s.connection, maxConnections: +e.target.value } })} className="w-full accent-blue-600" />
              </Row>
              <Row label={`Max concurrent downloads: ${s.connection.maxConcurrentDownloads}`}>
                <input type="range" min={1} max={10} value={s.connection.maxConcurrentDownloads}
                  onChange={e => patch({ connection: { ...s.connection, maxConcurrentDownloads: +e.target.value } })} className="w-full accent-blue-600" />
              </Row>
              <Row label="Global speed limit (KB/s, 0 = unlimited)">
                <input type="number" min={0} value={Math.round(s.connection.globalSpeedLimit / 1024)}
                  onChange={e => patch({ connection: { ...s.connection, globalSpeedLimit: +e.target.value * 1024 } })} className={inp} />
              </Row>
              <Row label="Connection timeout (seconds)">
                <input type="number" min={5} max={120} value={Math.round(s.connection.connectionTimeout / 1000)}
                  onChange={e => patch({ connection: { ...s.connection, connectionTimeout: +e.target.value * 1000 } })} className={inp} />
              </Row>
              <Row label="Retry count">
                <input type="number" min={0} max={20} value={s.connection.retryCount}
                  onChange={e => patch({ connection: { ...s.connection, retryCount: +e.target.value } })} className={inp} />
              </Row>

              <Toggle label="Use proxy" checked={s.connection.useProxy} onChange={v => patch({ connection: { ...s.connection, useProxy: v } })} />
              {s.connection.useProxy && (
                <div className="ml-4 space-y-3 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Row label="Proxy type">
                    <select value={s.connection.proxyType} onChange={e => patch({ connection: { ...s.connection, proxyType: e.target.value as any } })} className={sel}>
                      <option value="http">HTTP</option>
                      <option value="socks4">SOCKS4</option>
                      <option value="socks5">SOCKS5</option>
                    </select>
                  </Row>
                  <Row label="Host">
                    <input type="text" value={s.connection.proxyHost ?? ''} onChange={e => patch({ connection: { ...s.connection, proxyHost: e.target.value } })} className={inp} placeholder="proxy.example.com" />
                  </Row>
                  <Row label="Port">
                    <input type="number" value={s.connection.proxyPort ?? 8080} onChange={e => patch({ connection: { ...s.connection, proxyPort: +e.target.value } })} className={inp} />
                  </Row>
                </div>
              )}
            </Section>
          )}

          {/* ── Save paths ── */}
          {activeTab === 'save' && (
            <Section title="Save Paths">
              <Row label="Default download folder">
                <div className="flex gap-2">
                  <input type="text" value={s.save.defaultDownloadDir}
                    onChange={e => patch({ save: { ...s.save, defaultDownloadDir: e.target.value } })} className={`${inp} flex-1`} />
                  <button onClick={async () => {
                    const dir = await window.idm.system.openDir();
                    if (dir) patch({ save: { ...s.save, defaultDownloadDir: dir } });
                  }} className={browseBtn}>Browse</button>
                </div>
              </Row>
              <Row label="Temp folder">
                <div className="flex gap-2">
                  <input type="text" value={s.save.tempDir}
                    onChange={e => patch({ save: { ...s.save, tempDir: e.target.value } })} className={`${inp} flex-1`} />
                  <button onClick={async () => {
                    const dir = await window.idm.system.openDir();
                    if (dir) patch({ save: { ...s.save, tempDir: dir } });
                  }} className={browseBtn}>Browse</button>
                </div>
              </Row>
              <Row label="Filename conflict">
                <select value={s.save.filenameConflict} onChange={e => patch({ save: { ...s.save, filenameConflict: e.target.value as any } })} className={sel}>
                  <option value="rename">Auto rename</option>
                  <option value="overwrite">Overwrite</option>
                  <option value="skip">Skip</option>
                  <option value="ask">Ask each time</option>
                </select>
              </Row>
              <Toggle label="Create category subfolders" checked={s.save.createCategoryDirs} onChange={v => patch({ save: { ...s.save, createCategoryDirs: v } })} />
              <Toggle label="Delete incomplete files on cancel" checked={s.save.deleteIncomplete} onChange={v => patch({ save: { ...s.save, deleteIncomplete: v } })} />
            </Section>
          )}

          {/* ── Integration ── */}
          {activeTab === 'integration' && (
            <Section title="Browser Integration">
              <Toggle label="Enable browser extension integration" checked={s.integration.browserExtensionEnabled} onChange={v => patch({ integration: { ...s.integration, browserExtensionEnabled: v } })} />
              <Toggle label="Catch all downloads automatically" checked={s.integration.catchAllDownloads} onChange={v => patch({ integration: { ...s.integration, catchAllDownloads: v } })} />
              <Toggle label="Monitor clipboard for URLs" checked={s.integration.monitorClipboard} onChange={v => patch({ integration: { ...s.integration, monitorClipboard: v } })} />
              <Row label="Extension port">
                <input type="number" value={s.integration.extensionPort}
                  onChange={e => patch({ integration: { ...s.integration, extensionPort: +e.target.value } })} className={inp} />
              </Row>
              <Row label="Min file size to intercept (KB)">
                <input type="number" min={0} value={Math.round(s.integration.minFileSizeToCatch / 1024)}
                  onChange={e => patch({ integration: { ...s.integration, minFileSizeToCatch: +e.target.value * 1024 } })} className={inp} />
              </Row>
            </Section>
          )}

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (
            <Section title="Notifications">
              <Toggle label="Play sound on download complete" checked={s.notifications.soundOnComplete} onChange={v => patch({ notifications: { ...s.notifications, soundOnComplete: v } })} />
              <Toggle label="Play sound on error" checked={s.notifications.soundOnError} onChange={v => patch({ notifications: { ...s.notifications, soundOnError: v } })} />
              <Toggle label="Show desktop notifications" checked={s.notifications.showDesktopNotification} onChange={v => patch({ notifications: { ...s.notifications, showDesktopNotification: v } })} />
            </Section>
          )}

          {/* ── Antivirus ── */}
          {activeTab === 'antivirus' && (
            <Section title="Antivirus Scanning">
              <Toggle label="Scan downloaded files automatically" checked={s.antivirus.enabled} onChange={v => patch({ antivirus: { ...s.antivirus, enabled: v } })} />
              {s.antivirus.enabled && (
                <div className="space-y-3 mt-2">
                  <Row label="Scanner executable path">
                    <div className="flex gap-2">
                      <input type="text" value={s.antivirus.scannerPath ?? ''}
                        onChange={e => patch({ antivirus: { ...s.antivirus, scannerPath: e.target.value } })} className={`${inp} flex-1`} placeholder="/usr/bin/clamscan" />
                      <button onClick={async () => {
                        const f = await window.idm.system.saveFile('');
                        if (f) patch({ antivirus: { ...s.antivirus, scannerPath: f } });
                      }} className={browseBtn}>Browse</button>
                    </div>
                  </Row>
                  <Row label="Scanner arguments">
                    <input type="text" value={s.antivirus.scannerArgs ?? ''}
                      onChange={e => patch({ antivirus: { ...s.antivirus, scannerArgs: e.target.value } })} className={inp} placeholder="%f" />
                  </Row>
                </div>
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const sel = 'w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const inp = 'w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const browseBtn = 'px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-4">
    <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">{title}</h2>
    {children}
  </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">{label}</label>
    {children}
  </div>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between py-1 cursor-pointer group">
    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>
    <div onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </div>
  </label>
);