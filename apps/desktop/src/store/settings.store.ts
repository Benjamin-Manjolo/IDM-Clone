/**
 * settings.store.ts
 * Zustand store for application settings.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AppSettings } from '@idm/shared';

interface SettingsState {
  settings: AppSettings | null;
  setSettings: (s: AppSettings) => void;
  patchSettings: (partial: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  immer((set) => ({
    settings: null,

    setSettings: (s) =>
      set((state) => { state.settings = s; }),

    patchSettings: (partial) =>
      set((state) => {
        if (!state.settings) return;
        Object.assign(state.settings, partial);
      }),
  }))
);
