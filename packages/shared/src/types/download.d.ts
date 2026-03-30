export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'error' | 'merging' | 'checking';
export type DownloadProtocol = 'http' | 'https' | 'ftp' | 'magnet' | 'hls' | 'dash';
export type DownloadCategory = 'general' | 'video' | 'audio' | 'documents' | 'compressed' | 'programs' | 'images' | 'other';
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
    totalSize: number;
    downloadedSize: number;
    speed: number;
    averageSpeed: number;
    timeRemaining: number;
    segments: DownloadSegment[];
    maxConnections: number;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    pausedAt?: number;
    referrer?: string;
    cookies?: string;
    headers?: Record<string, string>;
    checksum?: {
        algorithm: 'md5' | 'sha1' | 'sha256';
        value: string;
    };
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
//# sourceMappingURL=download.d.ts.map