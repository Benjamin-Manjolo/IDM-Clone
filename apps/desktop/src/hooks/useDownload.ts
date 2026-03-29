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

  // Bootstrap: load existing downloads
  useEffect(() => {
    window.idm.download.list().then((items: any[]) => {
      store.setItems(items);
    });

    const offProgress  = window.idm.on('download:progress',   store.applyProgress);
    const offAdded     = window.idm.on('download:added',      store.upsert);
    const offUpdated   = window.idm.on('download:updated',    store.upsert);
    const offCompleted = window.idm.on('download:completed',  store.upsert);

    return () => { offProgress(); offAdded(); offUpdated(); offCompleted(); };
  }, []);

  const add = useCallback(async (opts: AddDownloadOptions) => {
    return window.idm.download.add(opts);
  }, []);

  const pause    = useCallback((id: string) => window.idm.download.pause(id),   []);
  const resume   = useCallback((id: string) => window.idm.download.resume(id),  []);
  const cancel   = useCallback((id: string) => window.idm.download.cancel(id),  []);
  const remove   = useCallback((id: string, del?: boolean) => {
    window.idm.download.remove(id, del);
    store.remove(id);
  }, []);
  const open     = useCallback((id: string) => window.idm.download.open(id),    []);
  const openDir  = useCallback((id: string) => window.idm.download.openDir(id), []);

  const pauseAll = useCallback(() => {
    Object.values(useDownloadsStore.getState().items)
      .filter(d => d.status === 'downloading')
      .forEach(d => window.idm.download.pause(d.id));
  }, []);

  const resumeAll = useCallback(() => {
    Object.values(useDownloadsStore.getState().items)
      .filter(d => d.status === 'paused')
      .forEach(d => window.idm.download.resume(d.id));
  }, []);

  return {
    items:      store.filtered(),
    stats:      store.stats(),
    selected:   store.selectedIds,
    select:     store.select,
    clearSelection: store.clearSelection,
    setFilterCategory: store.setFilterCategory,
    setFilterStatus:   store.setFilterStatus,
    setSearch:  store.setSearch,
    add, pause, resume, cancel, remove, open, openDir, pauseAll, resumeAll,
  };
}
