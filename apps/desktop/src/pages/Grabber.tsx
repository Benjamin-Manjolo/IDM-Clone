import React, { useState, useRef } from 'react';
import { isValidUrl } from '../utils/file';
import { useDownload } from '../hooks/useDownload';

interface GrabResult {
  url: string;
  selected: boolean;
}

export const Grabber: React.FC = () => {
  const { add } = useDownload();
  const [siteUrl, setSiteUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [stayOnDomain, setStayOnDomain] = useState(true);
  const [includeExt, setIncludeExt] = useState('');
  const [excludeExt, setExcludeExt] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<GrabResult[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [pagesVisited, setPagesVisited] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  const appendLog = (msg: string) => {
    setLog(l => [...l.slice(-99), msg]);
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 50);
  };

  const handleGrab = async () => {
    if (!isValidUrl(siteUrl)) return;
    setRunning(true);
    setResults([]);
    setLog([]);
    setPagesVisited(0);
    appendLog(`Starting crawl: ${siteUrl}`);
    appendLog(`Max depth: ${maxDepth} | Stay on domain: ${stayOnDomain}`);

    try {
      // We call the downloader through the IPC bridge.
      // In production, the main process runs the actual Crawler — here we simulate progress.
      // Integrate window.idm.grabber.start() once the IPC handler is added.
      appendLog('Crawling... (connect to main process grabber IPC for real results)');

      // Simulate found files for demo
      await new Promise(r => setTimeout(r, 800));
      const demo: GrabResult[] = [
        { url: `${siteUrl.replace(/\/$/, '')}/file1.zip`, selected: true },
        { url: `${siteUrl.replace(/\/$/, '')}/video.mp4`, selected: true },
        { url: `${siteUrl.replace(/\/$/, '')}/docs/manual.pdf`, selected: false },
      ].filter(f => {
        const ext = f.url.split('.').pop()?.toLowerCase() ?? '';
        if (includeExt.trim()) return includeExt.split(',').map(e => e.trim()).includes(ext);
        if (excludeExt.trim()) return !excludeExt.split(',').map(e => e.trim()).includes(ext);
        return true;
      });

      setResults(demo);
      setPagesVisited(3);
      appendLog(`Crawl complete. ${demo.length} files found across 3 pages.`);
    } catch (err: any) {
      appendLog(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const toggleResult = (url: string) =>
    setResults(r => r.map(x => x.url === url ? { ...x, selected: !x.selected } : x));

  const toggleAll = () => {
    const allSelected = results.every(r => r.selected);
    setResults(r => r.map(x => ({ ...x, selected: !allSelected })));
  };

  const downloadSelected = async () => {
    const selected = results.filter(r => r.selected);
    for (const r of selected) await add({ url: r.url });
    appendLog(`Added ${selected.length} files to download queue.`);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white">Site Grabber</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Crawl a website and download all matching files</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: config */}
        <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Website URL</label>
            <input type="text" value={siteUrl} onChange={e => setSiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Crawl depth: {maxDepth}</label>
            <input type="range" min={1} max={8} value={maxDepth} onChange={e => setMaxDepth(+e.target.value)} className="w-full accent-blue-600" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>Shallow</span><span>Deep</span></div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={stayOnDomain} onChange={e => setStayOnDomain(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded" />
            <span className="text-xs text-gray-700 dark:text-gray-300">Stay on same domain</span>
          </label>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Include extensions</label>
            <input type="text" value={includeExt} onChange={e => setIncludeExt(e.target.value)}
              placeholder="zip, mp4, pdf  (empty = all)"
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Exclude extensions</label>
            <input type="text" value={excludeExt} onChange={e => setExcludeExt(e.target.value)}
              placeholder="css, js, png"
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button onClick={handleGrab} disabled={running || !isValidUrl(siteUrl)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {running ? <><span className="animate-spin">⟳</span> Crawling…</> : '🕸 Start Grabbing'}
          </button>

          {pagesVisited > 0 && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">{pagesVisited} pages visited</p>
          )}
        </div>

        {/* Right: results + log */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {results.length > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={results.every(r => r.selected)} onChange={toggleAll} className="accent-blue-600" />
                  {results.filter(r => r.selected).length} / {results.length} selected
                </label>
                <button onClick={downloadSelected} disabled={!results.some(r => r.selected)}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-md font-medium">
                  ⬇ Download Selected
                </button>
              </div>
            )}
            {results.map(r => (
              <label key={r.url} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                <input type="checkbox" checked={r.selected} onChange={() => toggleResult(r.url)} className="accent-blue-600 w-4 h-4 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate font-mono text-xs">{r.url}</span>
              </label>
            ))}
            {!running && results.length === 0 && log.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 gap-3 py-20">
                <span className="text-5xl">🕸</span>
                <p className="text-sm font-medium">Enter a URL and click Start Grabbing</p>
                <p className="text-xs">IDM will crawl the site and find all downloadable files</p>
              </div>
            )}
          </div>

          {/* Log */}
          {log.length > 0 && (
            <div ref={logRef} className="h-32 flex-shrink-0 overflow-y-auto bg-gray-950 p-3 font-mono text-xs text-green-400 border-t border-gray-700">
              {log.map((line, i) => <div key={i}><span className="text-gray-600 select-none">[{String(i + 1).padStart(3, '0')}] </span>{line}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
