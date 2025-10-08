import { ApiFactory } from '../api/apiFactory';
import { getStorageConfig } from '../../config/storage';
import { CustomFurnitureItem } from '../../types/furniture';
import { SyncEvent, SyncEventListener } from '../../types/storage';
import { LocalStorage } from './localStorage';
import { SyncManager } from './syncManager';
import { UploadFurnitureRequest } from '../../types/api';

export class HybridStorage {
  private config = getStorageConfig();
  private apiService = ApiFactory.createApiService(this.config.service);
  private localStorage = new LocalStorage();
  private syncManager = new SyncManager();
  private listeners: SyncEventListener[] = [];

  constructor() {
    // 동기화 이벤트 리스너 등록
    this.syncManager.addEventListener(this.handleSyncEvent.bind(this));
  }

  // 동기화 이벤트 처리
  private handleSyncEvent(event: SyncEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[HYBRID] Error in sync event listener:', error);
      }
    });
  }

  // 동기화 이벤트 리스너 등록
  addSyncEventListener(listener: SyncEventListener): void {
    this.listeners.push(listener);
  }

  // 동기화 이벤트 리스너 제거
  removeSyncEventListener(listener: SyncEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 가구 저장 (로컬 우선 + Mock API 동기화)
  async saveFurniture(item: CustomFurnitureItem): Promise<void> {
    try {
      // 1. 항상 로컬에 먼저 저장 (즉시 반응)
      await this.localStorage.saveItem(item);
      
      // 2. Mock API로 동기화 시뮬레이션
      if (this.config.syncEnabled) {
        this.syncToServer(item); // 백그라운드
      }
    } catch (error) {
      console.error('[HYBRID] Failed to save furniture:', error);
      throw error;
    }
  }

  // 서버 동기화 (Mock API)
  private async syncToServer(item: CustomFurnitureItem): Promise<void> {
    try {
      console.log('[SYNC] Trying to sync item:', item.name);
      
      // 동기화 큐에 추가
      this.syncManager.addToSyncQueue(item.storage.localId);
      
      // 실제 동기화 수행
      await this.performSync(item);
      
    } catch (error) {
      console.error('[SYNC] Failed to sync item:', error);
      item.sync.status = 'error';
      item.sync.lastError = error instanceof Error ? error.message : 'Unknown error';
      await this.localStorage.updateItem(item.storage.localId, item);
    }
  }

  // 실제 동기화 수행
  private async performSync(item: CustomFurnitureItem): Promise<void> {
    const uploadRequest: UploadFurnitureRequest = {
      name: item.name,
      category: item.category,
      metadata: {
        brand: item.metadata.brand,
        model: item.metadata.model,
        price: item.metadata.price,
        description: item.metadata.description,
        tags: item.metadata.tags,
        materials: item.metadata.materials,
        colors: item.metadata.colors
      },
      files: {
        model: new File([item.files.model.local], `${item.name}.glb`),
        thumbnail: item.files.thumbnail.local.size > 0 ? 
          new File([item.files.thumbnail.local], `${item.name}.png`) : undefined
      }
    };

    const response = await this.apiService.uploadFurniture(uploadRequest);
    
    // 서버 ID 업데이트
    item.storage.serverId = response.serverId;
    item.sync.status = 'synced';
    item.sync.lastSynced = Date.now();
    item.sync.lastError = undefined;
    
    // 로컬 저장소 업데이트
    await this.localStorage.updateItem(item.storage.localId, item);
    
    // 동기화 큐에서 제거
    this.syncManager.removeFromSyncQueue(item.storage.localId);
    
    console.log('[SYNC] Item synced to mock server:', response.serverId);
  }

  // 가구 목록 조회
  async getFurnitureList(): Promise<CustomFurnitureItem[]> {
    try {
      return await this.localStorage.getAllItems();
    } catch (error) {
      console.error('[HYBRID] Failed to get furniture list:', error);
      return [];
    }
  }

  // 가구 아이템 조회
  async getFurnitureItem(localId: string): Promise<CustomFurnitureItem | null> {
    try {
      return await this.localStorage.getItem(localId);
    } catch (error) {
      console.error('[HYBRID] Failed to get furniture item:', error);
      return null;
    }
  }

  // 가구 아이템 업데이트
  async updateFurnitureItem(localId: string, updates: Partial<CustomFurnitureItem>): Promise<void> {
    try {
      await this.localStorage.updateItem(localId, updates);
      
      // 업데이트된 아이템을 동기화 큐에 추가
      if (this.config.syncEnabled) {
        const item = await this.localStorage.getItem(localId);
        if (item) {
          this.syncManager.addToSyncQueue(localId);
        }
      }
    } catch (error) {
      console.error('[HYBRID] Failed to update furniture item:', error);
      throw error;
    }
  }

  // 가구 아이템 삭제
  async deleteFurnitureItem(localId: string): Promise<void> {
    try {
      const item = await this.localStorage.getItem(localId);
      if (item && item.storage.serverId) {
        // 서버에서도 삭제
        await this.apiService.deleteFurniture(item.storage.serverId);
      }
      
      // 로컬에서 삭제
      await this.localStorage.deleteItem(localId);
      
      // 동기화 큐에서 제거
      this.syncManager.removeFromSyncQueue(localId);
      
    } catch (error) {
      console.error('[HYBRID] Failed to delete furniture item:', error);
      throw error;
    }
  }

  // 동기화 상태 조회
  async getSyncStatus(): Promise<{
    queueLength: number;
    isProcessing: boolean;
    nextSyncIn: number;
  }> {
    return this.syncManager.getSyncStatus();
  }

  // 즉시 동기화 실행
  async syncNow(): Promise<void> {
    await this.syncManager.syncNow();
  }

  // 저장소 통계 조회
  async getStats(): Promise<{
    totalItems: number;
    totalSize: number;
    syncedItems: number;
    pendingItems: number;
    errorItems: number;
    lastSyncTime?: number;
  }> {
    const items = await this.getFurnitureList();
    const localStats = await this.localStorage.getStats();
    const syncStats = await this.syncManager.generateStats(items);
    
    return {
      ...localStats,
      ...syncStats
    };
  }

  // 설정 조회
  getConfig() {
    return { ...this.config };
  }

  // 정리
  destroy(): void {
    this.syncManager.destroy();
    this.listeners = [];
  }
}

