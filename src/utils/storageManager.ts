import { CompressedState, PlacedItem } from '../types/editor';
import { Vector3, Euler } from 'three';

// 저장소 키 상수
const STORAGE_KEYS = {
  LAYOUTS: 'bumbum_room_layouts',
  CURRENT_LAYOUT: 'bumbum_current_layout',
  AUTO_SAVE: 'bumbum_auto_save',
  SETTINGS: 'bumbum_storage_settings'
};

// 저장소 설정 타입
interface StorageSettings {
  maxLayouts: number;
  autoSaveInterval: number; // ms
  compressionEnabled: boolean;
}

// 기본 설정
const DEFAULT_SETTINGS: StorageSettings = {
  maxLayouts: 10,
  autoSaveInterval: 30000, // 30초
  compressionEnabled: true
};

// 레이아웃 메타데이터 타입
interface LayoutMetadata {
  id: string;
  name: string;
  timestamp: number;
  itemCount: number;
  description?: string;
  tags?: string[];
}

// 저장된 레이아웃 타입
interface SavedLayout {
  metadata: LayoutMetadata;
  data: CompressedState;
}

/**
 * 🗄️ 저장소 관리자 클래스
 * localStorage 기반의 가구 배치 상태 영구 저장 시스템
 */
class StorageManager {
  private settings: StorageSettings;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = this.loadSettings();
    // 클라이언트 환경에서만 자동 저장 타이머 시작
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      this.startAutoSave();
    }
  }

  /**
   * 설정 로드
   */
  private loadSettings(): StorageSettings {
    // SSR 환경에서는 기본 설정만 사용
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_SETTINGS;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (error) {
      console.warn('⚠️ 저장소 설정 로드 실패, 기본값 사용:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * 설정 저장
   */
  saveSettings(settings: Partial<StorageSettings>): void {
    // SSR 환경에서는 아무 작업도 하지 않음
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      this.settings = { ...this.settings, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      // console.log('✅ 저장소 설정 저장 완료:', this.settings);
    } catch (error) {
      console.error('❌ 저장소 설정 저장 실패:', error);
    }
  }

  /**
   * 🎯 현재 레이아웃 자동 저장
   */
  autoSave(items: PlacedItem[]): void {
    // SSR 환경에서는 아무 작업도 하지 않음
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    if (!this.settings.compressionEnabled) return;

    try {
      const compressedData = this.compressItems(items);
      const autoSaveData: CompressedState = {
        ...compressedData,
        timestamp: Date.now(),
        description: 'auto_save'
      };

      localStorage.setItem(STORAGE_KEYS.AUTO_SAVE, JSON.stringify(autoSaveData));
      // console.log('🔄 자동 저장 완료:', {
      //   itemCount: items.length,
      //   timestamp: new Date().toLocaleTimeString()
      // });
    } catch (error) {
      console.error('❌ 자동 저장 실패:', error);
    }
  }

  /**
   * 💾 레이아웃 수동 저장
   */
  saveLayout(name: string, items: PlacedItem[], description?: string, tags?: string[]): string {
    // SSR 환경에서는 에러 발생
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('저장소가 초기화되지 않았습니다.');
    }

    try {
      const layouts = this.loadAllLayouts();
      const layoutId = `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newLayout: SavedLayout = {
        metadata: {
          id: layoutId,
          name,
          timestamp: Date.now(),
          itemCount: items.length,
          description: description || '',
          tags: tags || []
        },
        data: this.compressItems(items)
      };

      // 최대 레이아웃 수 제한
      if (layouts.length >= this.settings.maxLayouts) {
        layouts.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
        layouts.pop(); // 가장 오래된 레이아웃 제거
      }

      layouts.push(newLayout);
      localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(layouts));

      // console.log('✅ 레이아웃 저장 완료:', {
      //   id: layoutId,
      //   name,
      //   itemCount: items.length
      // });

      return layoutId;
    } catch (error) {
      console.error('❌ 레이아웃 저장 실패:', error);
      throw new Error('레이아웃 저장에 실패했습니다.');
    }
  }

  /**
   * 📂 모든 레이아웃 로드
   */
  loadAllLayouts(): SavedLayout[] {
    // SSR 환경에서는 빈 배열 반환
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAYOUTS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('❌ 레이아웃 목록 로드 실패:', error);
      return [];
    }
  }

  /**
   * 📥 특정 레이아웃 로드
   */
  loadLayout(layoutId: string): PlacedItem[] | null {
    // SSR 환경에서는 null 반환
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const layouts = this.loadAllLayouts();
      const layout = layouts.find(l => l.metadata.id === layoutId);

      if (!layout) {
        console.warn('⚠️ 레이아웃을 찾을 수 없음:', layoutId);
        return null;
      }

      const items = this.decompressItems(layout.data);
      // console.log('✅ 레이아웃 로드 완료:', {
      //   name: layout.metadata.name,
      //   itemCount: items.length
      // });

      return items;
    } catch (error) {
      console.error('❌ 레이아웃 로드 실패:', error);
      return null;
    }
  }

  /**
   * 🗑️ 레이아웃 삭제
   */
  deleteLayout(layoutId: string): boolean {
    // SSR 환경에서는 false 반환
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    try {
      const layouts = this.loadAllLayouts();
      const filteredLayouts = layouts.filter(l => l.metadata.id !== layoutId);

      if (filteredLayouts.length === layouts.length) {
        console.warn('⚠️ 삭제할 레이아웃을 찾을 수 없음:', layoutId);
        return false;
      }

      localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(filteredLayouts));
      // console.log('✅ 레이아웃 삭제 완료:', layoutId);
      return true;
    } catch (error) {
      console.error('❌ 레이아웃 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 🔄 자동 저장된 레이아웃 복구
   */
  loadAutoSave(): PlacedItem[] | null {
    // SSR 환경에서는 null 반환
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE);
      if (!saved) return null;

      const autoSaveData: CompressedState = JSON.parse(saved);
      const items = this.decompressItems(autoSaveData);

      // console.log('✅ 자동 저장 레이아웃 복구 완료:', {
      //   itemCount: items.length,
      //   timestamp: new Date(autoSaveData.timestamp).toLocaleString()
      // });

      return items;
    } catch (error) {
      console.error('❌ 자동 저장 레이아웃 복구 실패:', error);
      return null;
    }
  }

  /**
   * 📊 저장소 사용량 확인
   */
  getStorageUsage(): { used: number; total: number; percentage: number } {
    // SSR 환경에서는 기본값 반환
    if (typeof window === 'undefined' || !window.localStorage) {
      return { used: 0, total: 0, percentage: 0 };
    }

    try {
      const layouts = localStorage.getItem(STORAGE_KEYS.LAYOUTS) || '';
      const autoSave = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE) || '';
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS) || '';

      const used = layouts.length + autoSave.length + settings.length;
      const total = 5 * 1024 * 1024; // 5MB (localStorage 일반적 제한)
      const percentage = (used / total) * 100;

      return { used, total, percentage };
    } catch (error) {
      console.error('❌ 저장소 사용량 확인 실패:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * 🧹 저장소 정리 (오래된 데이터 제거)
   */
  cleanupStorage(): { removed: number; freed: number } {
    // SSR 환경에서는 아무 작업도 하지 않음
    if (typeof window === 'undefined' || !window.localStorage) {
      return { removed: 0, freed: 0 };
    }

    try {
      const layouts = this.loadAllLayouts();
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30일

      const validLayouts = layouts.filter(l => (now - l.metadata.timestamp) < maxAge);
      const removed = layouts.length - validLayouts.length;

      if (removed > 0) {
        localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(validLayouts));
        // console.log('🧹 저장소 정리 완료:', { removed, remaining: validLayouts.length });
      }

      return { removed, freed: removed * 1024 }; // 대략적인 메모리 해제량
    } catch (error) {
      console.error('❌ 저장소 정리 실패:', error);
      return { removed: 0, freed: 0 };
    }
  }

  /**
   * 🔒 자동 저장 시작
   */
  startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      // editorStore에서 현재 상태를 가져와서 자동 저장
      // 이 함수는 외부에서 호출되어야 함
    }, this.settings.autoSaveInterval);
  }

  /**
   * 🛑 자동 저장 중지
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 📦 아이템 압축 - 전체 데이터 저장 방식으로 변경
   * 
   * 기존: 위치/회전/스케일만 저장 → 복원 시 원본 데이터 손실
   * 개선: 전체 PlacedItem 저장 → 완전한 복원 가능
   */
  private compressItems(items: PlacedItem[]): CompressedState {
    return {
      items: items.map(item => {
        // ✅ Agent A + B: blob URL 필터링 - localStorage에 저장 금지
        let safeModelPath = item.modelPath;
        
        // blob URL은 페이지 새로고침 시 무효화되므로 저장하지 않음
        if (safeModelPath && safeModelPath.startsWith('blob:')) {
          console.warn('[StorageManager] ⚠️ blob URL을 localStorage에 저장할 수 없습니다. 기본값으로 대체:', item.name);
          safeModelPath = undefined; // 저장하지 않음
        }
        
        // undefined가 포함된 잘못된 URL 제거
        if (safeModelPath && (safeModelPath === 'undefined' || safeModelPath.includes('undefined'))) {
          console.warn('[StorageManager] ⚠️ 잘못된 modelPath 감지:', safeModelPath);
          safeModelPath = undefined;
        }
        
        return {
          // 기존 압축 형식 유지 (하위 호환성)
          id: item.id,
          pos: [item.position.x, item.position.y, item.position.z],
          rot: [item.rotation.x, item.rotation.y, item.rotation.z],
          scl: [item.scale.x, item.scale.y, item.scale.z],
          locked: item.isLocked || false,
          // 전체 데이터 추가
          fullData: {
            name: item.name,
            modelPath: safeModelPath, // ✅ 필터링된 경로만 저장
            footprint: item.footprint,
            mount: item.mount,
            metadata: item.metadata,
            snapSettings: item.snapSettings
          }
        };
      }),
      timestamp: Date.now(),
      description: 'manual_save'
    };
  }

  /**
   * 📦 아이템 압축 해제 - 전체 데이터 복원
   */
  private decompressItems(compressed: CompressedState): PlacedItem[] {
    return compressed.items.map(item => {
      // fullData가 있으면 사용, 없으면 기본값 (하위 호환성)
      const fullData = (item as any).fullData;
      
      // ✅ Agent A + B: 기존 저장된 blob URL 정리
      let modelPath = fullData?.modelPath || '/models/default.glb';
      
      // blob URL이 저장되어 있으면 제거하고 기본값 사용
      if (modelPath && modelPath.startsWith('blob:')) {
        console.warn('[StorageManager] ⚠️ localStorage에서 잘못된 blob URL 발견, 제거:', modelPath);
        modelPath = '/models/default.glb'; // 기본값으로 대체
      }
      
      // undefined가 포함된 잘못된 URL 정리
      if (modelPath && (modelPath === 'undefined' || modelPath.includes('undefined'))) {
        console.warn('[StorageManager] ⚠️ 잘못된 modelPath 정리:', modelPath);
        modelPath = '/models/default.glb';
      }
      
      return {
        id: item.id,
        name: fullData?.name || `Furniture_${item.id}`,
        modelPath: modelPath, // ✅ 정리된 경로 사용
        position: new Vector3(item.pos[0], item.pos[1], item.pos[2]),
        rotation: new Euler(item.rot[0], item.rot[1], item.rot[2]),
        scale: new Vector3(item.scl[0], item.scl[1], item.scl[2]),
        footprint: fullData?.footprint || { width: 1, depth: 1, height: 1 },
        mount: fullData?.mount,
        metadata: fullData?.metadata,
        isLocked: item.locked,
        snapSettings: fullData?.snapSettings
      } as PlacedItem;
    });
  }
}

// 싱글톤 인스턴스 생성
export const storageManager = new StorageManager();

// 편의 함수들
export const saveLayout = (name: string, items: PlacedItem[], description?: string, tags?: string[]) =>
  storageManager.saveLayout(name, items, description, tags);

export const loadLayout = (layoutId: string) =>
  storageManager.loadLayout(layoutId);

export const loadAllLayouts = () =>
  storageManager.loadAllLayouts();

export const deleteLayout = (layoutId: string) =>
  storageManager.deleteLayout(layoutId);

export const loadAutoSave = () =>
  storageManager.loadAutoSave();

export const getStorageUsage = () =>
  storageManager.getStorageUsage();

export const cleanupStorage = () =>
  storageManager.cleanupStorage();
