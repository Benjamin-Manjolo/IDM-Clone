import type { IpcMain } from 'electron';
import type { AppSettings } from '@idm/shared';
import { IPC_CHANNELS } from '@idm/shared';

export function setupSettingsIpc(
  ipc: IpcMain,
  getSettings: () => AppSettings,
  setSettings: (s: AppSettings) => void
): void {
  ipc.handle(IPC_CHANNELS.SETTINGS_GET, () => getSettings());

  ipc.handle(IPC_CHANNELS.SETTINGS_SET, (_, partial: Partial<AppSettings>) => {
    const merged = deepMerge(getSettings(), partial) as AppSettings;
    setSettings(merged);
    return merged;
  });

  ipc.handle(IPC_CHANNELS.SETTINGS_RESET, () => {
    // Caller resets by passing default; main.ts handles that
    return getSettings();
  });
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
