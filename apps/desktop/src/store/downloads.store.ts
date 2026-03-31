/**
 * downloads.store.ts
 *
 * Zustand store for all download items.
 * Handles filtering, selection, real-time progress updates, and stats.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DownloadItem, DownloadProgress, DownloadCategory, DownloadStatus } from '@idm/shared';

interface DownloadsState {
  // Raw item map (id → item) for O(1) lookups
  items: Record<string, DownloadItem>;

  // UI filter state
  filterCategory: DownloadCategory | 'all';
  filterStatus: DownloadStatus | 'all';
  searchQuery: string;

  // Selection
  selectedIds: Set<string>;

  // Actions — items
  setItems: (items: DownloadItem[]) => void;
  upsert: (item: DownloadItem) => void;
  remove: (id: string) => void;
  applyProgress: (progress: DownloadProgress) => void;

  // Actions — filters
  setFilterCategory: (cat: DownloadCategory | 'all') => void;
  setFilterStatus: (status: DownloadStatus | 'all') => void;
  setSearch: (q: string) => void;

  // Actions — selection
  select: (id: string, multi: boolean) => void;
  clearSelection: () => void;

  // Derived
  filtered: () => DownloadItem[];
  stats: () => {
    total: number;
    active: number;
    completed: number;
    failed: number;
    speed: number;
    totalSize: number;
    downloadedSize: number;
  };
}

export const useDownloadsStore = create<DownloadsState>()(
  immer((set, get) => ({
    items: {},
    filterCategory: 'all',
    filterStatus: 'all',
    searchQuery: '',
    selectedIds: new Set<string>(),

    // ── Item mutations ────────────────────────────────────────────────────
    setItems: (items) =>
      set((s) => {
        s.items = {};
        for (const item of items) s.items[item.id] = item;
      }),

    upsert: (item) =>
      set((s) => {
        s.items[item.id] = item;
      }),

    remove: (id) =>
      set((s) => {
        delete s.items[id];
        s.selectedIds.delete(id);
      }),

    applyProgress: (progress) =>
      set((s) => {
        const item = s.items[progress.id];
        if (!item) return;
        item.downloadedSize = progress.downloadedSize;
        item.speed = progress.speed;
        item.timeRemaining = progress.timeRemaining;
        item.segments = progress.segments;
        item.status = progress.status;
      }),

    // ── Filter mutations ──────────────────────────────────────────────────
    setFilterCategory: (cat) =>
      set((s) => { s.filterCategory = cat; }),

    setFilterStatus: (status) =>
      set((s) => { s.filterStatus = status; }),

    setSearch: (q) =>
      set((s) => { s.searchQuery = q; }),

    // ── Selection mutations ───────────────────────────────────────────────
    select: (id, multi) =>
      set((s) => {
        if (multi) {
          if (s.selectedIds.has(id)) {
            s.selectedIds.delete(id);
          } else {
            s.selectedIds.add(id);
          }
        } else {
          const wasOnly = s.selectedIds.size === 1 && s.selectedIds.has(id);
          s.selectedIds = new Set(wasOnly ? [] : [id]);
        }
      }),

    clearSelection: () =>
      set((s) => { s.selectedIds = new Set(); }),

    // ── Derived ───────────────────────────────────────────────────────────
    filtered: () => {
      const { items, filterCategory, filterStatus, searchQuery } = get();
      let list = Object.values(items);

      if (filterCategory !== 'all') {
        list = list.filter((d) => d.category === filterCategory);
      }
      if (filterStatus !== 'all') {
        list = list.filter((d) => d.status === filterStatus);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(
          (d) =>
            d.filename.toLowerCase().includes(q) ||
            d.url.toLowerCase().includes(q)
        );
      }

      // Sort: downloading first, then by createdAt desc
      return list.sort((a, b) => {
        const order: Record<string, number> = {
          downloading: 0, paused: 1, queued: 2,
          merging: 3, checking: 4, error: 5, completed: 6,
        };
        const ao = order[a.status] ?? 7;
        const bo = order[b.status] ?? 7;
        if (ao !== bo) return ao - bo;
        return b.createdAt - a.createdAt;
      });
    },

    stats: () => {
      const items = Object.values(get().items);
      const active = items.filter((d) => d.status === 'downloading');
      return {
        total: items.length,
        active: active.length,
        completed: items.filter((d) => d.status === 'completed').length,
        failed: items.filter((d) => d.status === 'error').length,
        speed: active.reduce((s, d) => s + (d.speed ?? 0), 0),
        totalSize: items.reduce((s, d) => s + Math.max(0, d.totalSize), 0),
        downloadedSize: items.reduce((s, d) => s + d.downloadedSize, 0),
      };
    },
  }))
);
