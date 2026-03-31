/**
 * useDownload.ts
 *
 * React hook that bridges the download store with the Electron IPC.
 * Handles bootstrapping, real-time event subscriptions, and all
 * download control actions.
 */
import { useEffect, useCallback } from 'react';
import { useDownloadsStore } from '../store/downloads.store';
import type { AddDownloadOptions } from '@idm/shared';

declare global {
  interface Window {
    idm: import('../../electron/preload').IDMApi;
  }
}

export function useDownload() {
  const store = useDownloadsStore();

  // ── Bootstrap & subscribe to real-time events ─────────────────────────────
  useEffect(() => {
    // Load existing downloads from main process
    window.idm.download.list().then((items: any[]) => {
      store.setItems(items ?? []);
    }).catch(console.error);

    // Real-time IPC subscriptions
    const subs = [
      window.idm.on('download:progress',  store.applyProgress),
      window.idm.on('download:added',     store.upsert),
      window.idm.on('download:updated',   store.upsert),
      window.idm.on('download:completed', store.upsert),
    ];

    return () => subs.forEach(off => off());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const add = useCallback(async (opts: AddDownloadOptions) => {
    return window.idm.download.add(opts);
  }, []);

  const addBatch = useCallback(async (urls: string[], referrer?: string) => {
    return window.idm.download.addBatch(urls, referrer);
  }, []);

  const pause   = useCallback((id: string) => window.idm.download.pause(id),   []);
  const resume  = useCallback((id: string) => window.idm.download.resume(id),  []);
  const cancel  = useCallback((id: string) => window.idm.download.cancel(id),  []);

  const remove = useCallback((id: string, del?: boolean) => {
    window.idm.download.remove(id, del);
    store.remove(id);
  }, [store]);

  const open    = useCallback((id: string) => window.idm.download.open(id),    []);
  const openDir = useCallback((id: string) => window.idm.download.openDir(id), []);

  const pauseAll = useCallback(() => {
    for (const d of Object.values(useDownloadsStore.getState().items)) {
      if (d.status === 'downloading') window.idm.download.pause(d.id);
    }
  }, []);

  const resumeAll = useCallback(() => {
    for (const d of Object.values(useDownloadsStore.getState().items)) {
      if (d.status === 'paused') window.idm.download.resume(d.id);
    }
  }, []);

  return {
    items:             store.filtered(),
    stats:             store.stats(),
    selected:          store.selectedIds,
    select:            store.select,
    clearSelection:    store.clearSelection,
    setFilterCategory: store.setFilterCategory,
    setFilterStatus:   store.setFilterStatus,
    setSearch:         store.setSearch,
    add,
    addBatch,
    pause,
    resume,
    cancel,
    remove,
    open,
    openDir,
    pauseAll,
    resumeAll,
  };
}
