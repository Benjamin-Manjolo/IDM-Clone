export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'error'
  | 'merging'
  | 'checking';

export type DownloadProtocol = 'http' | 'https' | 'ftp' | 'magnet' | 'hls' | 'dash';

export type DownloadCategory =
  | 'general'
  | 'video'
  | 'audio'
  | 'documents'
  | 'compressed'
  | 'programs'
  | 'images'
  | 'other';

export interface DownloadSegment {
  id: number;
  start: number;
  end: number;
  downloaded: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
}

export interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  savePath: string;
  category: DownloadCategory;
  status: DownloadStatus;
  protocol: DownloadProtocol;

  // Size
  totalSize: number;      // bytes, -1 if unknown
  downloadedSize: number; // bytes

  // Speed & time
  speed: number;           // bytes/sec
  averageSpeed: number;    // bytes/sec
  timeRemaining: number;   // seconds, -1 if unknown

  // Segments
  segments: DownloadSegment[];
  maxConnections: number;

  // Timestamps
  createdAt: number;       // Unix ms
  startedAt?: number;
  completedAt?: number;
  pausedAt?: number;

  // Metadata
  referrer?: string;
  cookies?: string;
  headers?: Record<string, string>;
  checksum?: { algorithm: 'md5' | 'sha1' | 'sha256'; value: string };

  // State
  retryCount: number;
  errorMessage?: string;
  resumable: boolean;
}

export interface DownloadProgress {
  id: string;
  downloadedSize: number;
  speed: number;
  timeRemaining: number;
  segments: DownloadSegment[];
  status: DownloadStatus;
}

export interface AddDownloadOptions {
  url: string;
  savePath?: string;
  filename?: string;
  category?: DownloadCategory;
  maxConnections?: number;
  referrer?: string;
  cookies?: string;
  headers?: Record<string, string>;
  startImmediately?: boolean;
  speedLimit?: number;
}
