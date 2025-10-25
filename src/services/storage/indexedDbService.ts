interface StoredFileRecord {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
  storedAt: number;
}

const DB_NAME = 'bumbum-file-cache';
const DB_VERSION = 1;
const STORE_NAME = 'files';

function isIndexedDbSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDbSupported()) {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export class IndexedDbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private get database(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDatabase().catch((error) => {
        this.dbPromise = null;
        throw error;
      });
    }
    return this.dbPromise;
  }

  async saveFile(id: string, file: File): Promise<void> {
    if (!isIndexedDbSupported()) {
      console.warn('[IndexedDbService] IndexedDB is unavailable. Skipping save.');
      return;
    }

    const db = await this.database;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredFileRecord = {
        id,
        blob: file,
        name: file.name || id,
        type: file.type || 'application/octet-stream',
        lastModified: file.lastModified ?? Date.now(),
        storedAt: Date.now()
      };
      store.put(record);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to save file into IndexedDB'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted while saving file'));
    });
  }

  async getFile(id: string): Promise<File | null> {
    if (!isIndexedDbSupported()) {
      console.warn('[IndexedDbService] IndexedDB is unavailable. Returning null.');
      return null;
    }

    const db = await this.database;
    return new Promise<File | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as StoredFileRecord | undefined;
        if (!record) {
          resolve(null);
          return;
        }

        if (typeof File === 'undefined') {
          // Fallback for environments without the File constructor.
          const fallback = record.blob as File;
          (fallback as any).name = record.name;
          (fallback as any).lastModified = record.lastModified;
          resolve(fallback);
          return;
        }

        resolve(
          new File([record.blob], record.name, {
            type: record.type,
            lastModified: record.lastModified
          })
        );
      };

      request.onerror = () =>
        reject(request.error ?? new Error('Failed to retrieve file from IndexedDB'));
    });
  }

  async deleteFile(id: string): Promise<void> {
    if (!isIndexedDbSupported()) {
      console.warn('[IndexedDbService] IndexedDB is unavailable. Skipping delete.');
      return;
    }

    const db = await this.database;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to delete file from IndexedDB'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted while deleting file'));
    });
  }
}

export const indexedDbService = new IndexedDbService();

