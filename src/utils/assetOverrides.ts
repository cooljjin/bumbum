// Stores binary overrides (GLB, thumbnail) for built-in furniture in IndexedDB
// Uses same DB as customLibrary for simplicity

const DB_NAME = 'bumbum_custom_library';
const DB_VERSION = 1;
const STORE_BLOBS = 'blobs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('IndexedDB not available'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_BLOBS], 'readwrite');
    tx.objectStore(STORE_BLOBS).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function getBlob(key: string): Promise<Blob | undefined> {
  const db = await openDB();
  return await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction([STORE_BLOBS], 'readonly');
    const req = tx.objectStore(STORE_BLOBS).get(key);
    req.onsuccess = () => resolve(req.result as any);
    req.onerror = () => reject(req.error);
  });
}

async function deleteBlob(key: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_BLOBS], 'readwrite');
    tx.objectStore(STORE_BLOBS).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

const modelKey = (id: string) => `override-model:${id}`;
const thumbKey = (id: string) => `override-thumb:${id}`;

export async function setBuiltInModelOverride(id: string, blob: Blob) {
  await putBlob(modelKey(id), blob);
}

export async function setBuiltInThumbnailOverride(id: string, blob: Blob) {
  await putBlob(thumbKey(id), blob);
}

export async function clearBuiltInModelOverride(id: string) {
  await deleteBlob(modelKey(id));
}

export async function clearBuiltInThumbnailOverride(id: string) {
  await deleteBlob(thumbKey(id));
}

export async function getBuiltInOverrideUrls(ids: string[]): Promise<Record<string, { modelUrl?: string; thumbUrl?: string }>> {
  const out: Record<string, { modelUrl?: string; thumbUrl?: string }> = {};
  for (const id of ids) {
    const m = await getBlob(modelKey(id));
    const t = await getBlob(thumbKey(id));
    const entry: { modelUrl?: string; thumbUrl?: string } = {};
    if (m) entry.modelUrl = URL.createObjectURL(m);
    if (t) entry.thumbUrl = URL.createObjectURL(t);
    if (entry.modelUrl || entry.thumbUrl) out[id] = entry;
  }
  return out;
}

