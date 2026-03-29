import React from 'react';
import { useDownload } from '../hooks/useDownload';
import { DownloadList } from '../components/DownloadList';
import { Toolbar } from '../components/Toolbar';
import { CategoryTabs } from '../components/CategoryTabs';
import { useDownloadsStore } from '../store/downloads.store';
import type { DownloadCategory } from '@idm/shared';

export const Home: React.FC = () => {
  const {
    items, stats, selected, select, clearSelection,
    add, pause, resume, cancel, remove, open, openDir,
    pauseAll, resumeAll, setFilterCategory, setFilterStatus, setSearch,
  } = useDownload();

  const { filterCategory, searchQuery, items: allItems } = useDownloadsStore();

  // Compute per-category counts
  const counts = React.useMemo(() => {
    const all = Object.values(allItems);
    const c: Partial<Record<DownloadCategory | 'all', number>> = { all: all.length };
    all.forEach(i => { c[i.category] = (c[i.category] ?? 0) + 1; });
    return c;
  }, [allItems]);

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        stats={stats}
        onAdd={add}
        onPauseAll={pauseAll}
        onResumeAll={resumeAll}
        searchQuery={searchQuery}
        onSearch={setSearch}
      />
      <CategoryTabs
        active={filterCategory}
        onChange={setFilterCategory}
        counts={counts}
      />
      <DownloadList
        items={items}
        selectedIds={selected}
        onSelect={select}
        onPause={pause}
        onResume={resume}
        onCancel={cancel}
        onRemove={remove}
        onOpen={open}
        onOpenDir={openDir}
      />
    </div>
  );
};