// API 인터페이스 정의
export type ApiServiceType = 'mock' | 'firebase' | 'supabase' | 'aws';

// 가구 업로드 요청 타입
export interface UploadFurnitureRequest {
  name: string;
  category: string;
  metadata: {
    brand?: string;
    model?: string;
    price?: number;
    description?: string;
    tags: string[];
    materials?: string[];
    colors?: string[];
  };
  files: {
    model: File;
    thumbnail?: File;
  };
}

// 가구 업로드 응답 타입
export interface UploadFurnitureResponse {
  id: string;
  serverId: string;
  urls: {
    model: string;
    thumbnail: string;
  };
}

export interface RoomDimensionsDto {
  width: number;
  depth: number;
  height: number;
  wallThickness: number;
  margin: number;
}

export interface SaveRoomDimensionsResponse {
  dimensions: RoomDimensionsDto;
  updatedAt: number;
}

// 가구 다운로드 요청 타입
export interface DownloadFurnitureRequest {
  id: string;
  includeFiles?: boolean;
}

// 동기화 상태 타입
export interface SyncStatusResponse {
  id: string;
  status: 'pending' | 'synced' | 'conflict' | 'error' | 'disabled';
  lastSynced?: number;
  serverVersion?: number;
  conflictData?: any;
}

// API 에러 타입
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// API 응답 래퍼 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// 인증 관련 타입
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

