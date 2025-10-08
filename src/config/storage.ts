import type { ApiServiceType } from '@/types/api';
import type { StorageConfig } from '@/types/storage';

const ALLOWED_SERVICES: ApiServiceType[] = ['mock', 'firebase', 'supabase', 'aws'];

const isApiServiceType = (value: string | undefined): value is ApiServiceType => {
  return typeof value === 'string' && ALLOWED_SERVICES.includes(value as ApiServiceType);
};

const MVP_CONFIG: StorageConfig = {
  mode: 'mock-api',
  syncEnabled: true,
  service: 'mock',
};

const PRODUCTION_BASE_CONFIG: StorageConfig = {
  mode: 'hybrid',
  syncEnabled: true,
  service: 'mock',
};

export const STORAGE_CONFIG = {
  mvp: MVP_CONFIG,
  production: PRODUCTION_BASE_CONFIG,
} as const;

export const getStorageConfig = (): StorageConfig => {
  const shouldUseMock =
    process.env.NODE_ENV !== 'production' || !process.env.NEXT_PUBLIC_API_URL;

  if (shouldUseMock) {
    return { ...STORAGE_CONFIG.mvp };
  }

  const service = isApiServiceType(process.env.NEXT_PUBLIC_API_SERVICE)
    ? (process.env.NEXT_PUBLIC_API_SERVICE as ApiServiceType)
    : 'mock';

  return {
    ...STORAGE_CONFIG.production,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    service,
  };
};

