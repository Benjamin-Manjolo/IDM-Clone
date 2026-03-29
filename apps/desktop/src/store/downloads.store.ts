import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DownloadItem, DownloadProgress, DownloadCategory, DownloadStatus } from '@idm/shared';

interface DownloadsState {
  items: Record<string, DownloadItem>;
  selectedIds: Set<string>;
  filterCategory: DownloadCategory | 'all';
  filterStatus: DownloadStatus | 'all';
  searchQuery: string;

  // Actions
  setItems: (items: DownloadItem[]) => void;
  upsert: (item: DownloadItem) => void;
  applyProgress: (p: DownloadProgress) => void;
  remove: (id: string) => void;
  select: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  setFilterCategory: (c: DownloadCategory | 'all') => void;
  setFilterStatus: (s: DownloadStatus | 'all') => void;
  setSearch: (q: string) => void;

  // Derived
  filtered: () => DownloadItem[];
  stats: () => { total: number; active: number; completed: number; speed: number };
}

export const useDownloadsStore = create<DownloadsState>()(
  immer((set, get) => ({
    items: {},
    selectedIds: new Set(),
    filterCategory: 'all',
    filterStatus: 'all',
    searchQuery: '',

    setItems: (items) => set((s) => {
      s.items = {};
      items.forEach(i => { s.items[i.id] = i; });
    }),

    upsert: (item) => set((s) => { s.items[item.id] = item; }),

    applyProgress: (p) => set((s) => {
      const item = s.items[p.id];
      if (!item) return;
      item.downloadedSize = p.downloadedSize;
      item.speed = p.speed;
      item.timeRemaining = p.timeRemaining;
      item.segments = p.segments;
      item.status = p.status;
    }),

    remove: (id) => set((s) => {
      delete s.items[id];
      s.selectedIds.delete(id);
    }),

    select: (id, multi = false) => set((s) => {
      if (!multi) {
        s.selectedIds = new Set([id]);
      } else {
        if (s.selectedIds.has(id)) s.selectedIds.delete(id);
        else s.selectedIds.add(id);
      }
    }),

    clearSelection: () => set((s) => { s.selectedIds = new Set(); }),

    setFilterCategory: (c) => set((s) => { s.filterCategory = c; }),
    setFilterStatus:   (s2) => set((s) => { s.filterStatus = s2; }),
    setSearch:         (q) => set((s) => { s.searchQuery = q; }),

    filtered: () => {
      const { items, filterCategory, filterStatus, searchQuery } = get();
      return Object.values(items).filter(item => {
        if (filterCategory !== 'all' && item.category !== filterCategory) return false;
        if (filterStatus !== 'all' && item.status !== filterStatus) return false;
        if (searchQuery && !item.filename.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      }).sort((a, b) => b.createdAt - a.createdAt);
    },

    stats: () => {
      const all = Object.values(get().items);
      return {
        total:     all.length,
        active:    all.filter(i => i.status === 'downloading').length,
        completed: all.filter(i => i.status === 'completed').length,
        speed:     all.filter(i => i.status === 'downloading').reduce((s, i) => s + i.speed, 0),
      };
    },
  }))
);
