import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'date' = 'short'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  switch (format) {
    case 'long':
      return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'date':
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    default:
      return d.toLocaleDateString('en-IN', {
        year: '2-digit',
        month: 'short',
        day: '2-digit'
      });
  }
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const sign = diffSec < 0 ? 'ago' : 'left';
  const absSec = Math.abs(diffSec);

  if (absSec < 60) return `${absSec}s ${sign}`;
  const absMin = Math.round(absSec / 60);
  if (absMin < 60) return `${absMin}m ${sign}`;
  const absHour = Math.round(absMin / 60);
  if (absHour < 24) return `${absHour}h ${sign}`;
  const absDay = Math.round(absHour / 24);
  if (absDay < 30) return `${absDay}d ${sign}`;
  const absMonth = Math.round(absDay / 30);
  return `${absMonth}mo ${sign}`;
}

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}${random}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function getDaysUntil(date: string | Date): number {
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: string | Date): boolean {
  return new Date(date).getTime() < Date.now();
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function downloadFile(data: Blob, filename: string): void {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type SyncEventType =
  | 'TENDER_MUTATED'
  | 'BID_MUTATED'
  | 'VENDOR_MUTATED'
  | 'SHEET_MUTATED'
  | 'ALERT_MUTATED'
  | 'SETTINGS_MUTATED'
  | 'AUTH_MUTATED';

export interface SyncMessage {
  id: string;
  type: SyncEventType;
  timestamp: number;
  sourceId: string;
  payload?: any;
}

export type NetworkSyncStatus = 'online' | 'offline' | 'syncing';

const QUEUE_STORAGE_KEY = 'bidfly_offline_sync_queue';
const CLOUD_CONFIG_KEY = 'bidfly_cloud_sync_config';

export interface CloudSyncConfig {
  enabled: boolean;
  endpointUrl: string;
  apiKey: string;
  autoSyncIntervalMs: number;
}

class RealtimeSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(msg: SyncMessage) => void> = new Set();
  private statusListeners: Set<(status: NetworkSyncStatus, pendingCount: number) => void> = new Set();
  private instanceId: string = Math.random().toString(36).slice(2, 9);
  private offlineQueue: SyncMessage[] = [];
  private syncStatus: NetworkSyncStatus = 'online';
  private cloudConfig: CloudSyncConfig = {
    enabled: false,
    endpointUrl: '',
    apiKey: '',
    autoSyncIntervalMs: 30000
  };

  constructor() {
    this.loadOfflineQueue();
    this.loadCloudConfig();

    if (typeof window !== 'undefined') {
      this.syncStatus = navigator.onLine ? 'online' : 'offline';

      window.addEventListener('online', () => {
        this.updateStatus('syncing');
        this.flushOfflineQueue();
      });

      window.addEventListener('offline', () => {
        this.updateStatus('offline');
      });

      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel('bidfly_realtime_sync');
          this.channel.onmessage = (event) => {
            if (event.data && event.data.sourceId !== this.instanceId) {
              this.notifyListeners(event.data);
            }
          };
        } catch (err) {
          console.warn('BroadcastChannel init error:', err);
        }
      }

      if (navigator.onLine && this.offlineQueue.length > 0) {
        setTimeout(() => this.flushOfflineQueue(), 1500);
      }
    }
  }

  public getSyncStatus(): { status: NetworkSyncStatus; pendingCount: number; cloudEnabled: boolean } {
    return {
      status: this.syncStatus,
      pendingCount: this.offlineQueue.length,
      cloudEnabled: this.cloudConfig.enabled && !!this.cloudConfig.endpointUrl
    };
  }

  public subscribeStatus(callback: (status: NetworkSyncStatus, pendingCount: number) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.syncStatus, this.offlineQueue.length);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public setCloudConfig(config: Partial<CloudSyncConfig>): void {
    this.cloudConfig = { ...this.cloudConfig, ...config };
    try {
      localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(this.cloudConfig));
    } catch {}
    this.notifyStatusListeners();
  }

  public getCloudConfig(): CloudSyncConfig {
    return this.cloudConfig;
  }

  public broadcast(type: SyncEventType, payload?: any): void {
    const msg: SyncMessage = {
      id: 'sync_' + Math.random().toString(36).slice(2, 9),
      type,
      timestamp: Date.now(),
      sourceId: this.instanceId,
      payload
    };

    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.enqueueOfflineMessage(msg);
      this.updateStatus('offline');
      return;
    }

    if (this.cloudConfig.enabled && this.cloudConfig.endpointUrl) {
      this.sendToCloudEndpoint([msg]);
    }
  }

  public subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public async triggerManualSync(): Promise<{ success: boolean; flushedCount: number }> {
    this.updateStatus('syncing');
    const flushedCount = await this.flushOfflineQueue();
    this.updateStatus(navigator.onLine ? 'online' : 'offline');
    return { success: true, flushedCount };
  }

  private enqueueOfflineMessage(msg: SyncMessage): void {
    this.offlineQueue.push(msg);
    this.saveOfflineQueue();
    this.notifyStatusListeners();
  }

  private async flushOfflineQueue(): Promise<number> {
    if (this.offlineQueue.length === 0) {
      this.updateStatus('online');
      return 0;
    }

    const queueToProcess = [...this.offlineQueue];
    let successCount = 0;

    try {
      if (this.cloudConfig.enabled && this.cloudConfig.endpointUrl) {
        const ok = await this.sendToCloudEndpoint(queueToProcess);
        if (ok) successCount = queueToProcess.length;
      } else {
        queueToProcess.forEach(msg => this.notifyListeners(msg));
        successCount = queueToProcess.length;
      }

      this.offlineQueue = this.offlineQueue.filter(item => !queueToProcess.some(p => p.id === item.id));
      this.saveOfflineQueue();
    } catch (err) {
      console.warn('Sync queue flush error:', err);
    } finally {
      this.updateStatus(navigator.onLine ? 'online' : 'offline');
    }

    return successCount;
  }

  private async sendToCloudEndpoint(messages: SyncMessage[]): Promise<boolean> {
    if (!this.cloudConfig.endpointUrl) return false;
    try {
      const res = await fetch(this.cloudConfig.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.cloudConfig.apiKey}`
        },
        body: JSON.stringify({
          sourceId: this.instanceId,
          messages
        })
      });
      return res.ok;
    } catch (err) {
      console.warn('Cloud sync post failed:', err);
      return false;
    }
  }

  private updateStatus(newStatus: NetworkSyncStatus): void {
    this.syncStatus = newStatus;
    this.notifyStatusListeners();
  }

  private notifyListeners(msg: SyncMessage): void {
    this.listeners.forEach(cb => {
      try { cb(msg); } catch (err) { console.error('Sync listener error:', err); }
    });
  }

  private notifyStatusListeners(): void {
    this.statusListeners.forEach(cb => {
      try { cb(this.syncStatus, this.offlineQueue.length); } catch {}
    });
  }

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.offlineQueue));
    } catch {}
  }

  private loadOfflineQueue(): void {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) this.offlineQueue = JSON.parse(raw);
    } catch {}
  }

  private loadCloudConfig(): void {
    try {
      const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
      if (raw) this.cloudConfig = { ...this.cloudConfig, ...JSON.parse(raw) };
    } catch {}
  }
}

export const realtimeSync = new RealtimeSyncService();
