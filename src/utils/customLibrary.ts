import type { FurnitureItem, FurnitureCategory } from '../types/furniture';
import { Vector3, Euler } from 'three';

type CustomItemMeta = {
  id: string;
  name: string;
  nameKo?: string;
  createdAt: number;
  footprint?: { width: number; depth: number; height: number };
  // wall options
  isWall?: boolean;
  wallHeight?: number; // m
  isDoor?: boolean; // 문 여부 (벽+바닥 접합)
  category?: FurnitureCategory;
  tags?: string[];
};

const DB_NAME = 'bumbum_custom_library';
const DB_VERSION = 1;
const STORE_ITEMS = 'items';
const STORE_BLOBS = 'blobs';

function openDBPromise(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('IndexedDB not available'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS); // key: `model:<id>` | `thumb:<id>`
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withTx<T>(stores: string[], mode: IDBTransactionMode, fn: (tx: IDBTransaction) => Promise<T> | T): Promise<T> {
  const db = await openDBPromise();
  return await new Promise<T>((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    const done = (res: T) => { resolve(res); tx.oncomplete = null as any; };
    const fail = (err: any) => { reject(err); };
    tx.oncomplete = () => resolve(undefined as any);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    Promise.resolve(fn(tx)).then(done).catch(fail);
  });
}

function makeId() {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveCustomFurniture(params: {
  name: string;
  modelBlob: Blob;
  thumbnailBlob?: Blob | null;
  footprint?: { width: number; depth: number; height: number };
  wallMounted?: boolean;
  wallHeight?: number; // m
  isDoor?: boolean;
  category?: FurnitureCategory;
  tags?: string[];
}): Promise<string> {
  const id = makeId();
  const meta: CustomItemMeta = {
    id,
    name: params.name,
    createdAt: Date.now(),
    footprint: params.footprint,
    isWall: !!params.wallMounted,
    wallHeight: params.wallHeight,
    isDoor: !!params.isDoor,
    category: params.category,
    tags: params.tags && Array.isArray(params.tags) ? params.tags : undefined
  };
  await withTx([STORE_ITEMS, STORE_BLOBS], 'readwrite', async (tx) => {
    tx.objectStore(STORE_ITEMS).put(meta);
    tx.objectStore(STORE_BLOBS).put(params.modelBlob, `model:${id}`);
    if (params.thumbnailBlob) {
      tx.objectStore(STORE_BLOBS).put(params.thumbnailBlob, `thumb:${id}`);
    }
  });
  return id;
}

export async function getCustomFurnitureItems(): Promise<FurnitureItem[]> {
  const items = await withTx([STORE_ITEMS], 'readonly', async (tx) => {
    return await new Promise<CustomItemMeta[]>((resolve, reject) => {
      const req = tx.objectStore(STORE_ITEMS).getAll();
      req.onsuccess = () => resolve(req.result as any);
      req.onerror = () => reject(req.error);
    });
  });

  const results: FurnitureItem[] = [];
  for (const meta of items) {
    const modelBlob = await withTx([STORE_BLOBS], 'readonly', async (tx) => {
      return await new Promise<Blob | undefined>((resolve, reject) => {
        const req = tx.objectStore(STORE_BLOBS).get(`model:${meta.id}`);
        req.onsuccess = () => resolve(req.result as any);
        req.onerror = () => reject(req.error);
      });
    });
    const thumbBlob = await withTx([STORE_BLOBS], 'readonly', async (tx) => {
      return await new Promise<Blob | undefined>((resolve, reject) => {
        const req = tx.objectStore(STORE_BLOBS).get(`thumb:${meta.id}`);
        req.onsuccess = () => resolve(req.result as any);
        req.onerror = () => reject(req.error);
      });
    });
    if (!modelBlob) continue;
    const modelUrl = URL.createObjectURL(modelBlob);
    const thumbUrl = thumbBlob ? URL.createObjectURL(thumbBlob) : undefined;

    const isDoor = !!meta.isDoor;
    const category: FurnitureCategory = meta.category || 'decorative';
    const tags: string[] = meta.tags && meta.tags.length ? meta.tags : (isDoor ? ['custom','door'] : ['custom']);
    const f: FurnitureItem = {
      id: meta.id,
      name: meta.name,
      nameKo: meta.name,
      category,
      subcategory: isDoor ? 'door' : (meta.isWall ? 'wall-custom' : 'custom'),
      modelPath: modelUrl,
      thumbnailPath: thumbUrl || undefined,
      footprint: meta.footprint || { width: 1, depth: 1, height: 1 },
      placement: {
        canRotate: true,
        canScale: true,
        floorOffset: 0,
        wallOnly: !!meta.isWall || isDoor,
        wallHeight: (isDoor ? 0 : undefined) ?? (meta.isWall ? (meta.wallHeight ?? 1.4) : undefined),
        supportedSurfaces: (isDoor || meta.isWall) ? ['wall'] : ['floor']
      },
      metadata: {
        brand: 'Custom',
        model: meta.id,
        price: 0,
        description: '로컬 커스텀 라이브러리 항목',
        tags
      },
      renderSettings: {
        castShadow: true,
        receiveShadow: true,
        defaultScale: new Vector3(1, 1, 1),
        defaultRotation: new Euler(0, 0, 0)
      },
      editSettings: {
        snapToGrid: true,
        rotationSnap: 15,
        collisionGroup: 'furniture'
      }
    };
    results.push(f);
  }
  return results;
}

export async function getCustomFurnitureById(id: string): Promise<FurnitureItem | undefined> {
  const list = await getCustomFurnitureItems();
  return list.find(it => it.id === id);
}

// Raw meta helpers for management UI
export async function getCustomMetas(): Promise<CustomItemMeta[]> {
  return await withTx([STORE_ITEMS], 'readonly', async (tx) => {
    return await new Promise<CustomItemMeta[]>((resolve, reject) => {
      const req = tx.objectStore(STORE_ITEMS).getAll();
      req.onsuccess = () => resolve(req.result as any);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getCustomMetaById(id: string): Promise<CustomItemMeta | undefined> {
  return await withTx([STORE_ITEMS], 'readonly', async (tx) => {
    return await new Promise<CustomItemMeta | undefined>((resolve, reject) => {
      const req = tx.objectStore(STORE_ITEMS).get(id);
      req.onsuccess = () => resolve(req.result as any);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function updateCustomFurnitureMeta(
  id: string,
  updates: Partial<Pick<CustomItemMeta, 'name' | 'footprint' | 'isWall' | 'wallHeight' | 'isDoor' | 'category' | 'tags'>>
): Promise<void> {
  await withTx([STORE_ITEMS], 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_ITEMS);
    const meta = await new Promise<CustomItemMeta | undefined>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as any);
      req.onerror = () => reject(req.error);
    });
    if (!meta) throw new Error('아이템을 찾을 수 없습니다');
    const next: CustomItemMeta = { ...meta, ...updates };
    store.put(next);
  });
}

export async function deleteCustomFurniture(id: string): Promise<void> {
  await withTx([STORE_ITEMS, STORE_BLOBS], 'readwrite', async (tx) => {
    tx.objectStore(STORE_ITEMS).delete(id);
    tx.objectStore(STORE_BLOBS).delete(`model:${id}`);
    tx.objectStore(STORE_BLOBS).delete(`thumb:${id}`);
  });
}

// Replace model GLB for a custom furniture item
export async function updateCustomFurnitureModel(id: string, modelBlob: Blob): Promise<void> {
  await withTx([STORE_BLOBS], 'readwrite', async (tx) => {
    tx.objectStore(STORE_BLOBS).put(modelBlob, `model:${id}`);
  });
}

// Replace thumbnail image for a custom furniture item
export async function updateCustomFurnitureThumbnail(id: string, thumbnailBlob: Blob): Promise<void> {
  await withTx([STORE_BLOBS], 'readwrite', async (tx) => {
    tx.objectStore(STORE_BLOBS).put(thumbnailBlob, `thumb:${id}`);
  });
}
