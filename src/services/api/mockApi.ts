import { UploadFurnitureRequest, UploadFurnitureResponse } from '@/types/api';
import { CustomFurnitureItem, FurnitureCategory } from '@/types/furniture';
import type { SyncStatus } from '@/types/storage';
import { Euler, Vector3 } from 'three';

const MOCK_DELAY_MS = 250;
const ROTATION_SNAP_DEGREES = 15;
const MODEL_EXTENSION = 'glb';
const THUMBNAIL_EXTENSION = 'png';
const PLACEHOLDER_BASE_PATH = '/mock';
const DEFAULT_COLLISION_GROUP = 'default';

const KNOWN_CATEGORIES: readonly FurnitureCategory[] = [
  'living',
  'bedroom',
  'kitchen',
  'bathroom',
  'office',
  'outdoor',
  'decorative',
  'storage',
  'floor',
  'wall',
];

const mockFurnitureStore = new Map<string, CustomFurnitureItem>();

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

const createIdentifier = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  const randomSegment = Math.random().toString(36).slice(2, 10);
  const timeSegment = Date.now().toString(36);
  return `${prefix}-${randomSegment}${timeSegment}`;
};

const isFurnitureCategory = (value: string): value is FurnitureCategory => {
  return KNOWN_CATEGORIES.includes(value as FurnitureCategory);
};

const normaliseCategory = (category: string): FurnitureCategory => {
  return isFurnitureCategory(category) ? category : 'decorative';
};

const createMockHash = (seed: string): string => {
  return `mock-hash-${seed}-${Math.random().toString(36).slice(2, 8)}`;
};

const createPlaceholderUrl = (segment: 'models' | 'thumbnails', id: string, extension: string): string => {
  return `${PLACEHOLDER_BASE_PATH}/${segment}/${id}.${extension}`;
};

const ensureThumbnailBlob = (thumbnail?: File | Blob): Blob => {
  if (thumbnail) {
    return thumbnail;
  }

  return new Blob([], { type: 'image/png' });
};

const cloneItem = (item: CustomFurnitureItem): CustomFurnitureItem => {
  if (typeof structuredClone === 'function') {
    return structuredClone(item);
  }

  return {
    ...item,
    footprint: { ...item.footprint },
    placement: {
      ...item.placement,
      supportedSurfaces: item.placement.supportedSurfaces?.slice(),
    },
    renderSettings: {
      ...item.renderSettings,
      defaultScale: item.renderSettings.defaultScale.clone(),
      defaultRotation: item.renderSettings.defaultRotation.clone(),
    },
    editSettings: { ...item.editSettings },
    storage: { ...item.storage },
    sync: { ...item.sync },
    files: {
      model: { ...item.files.model },
      thumbnail: { ...item.files.thumbnail },
    },
    metadata: { ...item.metadata },
  };
};

const findItem = (id: string): CustomFurnitureItem | undefined => {
  for (const item of mockFurnitureStore.values()) {
    if (item.storage.serverId === id || item.storage.localId === id || item.id === id) {
      return item;
    }
  }

  return undefined;
};

const createMockFurnitureItem = (
  request: UploadFurnitureRequest,
  identifiers: { localId: string; serverId: string; timestamp: number },
): CustomFurnitureItem => {
  const { localId, serverId, timestamp } = identifiers;
  const category = normaliseCategory(request.category);
  const modelUrl = createPlaceholderUrl('models', serverId, MODEL_EXTENSION);
  const thumbnailUrl = createPlaceholderUrl('thumbnails', serverId, THUMBNAIL_EXTENSION);
  const thumbnailBlob = ensureThumbnailBlob(request.files.thumbnail);

  return {
    id: localId,
    name: request.name,
    nameKo: request.name,
    category,
    subcategory: request.metadata.tags[0],
    modelPath: modelUrl,
    thumbnailPath: request.files.thumbnail ? thumbnailUrl : undefined,
    footprint: {
      width: 1,
      depth: 1,
      height: 1,
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0,
      supportedSurfaces: ['floor'],
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: new Vector3(1, 1, 1),
      defaultRotation: new Euler(0, 0, 0),
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: ROTATION_SNAP_DEGREES,
      collisionGroup: DEFAULT_COLLISION_GROUP,
    },
    storage: {
      mode: 'mock-api',
      localId,
      serverId,
      version: 1,
    },
    sync: {
      status: 'synced',
      lastSynced: timestamp,
      serverVersion: 1,
    },
    files: {
      model: {
        local: request.files.model,
        server: modelUrl,
        size: request.files.model.size,
        hash: createMockHash(`${serverId}-model`),
        lastModified:
          'lastModified' in request.files.model ? (request.files.model as File).lastModified : undefined,
      },
      thumbnail: {
        local: thumbnailBlob,
        server: request.files.thumbnail ? thumbnailUrl : undefined,
        size: request.files.thumbnail?.size ?? 0,
        hash: createMockHash(`${serverId}-thumbnail`),
        lastModified:
          request.files.thumbnail && 'lastModified' in request.files.thumbnail
            ? (request.files.thumbnail as File).lastModified
            : undefined,
      },
    },
    metadata: {
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: 'mock-user',
      tags: request.metadata.tags,
      isPublic: false,
      version: 1,
    },
  };
};

export class MockFurnitureApiService {
  async uploadFurniture(data: UploadFurnitureRequest): Promise<UploadFurnitureResponse> {
    await wait(MOCK_DELAY_MS);

    const localId = createIdentifier('mock');
    const serverId = createIdentifier('srv');
    const timestamp = Date.now();

    const item = createMockFurnitureItem(data, { localId, serverId, timestamp });
    mockFurnitureStore.set(serverId, item);

    return {
      id: localId,
      serverId,
      urls: {
        model: item.files.model.server ?? createPlaceholderUrl('models', serverId, MODEL_EXTENSION),
        thumbnail: createPlaceholderUrl('thumbnails', serverId, THUMBNAIL_EXTENSION),
      },
    };
  }

  async downloadFurniture(id: string): Promise<CustomFurnitureItem | null> {
    await wait(MOCK_DELAY_MS / 2);

    const item = findItem(id);
    return item ? cloneItem(item) : null;
  }

  async listFurniture(): Promise<CustomFurnitureItem[]> {
    await wait(MOCK_DELAY_MS / 2);

    return Array.from(mockFurnitureStore.values()).map((item) => cloneItem(item));
  }

  async getFurnitureList(): Promise<CustomFurnitureItem[]> {
    return this.listFurniture();
  }

  async syncStatus(id: string): Promise<SyncStatus> {
    await wait(MOCK_DELAY_MS / 2);

    return findItem(id) ? 'synced' : 'error';
  }

  async deleteFurniture(id: string): Promise<void> {
    await wait(MOCK_DELAY_MS / 2);

    for (const [key, item] of mockFurnitureStore.entries()) {
      if (item.storage.serverId === id || item.storage.localId === id || item.id === id) {
        mockFurnitureStore.delete(key);
        break;
      }
    }
  }
}

