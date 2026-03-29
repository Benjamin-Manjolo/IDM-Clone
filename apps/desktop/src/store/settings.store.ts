import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AppSettings } from '@idm/shared';

interface SettingsState {
  settings: AppSettings | null;
  loaded: boolean;
  setSettings: (s: AppSettings) => void;
  patchSettings: (partial: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  immer((set) => ({
    settings: null,
    loaded: false,

    setSettings: (s) => set((st) => {
      st.settings = s;
      st.loaded = true;
    }),

    patchSettings: (partial) => set((st) => {
      if (!st.settings) return;
      Object.assign(st.settings, partial);
    }),
  }))
);