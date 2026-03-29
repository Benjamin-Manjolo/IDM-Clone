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

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const theme = settings?.theme ?? 'system';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', useDark);
  }, [settings?.theme]);

  // Listen for menu navigation events from main process
  useEffect(() => {
    const off = window.idm.on('ui:nav', (path: string) => navigate(path));
    return off;
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
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