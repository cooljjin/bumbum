// 저장소 관련 타입 정의
export type StorageMode = 'local-only' | 'mock-api' | 'hybrid';
export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'error' | 'disabled';

// 저장소 설정 타입
export interface StorageConfig {
  mode: StorageMode;
  apiUrl?: string;
  syncEnabled: boolean;
  service: 'mock' | 'firebase' | 'supabase' | 'aws';
  maxRetries?: number;
  retryDelay?: number;
}

// 파일 정보 타입
export interface FileInfo {
  local: Blob;
  server?: string;
  size: number;
  hash: string;
  lastModified?: number;
}

// 저장소 메타데이터 타입
export interface StorageMetadata {
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  tags: string[];
  isPublic: boolean;
  version: number;
}

// 동기화 정보 타입
export interface SyncInfo {
  status: SyncStatus;
  lastSynced?: number;
  serverVersion?: number;
  conflictData?: any;
  retryCount?: number;
  lastError?: string;
}

// 저장소 정보 타입
export interface StorageInfo {
  mode: StorageMode;
  localId: string;
  serverId?: string;
  version: number;
}

// 동기화 이벤트 타입
export interface SyncEvent {
  type: 'start' | 'progress' | 'complete' | 'error';
  itemId: string;
  progress?: number;
  error?: string;
  timestamp: number;
}

// 동기화 리스너 타입
export type SyncEventListener = (event: SyncEvent) => void;

// 저장소 통계 타입
export interface StorageStats {
  totalItems: number;
  syncedItems: number;
  pendingItems: number;
  errorItems: number;
  totalSize: number;
  lastSyncTime?: number;
}

