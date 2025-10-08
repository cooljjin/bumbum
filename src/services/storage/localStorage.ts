import { CustomFurnitureItem } from '../../types/furniture';
import { STORAGE_CONSTANTS } from '../../config/storage';

export class LocalStorage {
  private dbName = STORAGE_CONSTANTS.DB_NAME;
  private dbVersion = STORAGE_CONSTANTS.DB_VERSION;

  // IndexedDB 열기
  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 기존 스토어들
        if (!db.objectStoreNames.contains(STORAGE_CONSTANTS.STORE_ITEMS)) {
          db.createObjectStore(STORAGE_CONSTANTS.STORE_ITEMS, { keyPath: 'storage.localId' });
        }
        if (!db.objectStoreNames.contains(STORAGE_CONSTANTS.STORE_BLOBS)) {
          db.createObjectStore(STORAGE_CONSTANTS.STORE_BLOBS);
        }
        
        // 새로운 동기화 상태 스토어
        if (!db.objectStoreNames.contains(STORAGE_CONSTANTS.STORE_SYNC)) {
          db.createObjectStore(STORAGE_CONSTANTS.STORE_SYNC, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 트랜잭션 실행 헬퍼
  private async withTransaction<T>(
    stores: string[],
    mode: IDBTransactionMode,
    fn: (tx: IDBTransaction) => Promise<T> | T
  ): Promise<T> {
    const db = await this.openIndexedDB();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      const done = (res: T) => {
        resolve(res);
        tx.oncomplete = null as any;
      };
      const fail = (err: any) => {
        reject(err);
      };
      
      tx.oncomplete = () => resolve(undefined as any);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
      
      Promise.resolve(fn(tx)).then(done).catch(fail);
    });
  }

  // 가구 아이템 저장
  async saveItem(item: CustomFurnitureItem): Promise<void> {
    await this.withTransaction([STORAGE_CONSTANTS.STORE_ITEMS, STORAGE_CONSTANTS.STORE_BLOBS], 'readwrite', async (tx) => {
      // 메타데이터 저장
      tx.objectStore(STORAGE_CONSTANTS.STORE_ITEMS).put(item);
      
      // 파일 저장
      tx.objectStore(STORAGE_CONSTANTS.STORE_BLOBS).put(item.files.model.local, `model:${item.storage.localId}`);
      tx.objectStore(STORAGE_CONSTANTS.STORE_BLOBS).put(item.files.thumbnail.local, `thumb:${item.storage.localId}`);
    });
    
    console.log('[LOCAL] Saved item locally:', item.name);
  }

  // 가구 아이템 조회
  async getItem(localId: string): Promise<CustomFurnitureItem | null> {
    return await this.withTransaction([STORAGE_CONSTANTS.STORE_ITEMS, STORAGE_CONSTANTS.STORE_BLOBS], 'readonly', async (tx) => {
      // 메타데이터 조회
      const item = await new Promise<CustomFurnitureItem | undefined>((resolve, reject) => {
        const req = tx.objectStore(STORAGE_CONSTANTS.STORE_ITEMS).get(localId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (!item) return null;

      // 파일 조회
      const modelBlob = await new Promise<Blob | undefined>((resolve, reject) => {
        const req = tx.objectStore(STORAGE_CONSTANTS.STORE_BLOBS).get(`model:${localId}`);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const thumbBlob = await new Promise<Blob | undefined>((resolve, reject) => {
        const req = tx.objectStore(STORAGE_CONSTANTS.STORE_BLOBS).get(`thumb:${localId}`);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (!modelBlob) return null;

      // 파일 정보 업데이트
      item.files.model.local = modelBlob;
      if (thumbBlob) {
        item.files.thumbnail.local = thumbBlob;
      }

      return item;
    });
  }

  // 모든 가구 아이템 조회
  async getAllItems(): Promise<CustomFurnitureItem[]> {
    const items = await this.withTransaction([STORAGE_CONSTANTS.STORE_ITEMS], 'readonly', async (tx) => {
      return await new Promise<CustomFurnitureItem[]>((resolve, reject) => {
        const req = tx.objectStore(STORAGE_CONSTANTS.STORE_ITEMS).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });

    // 각 아이템의 파일 정보 로드
    const results: CustomFurnitureItem[] = [];
    for (const item of items) {
      const fullItem = await this.getItem(item.storage.localId);
      if (fullItem) {
        results.push(fullItem);
      }
    }

    return results;
  }

  // 가구 아이템 업데이트
  async updateItem(localId: string, updates: Partial<CustomFurnitureItem>): Promise<void> {
    const existingItem = await this.getItem(localId);
    if (!existingItem) {
      throw new Error(`Item with localId ${localId} not found`);
    }

    const updatedItem = { ...existingItem, ...updates };
    await this.saveItem(updatedItem);
  }

  // 가구 아이템 삭제
  async deleteItem(localId: string): Promise<void> {
    await this.withTransaction([STORAGE_CONSTANTS.STORE_ITEMS, STORAGE_CONSTANTS.STORE_BLOBS], 'readwrite', async (tx) => {
      tx.objectStore(STORAGE_CONSTANTS.STORE_ITEMS).delete(localId);
      tx.objectStore(STORAGE_CONSTANTS.STORE_BLOBS).delete(`model:${localId}`);
      tx.objectStore(STORAGE_CONSTANTS.STORE_BLOBS).delete(`thumb:${localId}`);
    });
    
    console.log('[LOCAL] Deleted item:', localId);
  }

  // 파일 해시 계산
  async calculateHash(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 저장소 통계 조회
  async getStats(): Promise<{ totalItems: number; totalSize: number }> {
    const items = await this.getAllItems();
    const totalSize = items.reduce((sum, item) => {
      return sum + item.files.model.size + item.files.thumbnail.size;
    }, 0);

    return {
      totalItems: items.length,
      totalSize
    };
  }
}

