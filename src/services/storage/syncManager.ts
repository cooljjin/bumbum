import { CustomFurnitureItem } from '../../types/furniture';
import { SyncEvent, SyncEventListener, StorageStats } from '../../types/storage';
import { STORAGE_CONSTANTS } from '../../config/storage';

export class SyncManager {
  private listeners: SyncEventListener[] = [];
  private syncQueue: string[] = [];
  private isProcessing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startPeriodicSync();
  }

  // 동기화 이벤트 리스너 등록
  addEventListener(listener: SyncEventListener): void {
    this.listeners.push(listener);
  }

  // 동기화 이벤트 리스너 제거
  removeEventListener(listener: SyncEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 동기화 이벤트 발생
  private emitEvent(event: SyncEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[SYNC] Error in event listener:', error);
      }
    });
  }

  // 동기화 큐에 아이템 추가
  addToSyncQueue(itemId: string): void {
    if (!this.syncQueue.includes(itemId)) {
      this.syncQueue.push(itemId);
      console.log('[SYNC] Added to sync queue:', itemId);
    }
  }

  // 동기화 큐에서 아이템 제거
  removeFromSyncQueue(itemId: string): void {
    const index = this.syncQueue.indexOf(itemId);
    if (index > -1) {
      this.syncQueue.splice(index, 1);
      console.log('[SYNC] Removed from sync queue:', itemId);
    }
  }

  // 주기적 동기화 시작
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.syncQueue.length > 0 && !this.isProcessing) {
        this.processSyncQueue();
      }
    }, STORAGE_CONSTANTS.SYNC_INTERVAL);
  }

  // 주기적 동기화 중지
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // 동기화 큐 처리
  async processSyncQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log('[SYNC] Processing sync queue:', this.syncQueue.length, 'items');

    try {
      // 배치 단위로 처리
      const batch = this.syncQueue.splice(0, STORAGE_CONSTANTS.SYNC_BATCH_SIZE);
      
      for (const itemId of batch) {
        try {
          this.emitEvent({
            type: 'start',
            itemId,
            timestamp: Date.now()
          });

          // 실제 동기화 로직은 HybridStorage에서 처리
          // 여기서는 이벤트만 발생
          this.emitEvent({
            type: 'complete',
            itemId,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('[SYNC] Failed to sync item:', itemId, error);
          this.emitEvent({
            type: 'error',
            itemId,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
          });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // 즉시 동기화 실행
  async syncNow(): Promise<void> {
    if (this.syncQueue.length === 0) {
      console.log('[SYNC] No items to sync');
      return;
    }

    await this.processSyncQueue();
  }

  // 동기화 상태 조회
  getSyncStatus(): {
    queueLength: number;
    isProcessing: boolean;
    nextSyncIn: number;
  } {
    return {
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
      nextSyncIn: this.syncInterval ? STORAGE_CONSTANTS.SYNC_INTERVAL : 0
    };
  }

  // 동기화 큐 초기화
  clearSyncQueue(): void {
    this.syncQueue = [];
    console.log('[SYNC] Sync queue cleared');
  }

  // 저장소 통계 생성
  async generateStats(items: CustomFurnitureItem[]): Promise<StorageStats> {
    const syncedItems = items.filter(item => item.sync.status === 'synced').length;
    const pendingItems = items.filter(item => item.sync.status === 'pending').length;
    const errorItems = items.filter(item => item.sync.status === 'error').length;
    
    const totalSize = items.reduce((sum, item) => {
      return sum + item.files.model.size + item.files.thumbnail.size;
    }, 0);

    const lastSyncTime = items.reduce((latest, item) => {
      if (item.sync.lastSynced && item.sync.lastSynced > latest) {
        return item.sync.lastSynced;
      }
      return latest;
    }, 0);

    return {
      totalItems: items.length,
      syncedItems,
      pendingItems,
      errorItems,
      totalSize,
      lastSyncTime: lastSyncTime || undefined
    };
  }

  // 정리
  destroy(): void {
    this.stopPeriodicSync();
    this.listeners = [];
    this.syncQueue = [];
  }
}

