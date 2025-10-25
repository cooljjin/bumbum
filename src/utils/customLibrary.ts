import type { FurnitureItem, FurnitureCategory, CustomFurnitureItem } from '../types/furniture';
import { Vector3, Euler } from 'three';
import { getDoorPlacementDefaults } from './furnitureHelpers';
import { HybridStorage } from '../services/storage/hybridStorage';
import { blobManager } from './blobManager';

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

async function resolveCustomFurnitureItem(id: string): Promise<CustomFurnitureItem | null> {
  const hybridStorage = new HybridStorage();
  try {
    const direct = await hybridStorage.getFurnitureItem(id);
    if (direct) {
      return direct;
    }

    const allItems = await hybridStorage.getFurnitureList();
    const matched = allItems.find((item) => {
      return (
        item.id === id ||
        item.storage.localId === id ||
        item.storage.serverId === id
      );
    });

    return matched ?? null;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[customLibrary] Failed to resolve custom furniture item:', id, error);
    }
    return null;
  } finally {
    hybridStorage.destroy();
  }
}

export async function getCustomFurnitureRaw(id: string): Promise<CustomFurnitureItem | null> {
  return resolveCustomFurnitureItem(id);
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
  const hybridStorage = new HybridStorage();
  
  // 파일 해시 계산
  const calculateHash = async (blob: Blob): Promise<string> => {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const isDoor = !!params.isDoor;
  const category: FurnitureCategory = params.category || 'decorative';
  const tags: string[] = params.tags && Array.isArray(params.tags) ? params.tags : (isDoor ? ['custom','door'] : ['custom']);
  
  // placement 설정: 문인 경우 표준 설정 사용, 아니면 커스텀 설정
  const placement = isDoor 
    ? getDoorPlacementDefaults() 
    : {
        canRotate: true,
        canScale: true,
        floorOffset: 0,
        wallOnly: !!params.wallMounted,
        wallHeight: params.wallMounted ? (params.wallHeight ?? 1.4) : undefined,
        supportedSurfaces: params.wallMounted ? ['wall' as const] : ['floor' as const]
      };

  // CustomFurnitureItem 형태로 변환
  const item: CustomFurnitureItem = {
    id: makeId(),
    name: params.name,
    nameKo: params.name,
    category,
    subcategory: isDoor ? 'door' : (params.wallMounted ? 'wall-custom' : 'custom'),
    modelPath: '', // Blob URL로 설정
    thumbnailPath: '', // Blob URL로 설정
    footprint: params.footprint || { width: 1, depth: 1, height: 1 },
    placement,
    metadata: {
      brand: 'Custom',
      model: makeId(),
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
    },
    storage: {
      mode: 'mock-api',
      localId: makeId(),
      version: 1
    },
    sync: {
      status: 'pending'
    },
    files: {
      model: {
        local: params.modelBlob,
        size: params.modelBlob.size,
        hash: await calculateHash(params.modelBlob)
      },
      thumbnail: {
        local: params.thumbnailBlob || new Blob(),
        size: params.thumbnailBlob?.size || 0,
        hash: params.thumbnailBlob ? await calculateHash(params.thumbnailBlob) : ''
      }
    },
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'local-user',
      tags: tags,
      isPublic: false,
      version: 1
    }
  };
  
  await hybridStorage.saveFurniture(item);
  return item.storage.localId;
}

export async function getCustomFurnitureItems(): Promise<FurnitureItem[]> {
  const hybridStorage = new HybridStorage();
  const customItems = await hybridStorage.getFurnitureList();
  
  // CustomFurnitureItem을 FurnitureItem으로 변환
  const results: FurnitureItem[] = [];
  for (const customItem of customItems) {
    // ✅ BlobManager 사용
    const modelUrl = blobManager.createUrl(customItem.files.model.local, {
      type: 'model',
      itemId: customItem.id,
      source: 'custom-furniture'
    });
    const thumbUrl = customItem.files.thumbnail.local.size > 0 ? 
      blobManager.createUrl(customItem.files.thumbnail.local, {
        type: 'thumbnail',
        itemId: customItem.id,
        source: 'custom-furniture'
      }) : undefined;
    
    const furnitureItem: FurnitureItem = {
      id: customItem.id,
      name: customItem.name,
      nameKo: customItem.nameKo,
      category: customItem.category,
      subcategory: customItem.subcategory,
      modelPath: modelUrl,
      thumbnailPath: thumbUrl,
      footprint: customItem.footprint,
      placement: customItem.placement,
      metadata: customItem.metadata,
      renderSettings: customItem.renderSettings,
      editSettings: customItem.editSettings
    };
    
    results.push(furnitureItem);
  }
  
  return results;
}

export async function getCustomFurnitureById(id: string): Promise<FurnitureItem | undefined> {
  const customItem = await resolveCustomFurnitureItem(id);
  if (!customItem) return undefined;

  // ✅ BlobManager 사용
  const modelUrl = blobManager.createUrl(customItem.files.model.local, {
    type: 'model',
    itemId: customItem.id,
    source: 'custom-furniture'
  });
  const thumbUrl = customItem.files.thumbnail.local.size > 0 ? 
    blobManager.createUrl(customItem.files.thumbnail.local, {
      type: 'thumbnail',
      itemId: customItem.id,
      source: 'custom-furniture'
    }) : undefined;
  
  return {
    id: customItem.id,
    name: customItem.name,
    nameKo: customItem.nameKo,
    category: customItem.category,
    subcategory: customItem.subcategory,
    modelPath: modelUrl,
    thumbnailPath: thumbUrl,
    footprint: customItem.footprint,
    placement: customItem.placement,
    metadata: customItem.metadata,
    renderSettings: customItem.renderSettings,
    editSettings: customItem.editSettings
  };
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
  const hybridStorage = new HybridStorage();
  await hybridStorage.deleteFurnitureItem(id);
}

// Replace model GLB for a custom furniture item
export async function updateCustomFurnitureModel(id: string, modelBlob: Blob): Promise<void> {
  const hybridStorage = new HybridStorage();
  const item = await hybridStorage.getFurnitureItem(id);
  
  if (!item) {
    throw new Error(`Item with id ${id} not found`);
  }
  
  // 파일 해시 계산
  const calculateHash = async (blob: Blob): Promise<string> => {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  // 모델 파일 업데이트
  item.files.model.local = modelBlob;
  item.files.model.size = modelBlob.size;
  item.files.model.hash = await calculateHash(modelBlob);
  item.metadata.updatedAt = Date.now();
  
  await hybridStorage.updateFurnitureItem(id, item);
}

// Replace thumbnail image for a custom furniture item
export async function updateCustomFurnitureThumbnail(id: string, thumbnailBlob: Blob): Promise<void> {
  const hybridStorage = new HybridStorage();
  const item = await hybridStorage.getFurnitureItem(id);
  
  if (!item) {
    throw new Error(`Item with id ${id} not found`);
  }
  
  // 파일 해시 계산
  const calculateHash = async (blob: Blob): Promise<string> => {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  // 썸네일 파일 업데이트
  item.files.thumbnail.local = thumbnailBlob;
  item.files.thumbnail.size = thumbnailBlob.size;
  item.files.thumbnail.hash = await calculateHash(thumbnailBlob);
  item.metadata.updatedAt = Date.now();
  
  await hybridStorage.updateFurnitureItem(id, item);
}
