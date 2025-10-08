import type { ApiServiceType, UploadFurnitureRequest, UploadFurnitureResponse } from '@/types/api';
import { CustomFurnitureItem } from '@/types/furniture';
import type { SyncStatus } from '@/types/storage';
import { MockFurnitureApiService } from './mockApi';

export interface FurnitureApiService {
  uploadFurniture(data: UploadFurnitureRequest): Promise<UploadFurnitureResponse>;
  downloadFurniture(id: string): Promise<CustomFurnitureItem | null>;
  listFurniture(): Promise<CustomFurnitureItem[]>;
  getFurnitureList(): Promise<CustomFurnitureItem[]>;
  syncStatus(id: string): Promise<SyncStatus>;
  deleteFurniture(id: string): Promise<void>;
}

const FALLBACK_SERVICE = 'mock' satisfies ApiServiceType;

const createFallbackService = (): FurnitureApiService => {
  return new MockFurnitureApiService();
};

export class ApiFactory {
  static createApiService(service: ApiServiceType = FALLBACK_SERVICE): FurnitureApiService {
    switch (service) {
      case 'mock':
        return new MockFurnitureApiService();
      case 'firebase':
      case 'supabase':
      case 'aws': {
        console.warn(
          `[ApiFactory] Service "${service}" is not yet implemented. Falling back to mock service.`,
        );
        return createFallbackService();
      }
      default: {
        console.warn(
          `[ApiFactory] Unknown service "${service}" requested. Falling back to mock service.`,
        );
        return createFallbackService();
      }
    }
  }
}

