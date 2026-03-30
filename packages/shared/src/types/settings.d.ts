export type Theme = 'light' | 'dark' | 'system';
export type Language = string;
export interface ConnectionSettings {
    maxConnections: number;
    maxConcurrentDownloads: number;
    globalSpeedLimit: number;
    connectionTimeout: number;
    retryCount: number;
    retryDelay: number;
    useProxy: boolean;
    proxyType: 'http' | 'socks4' | 'socks5' | 'none';
    proxyHost?: string;
    proxyPort?: number;
    proxyUsername?: string;
    proxyPassword?: string;
}
export interface SaveSettings {
    defaultDownloadDir: string;
    tempDir: string;
    createCategoryDirs: boolean;
    categoryDirs: Record<string, string>;
    filenameConflict: 'rename' | 'overwrite' | 'skip' | 'ask';
    deleteIncomplete: boolean;
}
export interface IntegrationSettings {
    browserExtensionEnabled: boolean;
    extensionPort: number;
    catchAllDownloads: boolean;
    minFileSizeToCatch: number;
    fileTypesToCatch: string[];
    fileTypesToIgnore: string[];
    monitorClipboard: boolean;
}
export interface NotificationSettings {
    soundOnComplete: boolean;
    soundOnError: boolean;
    showDesktopNotification: boolean;
    soundFile?: string;
}
export interface AntivirusSettings {
    enabled: boolean;
    scannerPath?: string;
    scannerArgs?: string;
}
export interface AppSettings {
    theme: Theme;
    language: Language;
    startMinimized: boolean;
    minimizeToTray: boolean;
    startOnBoot: boolean;
    showSpeedInTray: boolean;
    connection: ConnectionSettings;
    save: SaveSettings;
    integration: IntegrationSettings;
    notifications: NotificationSettings;
    antivirus: AntivirusSettings;
    checkForUpdates: boolean;
    lastUpdateCheck?: number;
}
//# sourceMappingURL=settings.d.ts.map