import React, { useEffect } from 'react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Queue } from './pages/Queue';
import { Scheduler } from './pages/Scheduler';
import { Grabber } from './pages/Grabber';
import { Categories } from './pages/Categories';
import { Settings } from './pages/Settings';
import { useSettingsStore } from './store/settings.store';

const AppInner: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();

  // Always use dark theme (IDM style)
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.background = 'var(--bg-deep, #0a0e1a)';
  }, []);

  useEffect(() => {
    const off = window.idm?.on('ui:nav', (path: string) => navigate(path));
    return off;
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-deep)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--sans)',
    }}>
      {/* Title bar drag region for Electron */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 0,
        WebkitAppRegion: 'drag' as any,
        zIndex: 9999, pointerEvents: 'none',
      }} />

      <Sidebar />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/queue"      element={<Queue />} />
          <Route path="/scheduler"  element={<Scheduler />} />
          <Route path="/grabber"    element={<Grabber />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings"   element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <MemoryRouter>
    <AppInner />
  </MemoryRouter>
);

export default App;
