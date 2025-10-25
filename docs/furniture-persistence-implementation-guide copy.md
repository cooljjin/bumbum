# 가구 배치 데이터 영속성 구현 가이드 (기존 코드 활용)

## 📋 개요

**문제**: 페이지 새로고침 시 배치된 가구들이 사라짐  
**원인**: 저장 기능은 있지만 페이지 로드 시 자동 복원 로직이 없음  
**목표**: 기존 `storageManager`와 `editorStore`를 활용하여 자동 저장/복원 구현

---

## ✅ 기존 코드 현황

### 이미 구현된 기능들
```typescript
// editorStore.ts
- saveCurrentState()    // localStorage에 'bumbum_room_state' 저장
- loadSavedState()      // 'bumbum_room_state'에서 로드
- triggerAutoSave()     // storageManager.autoSave() 호출
- loadAutoSave()        // 자동 저장 레이아웃 복구

// storageManager.ts
- autoSave(items)       // 'bumbum_auto_save'에 압축 저장
- loadAutoSave()        // 자동 저장 데이터 로드
- saveLayout()          // 레이아웃 수동 저장
- loadLayout()          // 레이아웃 로드
```

### 문제점
1. ❌ 상태 변경 시 자동 저장이 **실제로 호출되지 않음**
2. ❌ 페이지 로드 시 저장된 데이터를 **자동으로 불러오지 않음**
3. ❌ `storageManager.decompressItems()`가 불완전 (원본 데이터 복원 안됨)

---

## 🎯 작업 분담

### Agent A: 자동 저장 활성화
**담당**: 상태 변경 감지 및 자동 저장 트리거
- `src/hooks/useFurnitureAutoSave.ts` (신규 생성)
- `src/store/editorStore.ts` (수정 - 방 크기/텍스처 저장 추가)

### Agent B: 자동 복원 구현
**담당**: 페이지 로드 시 데이터 복원
- `src/utils/storageManager.ts` (수정 - decompressItems 개선)
- `src/hooks/useFurnitureInitializer.ts` (신규 생성)
- `src/components/3D/Room3DContainer.tsx` (수정 - 훅 통합)

---

## 🔧 Agent A: 자동 저장 활성화

### 1. `src/hooks/useFurnitureAutoSave.ts` 생성 (신규)

```typescript
/**
 * 가구 배치 자동 저장 훅
 * 
 * 기존 editorStore.triggerAutoSave() 활용
 */

import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';

const AUTO_SAVE_DELAY = 3000; // 3초 디바운스

export const useFurnitureAutoSave = () => {
  const placedItems = useEditorStore(state => state.placedItems);
  const triggerAutoSave = useEditorStore(state => state.triggerAutoSave);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevItemCountRef = useRef<number>(0);

  useEffect(() => {
    // 아이템이 없고 이전에도 없었으면 저장하지 않음
    if (placedItems.length === 0 && prevItemCountRef.current === 0) {
      return;
    }

    // 이전 타이머 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 디바운스된 자동 저장
    saveTimeoutRef.current = setTimeout(() => {
      triggerAutoSave();
      prevItemCountRef.current = placedItems.length;
      console.log(`✅ [AutoSave] 자동 저장 완료 (${placedItems.length}개 가구)`);
    }, AUTO_SAVE_DELAY);

    // 클린업
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [placedItems, triggerAutoSave]);

  // 컴포넌트 언마운트 시 즉시 저장
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // 마지막 저장 실행
      const items = useEditorStore.getState().placedItems;
      if (items.length > 0) {
        useEditorStore.getState().triggerAutoSave();
        console.log('✅ [AutoSave] 언마운트 시 최종 저장');
      }
    };
  }, []);
};
```

### 2. `src/store/editorStore.ts` 수정 (개선)

**수정 위치**: `triggerAutoSave` 함수 개선

```typescript
// 기존 코드 (819-835줄):
saveCurrentState: () => {
  try {
    const { placedItems, grid, rotationSnap, snapStrength } = get();
    const saveData = {
      placedItems,
      grid,
      rotationSnap,
      snapStrength,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('bumbum_room_state', JSON.stringify(saveData));
    // console.log('✅ 성능: 룸 상태가 저장되었습니다');
  } catch (error) {
    // console.error('룸 상태 저장 실패:', error);
  }
},

// 수정 후 (방 크기와 텍스처 정보 추가):
saveCurrentState: () => {
  try {
    const { 
      placedItems, 
      grid, 
      rotationSnap, 
      snapStrength, 
      roomDimensions,
      currentFloorTexture,
      currentWallTexture 
    } = get();
    
    const saveData = {
      placedItems,
      grid,
      rotationSnap,
      snapStrength,
      roomDimensions,
      settings: {
        floorTexture: currentFloorTexture,
        wallTexture: currentWallTexture
      },
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('bumbum_room_state', JSON.stringify(saveData));
    console.log('✅ [Storage] 룸 상태 저장 완료:', {
      items: placedItems.length,
      room: roomDimensions
    });
  } catch (error) {
    console.error('❌ [Storage] 룸 상태 저장 실패:', error);
  }
},
```

**수정 위치**: `loadSavedState` 함수 개선

```typescript
// 기존 코드 (838-869줄)에서 방 크기와 텍스처 복원 추가:

loadSavedState: () => {
  try {
    const savedData = localStorage.getItem('bumbum_room_state');
    if (!savedData) {
      console.log('ℹ️ [Storage] 저장된 룸 상태 없음');
      return;
    }

    const { 
      placedItems, 
      grid, 
      rotationSnap, 
      snapStrength,
      roomDimensions,
      settings 
    } = JSON.parse(savedData);

    // 히스토리에 현재 상태 저장
    const { history } = get();
    const newHistory: EditHistory = {
      past: [...history.past, get().placedItems],
      present: placedItems,
      future: []
    };

    set({
      placedItems,
      grid: { ...get().grid, ...grid },
      rotationSnap: { ...get().rotationSnap, ...rotationSnap },
      snapStrength: { ...get().snapStrength, ...snapStrength },
      roomDimensions: roomDimensions || get().roomDimensions,
      currentFloorTexture: settings?.floorTexture || get().currentFloorTexture,
      currentWallTexture: settings?.wallTexture || get().currentWallTexture,
      history: newHistory,
      selectedItemId: null
    });

    // 방 크기가 복원되었으면 경계 업데이트
    if (roomDimensions) {
      setBoundaryRoomDimensions(roomDimensions);
    }

    console.log('✅ [Storage] 룸 상태 로드 완료:', {
      items: placedItems.length,
      room: roomDimensions
    });
  } catch (error) {
    console.error('❌ [Storage] 룸 상태 로드 실패:', error);
  }
},
```

### 3. Agent A 테스트 방법

```javascript
// 브라우저 콘솔에서 테스트
1. 가구 몇 개 배치
2. 3초 대기
3. localStorage 확인:
   localStorage.getItem('bumbum_auto_save')
4. 콘솔에 "✅ [AutoSave] 자동 저장 완료" 메시지 확인
```

---

## 🔧 Agent B: 자동 복원 구현

### 1. `src/utils/storageManager.ts` 수정 (개선)

**수정 위치**: `decompressItems` 함수 (372-385줄)

**문제**: 현재 `decompressItems`는 원본 가구 데이터를 복원하지 못함

```typescript
// 기존 코드 (불완전):
private decompressItems(compressed: CompressedState): PlacedItem[] {
  // 실제 구현에서는 furnitureCatalog에서 원본 데이터를 가져와야 함
  // 여기서는 기본 구조만 반환
  return compressed.items.map(item => ({
    id: item.id,
    name: `Furniture_${item.id}`,
    modelPath: '/models/default.glb',
    position: new Vector3(item.pos[0], item.pos[1], item.pos[2]),
    rotation: new Euler(item.rot[0], item.rot[1], item.rot[2]),
    scale: new Vector3(item.scl[0], item.scl[1], item.scl[2]),
    footprint: { width: 1, depth: 1, height: 1 },
    isLocked: item.locked
  } as PlacedItem));
}
```

**수정 후 (개선안 - 전체 데이터 저장 방식으로 변경)**:

```typescript
/**
 * 📦 아이템 압축 - 전체 데이터 저장 방식으로 변경
 * 
 * 기존: 위치/회전/스케일만 저장 → 복원 시 원본 데이터 손실
 * 개선: 전체 PlacedItem 저장 → 완전한 복원 가능
 */
private compressItems(items: PlacedItem[]): CompressedState {
  return {
    items: items.map(item => ({
      // 기존 압축 형식 유지 (하위 호환성)
      id: item.id,
      pos: [item.position.x, item.position.y, item.position.z],
      rot: [item.rotation.x, item.rotation.y, item.rotation.z],
      scl: [item.scale.x, item.scale.y, item.scale.z],
      locked: item.isLocked || false,
      // 전체 데이터 추가
      fullData: {
        name: item.name,
        modelPath: item.modelPath,
        footprint: item.footprint,
        mount: item.mount,
        metadata: item.metadata,
        snapSettings: item.snapSettings
      }
    })),
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
    
    return {
      id: item.id,
      name: fullData?.name || `Furniture_${item.id}`,
      modelPath: fullData?.modelPath || '/models/default.glb',
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
```

**타입 업데이트 필요**: `src/types/editor.ts`의 `CompressedState` 타입에 `fullData` 추가

```typescript
// src/types/editor.ts (69-80줄 수정)

export interface CompressedState {
  items: {
    id: string;
    pos: number[];
    rot: number[];
    scl: number[];
    locked: boolean;
    // 전체 데이터 추가 (선택사항 - 하위 호환성)
    fullData?: {
      name: string;
      modelPath: string;
      footprint: {
        width: number;
        depth: number;
        height: number;
      };
      mount?: {
        type: 'wall';
        side: 'minX' | 'maxX' | 'minZ' | 'maxZ';
        u: number;
        height: number;
        offset?: number;
      };
      metadata?: {
        category: string;
        brand?: string;
        price?: number;
        description?: string;
        furnitureId?: string;
      };
      snapSettings?: {
        gridEnabled: boolean;
        rotationSnapEnabled: boolean;
        rotationSnapAngle: number;
        gridSize: number;
        gridDivisions: number;
      };
    };
  }[];
  timestamp: number;
  description: string;
}
```

### 2. `src/hooks/useFurnitureInitializer.ts` 생성 (신규)

```typescript
/**
 * 가구 배치 초기화 훅
 * 
 * 기존 editorStore.loadAutoSave() 활용
 */

import { useEffect, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';

export const useFurnitureInitializer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  
  const loadAutoSave = useEditorStore(state => state.loadAutoSave);
  const loadSavedState = useEditorStore(state => state.loadSavedState);
  const setRoomDimensions = useEditorStore(state => state.setRoomDimensions);

  useEffect(() => {
    const initializeFurniture = async () => {
      try {
        console.log('🔄 [Initializer] 가구 배치 데이터 로드 시작...');

        // 1. bumbum_room_state (우선순위 1)
        try {
          loadSavedState();
          const items = useEditorStore.getState().placedItems;
          
          if (items && items.length > 0) {
            console.log('✅ [Initializer] bumbum_room_state에서 복원:', items.length, '개');
            setHasLoadedData(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn('⚠️ [Initializer] bumbum_room_state 로드 실패:', error);
        }

        // 2. bumbum_auto_save (우선순위 2)
        try {
          const autoSavedItems = loadAutoSave();
          
          if (autoSavedItems && autoSavedItems.length > 0) {
            console.log('✅ [Initializer] bumbum_auto_save에서 복원:', autoSavedItems.length, '개');
            setHasLoadedData(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn('⚠️ [Initializer] bumbum_auto_save 로드 실패:', error);
        }

        console.log('ℹ️ [Initializer] 저장된 데이터 없음 - 기본 상태 사용');
      } catch (error) {
        console.error('❌ [Initializer] 초기화 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // 초기화 실행 (한 번만)
    initializeFurniture();
  }, []); // 빈 배열 - 최초 1회만 실행

  return {
    isLoading,
    hasLoadedData
  };
};
```

### 3. `src/components/3D/Room3DContainer.tsx` 수정 (통합)

**수정 위치**: 파일 상단 및 컴포넌트 내부

```typescript
// Import 추가
import { useFurnitureInitializer } from '@/hooks/useFurnitureInitializer';
import { useFurnitureAutoSave } from '@/hooks/useFurnitureAutoSave';

// Room3DContainer 컴포넌트 내부 최상단에 추가
export const Room3DContainer: React.FC<Room3DContainerProps> = ({ children }) => {
  // 가구 데이터 초기화 (페이지 로드 시)
  const { isLoading: isFurnitureLoading, hasLoadedData } = useFurnitureInitializer();
  
  // 자동 저장 활성화 (상태 변경 감지)
  useFurnitureAutoSave();

  // 로딩 중 UI (선택사항 - 빠르게 로드되므로 생략 가능)
  if (isFurnitureLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">가구 배치 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 기존 코드 계속...
  return (
    <div className="relative w-full h-full">
      {/* 기존 코드 */}
    </div>
  );
};
```

### 4. Agent B 테스트 방법

```javascript
// 브라우저 콘솔에서 테스트
1. 가구 배치 후 페이지 새로고침
2. 콘솔 메시지 확인:
   "🔄 [Initializer] 가구 배치 데이터 로드 시작..."
   "✅ [Initializer] bumbum_room_state에서 복원: N개"
3. 가구가 화면에 나타나는지 확인
```

---

## 🔄 작업 순서

### Agent A 작업 순서
1. ✅ `src/hooks/useFurnitureAutoSave.ts` 파일 생성
2. ✅ `src/store/editorStore.ts`의 `saveCurrentState()` 함수 수정
3. ✅ `src/store/editorStore.ts`의 `loadSavedState()` 함수 수정
4. ✅ 테스트: 가구 배치 후 localStorage 확인

### Agent B 작업 순서
1. ⏸️ **Agent A 완료 대기**
2. ✅ `src/types/editor.ts`의 `CompressedState` 타입 수정
3. ✅ `src/utils/storageManager.ts`의 `compressItems()` 함수 수정
4. ✅ `src/utils/storageManager.ts`의 `decompressItems()` 함수 수정
5. ✅ `src/hooks/useFurnitureInitializer.ts` 파일 생성
6. ✅ `src/components/3D/Room3DContainer.tsx` 수정
7. ✅ 테스트: 페이지 새로고침 후 가구 복원 확인

---

## ✅ 검증 체크리스트

### Agent A 검증
- [ ] `useFurnitureAutoSave.ts` 파일 생성됨
- [ ] 가구 추가/삭제/이동 시 3초 후 자동 저장됨
- [ ] localStorage에 'bumbum_auto_save' 키로 데이터 저장됨
- [ ] 콘솔에 "✅ [AutoSave] 자동 저장 완료" 메시지 표시
- [ ] `saveCurrentState()`가 방 크기와 텍스처 저장함
- [ ] `loadSavedState()`가 방 크기와 텍스처 복원함

### Agent B 검증
- [ ] `CompressedState` 타입에 `fullData` 추가됨
- [ ] `compressItems()`가 전체 가구 데이터 저장함
- [ ] `decompressItems()`가 전체 가구 데이터 복원함
- [ ] `useFurnitureInitializer.ts` 파일 생성됨
- [ ] `Room3DContainer`에 두 훅이 추가됨
- [ ] 페이지 새로고침 후 가구가 유지됨
- [ ] 가구 이름, 모델, 메타데이터가 정확히 복원됨

### 통합 테스트
1. [ ] 가구 5개 배치
2. [ ] 3초 대기 (자동 저장)
3. [ ] 페이지 새로고침
4. [ ] 5개 가구가 정확한 위치에 복원됨
5. [ ] 가구 추가 배치
6. [ ] 다시 새로고침
7. [ ] 모든 가구가 유지됨
8. [ ] 방 크기와 텍스처 설정 유지됨

---

## 🚨 충돌 방지 규칙

### Agent A 전용 파일
- ✅ `src/hooks/useFurnitureAutoSave.ts` (신규)
- ✅ `src/store/editorStore.ts` (saveCurrentState, loadSavedState 함수만 수정)

### Agent B 전용 파일
- ✅ `src/types/editor.ts` (CompressedState 타입 수정)
- ✅ `src/utils/storageManager.ts` (compressItems, decompressItems 함수 수정)
- ✅ `src/hooks/useFurnitureInitializer.ts` (신규)
- ✅ `src/components/3D/Room3DContainer.tsx` (훅 추가)

### 공통 규칙
- Agent A가 완료한 후 Agent B 시작
- 각자 담당 파일만 수정
- 타입 정의는 Agent B가 먼저 수정 → Agent A는 영향 없음

---

## 🐛 예상 문제 및 해결책

### 문제 1: 가구가 중복으로 나타남
**원인**: `bumbum_room_state`와 `bumbum_auto_save` 둘 다 로드  
**해결**: `useFurnitureInitializer`가 우선순위대로 하나만 로드 (이미 구현됨)

### 문제 2: 방 크기가 복원 안됨
**원인**: `saveCurrentState()`에서 `roomDimensions` 저장 안함  
**해결**: Agent A가 수정 (이미 가이드에 포함)

### 문제 3: 가구 메타데이터 손실
**원인**: `compressItems()`가 위치/회전만 저장  
**해결**: Agent B가 `fullData` 추가 (이미 가이드에 포함)

### 문제 4: localStorage 용량 초과
**증상**: QuotaExceededError  
**해결**: 
```typescript
// storageManager.ts의 cleanupStorage() 주기적으로 호출
// 또는 최대 레이아웃 수 제한 (이미 10개로 제한됨)
```

### 문제 5: 자동 저장이 너무 자주 실행됨
**해결**: 디바운스 시간 3초로 설정 (이미 구현됨)

---

## 📊 데이터 저장 구조

### localStorage 키
```typescript
'bumbum_room_state'  // 수동 저장 + 전체 설정
'bumbum_auto_save'   // 자동 저장 (압축)
'bumbum_room_layouts' // 여러 레이아웃 저장
```

### bumbum_room_state 구조 (개선 후)
```json
{
  "placedItems": [...],
  "grid": {...},
  "rotationSnap": {...},
  "snapStrength": {...},
  "roomDimensions": {
    "width": 10,
    "depth": 10,
    "height": 3,
    "wallThickness": 0.2,
    "margin": 0.5
  },
  "settings": {
    "floorTexture": "/models/floor/floor_wooden.png",
    "wallTexture": "/models/wall/wall_beige.png"
  },
  "timestamp": "2025-10-08T..."
}
```

### bumbum_auto_save 구조 (개선 후)
```json
{
  "items": [
    {
      "id": "...",
      "pos": [0, 0, 0],
      "rot": [0, 0, 0],
      "scl": [1, 1, 1],
      "locked": false,
      "fullData": {
        "name": "소파",
        "modelPath": "/models/sofa.glb",
        "footprint": {...},
        "metadata": {...}
      }
    }
  ],
  "timestamp": 1633...,
  "description": "auto_save"
}
```

---

## 💡 기존 기능과의 통합

### 기존 기능 유지
✅ 레이아웃 수동 저장/로드 (`saveLayout`, `loadLayout`)  
✅ 저장소 관리 (`cleanupStorage`, `getStorageUsage`)  
✅ 히스토리 관리 (Undo/Redo)  
✅ 방 크기 설정 (`setRoomDimensions`)

### 추가 기능
✅ 자동 저장 (3초 디바운스)  
✅ 페이지 로드 시 자동 복원  
✅ 방 크기와 텍스처 영속성  
✅ 완전한 가구 데이터 복원

---

## 🎉 완료 기준

### Agent A 완료
- [x] `useFurnitureAutoSave` 훅 생성
- [x] `saveCurrentState` 개선 (방 크기/텍스처 추가)
- [x] `loadSavedState` 개선 (방 크기/텍스처 복원)
- [x] 자동 저장 동작 확인

### Agent B 완료
- [x] `CompressedState` 타입 수정
- [x] `compressItems`/`decompressItems` 개선
- [x] `useFurnitureInitializer` 훅 생성
- [x] `Room3DContainer` 통합
- [x] 페이지 새로고침 시 복원 확인

### 최종 확인
- [x] 가구 배치 → 자동 저장 → 새로고침 → 복원
- [x] 가구 메타데이터 유지
- [x] 방 크기와 텍스처 유지
- [x] 오류 없이 정상 작동

---

**작성일**: 2025-10-08  
**버전**: 2.0.0 (기존 코드 활용)  
**변경사항**: 새로운 파일 대신 기존 `storageManager`와 `editorStore` 활용
