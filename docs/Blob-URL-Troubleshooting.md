# Blob URL 문제 해결 가이드

## 일반적인 문제

### 1. Blob URL이 'undefined'로 표시됨

**증상:**
```
blob:http://localhost:3000/undefined
```

**원인:**
- Blob 객체가 올바르게 전달되지 않음
- File 객체가 null 또는 undefined

**해결방법:**

```typescript
// ❌ 나쁜 예시
const url = blobManager.createUrl(undefinedBlob, metadata);

// ✅ 좋은 예시
if (!blob) {
  console.error('Blob is undefined');
  return null;
}
const url = blobManager.createUrl(blob, metadata);
```

### 2. HMR 후 3D 모델이 사라짐

**증상:**
- 코드 수정 후 자동 새로고침 시 모델이 보이지 않음
- 콘솔에 "Blob URL is not accessible" 에러

**원인:**
- HMR 시 Blob URL이 무효화됨
- 복구 로직이 비활성화됨

**해결방법:**

```typescript
// useManagedBlob에서 autoRecover 활성화
const { blobUrl, isRecovered } = useManagedBlob(file, {
  type: 'model',
  itemId: item.id,
  autoRecover: true,  // ✅ 자동 복구 활성화
  onRecovered: (url) => {
    console.log('✅ Blob URL recovered after HMR:', url);
  }
});
```

### 3. 브라우저 새로고침 후 커스텀 가구가 로드되지 않음

**증상:**
- 페이지 새로고침 후 배치한 커스텀 가구가 사라짐
- 내장 가구는 정상 작동

**원인:**
- Blob URL이 세션에만 존재
- ItemId가 제공되지 않아 복구 불가

**해결방법:**

```typescript
// PlacedItem에 metadata.furnitureId 저장
const placedItem: PlacedItem = {
  id: uuid(),
  name: furniture.name,
  modelPath: blobUrl,
  metadata: {
    furnitureId: furniture.id,  // ✅ 복구를 위한 ID 저장
    category: furniture.category
  },
  // ... 기타 속성
};

// DraggableFurniture가 자동으로 복구
const result = await blobManager.ensureValidUrl(
  item.modelPath,
  item.metadata?.furnitureId
);
```

### 4. 메모리 사용량이 계속 증가함

**증상:**
- 오랜 시간 사용 후 브라우저가 느려짐
- 메모리 사용량이 계속 증가

**원인:**
- Blob URL이 해제되지 않음
- Three.js 객체가 dispose되지 않음

**해결방법:**

```typescript
// 1. BlobManager가 자동으로 정리하도록 설정
blobManager.cleanupExpiredUrls();  // 이미 자동 실행 중

// 2. 컴포넌트 언마운트 시 정리
useEffect(() => {
  return () => {
    if (blobUrl) {
      blobManager.revokeUrl(blobUrl);
    }
  };
}, [blobUrl]);

// 3. Three.js 객체 정리
useEffect(() => {
  return () => {
    if (modelRef.current) {
      modelRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
    }
  };
}, []);
```

### 5. 콘솔에 "Failed to recover blob" 에러

**증상:**
```
[blobRecovery] ❌ All recovery attempts failed
```

**원인:**
- LocalStorage, IndexedDB, API 모두에서 데이터를 찾을 수 없음
- furnitureId가 잘못됨

**해결방법:**

```typescript
// 1. IndexedDB 확인
const customFurniture = await getCustomFurnitureById(itemId);
console.log('Found in IndexedDB:', customFurniture);

// 2. LocalStorage 확인
const stored = localStorage.getItem(`custom-furniture-${itemId}`);
console.log('Found in localStorage:', !!stored);

// 3. Fallback 모델 사용
if (!blobUrl) {
  // Fallback 모델 표시
  return <FallbackModel />;
}
```

### 6. 가구 업로드 후 즉시 사라짐

**증상:**
- 가구를 업로드하고 배치했는데 바로 사라짐
- 콘솔에 "Blob URL revoked too early" 에러

**원인:**
- Blob URL이 너무 빨리 해제됨
- revoke 타이밍 문제

**해결방법:**

```typescript
// Safe Mode 활성화 (.env.local)
NEXT_PUBLIC_BLOB_REVOKE_SAFE_MODE=true

// 또는 개발 환경에서만 지연 해제
import { safeRevokeObjectURL } from '@/utils/blobUtils';

// 사용 후 충분한 지연 시간 부여
safeRevokeObjectURL(url, 300);  // 300ms 지연
```

### 7. 다운로드/Export가 작동하지 않음

**증상:**
- 내보내기 버튼을 클릭해도 다운로드되지 않음
- 콘솔에 에러 없음

**원인:**
- Blob URL이 너무 빨리 해제됨
- 브라우저 다운로드 전에 URL이 무효화됨

**해결방법:**

```typescript
const downloadFile = (blob: Blob, filename: string) => {
  const url = blobManager.createUrl(blob, {
    type: 'export',
    source: 'download'
  });

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // ✅ 다운로드가 완료될 때까지 충분한 시간 부여
  setTimeout(() => {
    blobManager.revokeUrl(url);
  }, 150);
};
```

## 디버깅 도구

### 1. BlobManager 통계 확인

```typescript
// 개발자 콘솔에서 실행
const stats = blobManager.getStats();
console.table({
  'Total URLs': stats.totalUrls,
  'Total Size': stats.totalSize,
  'Total Refs': stats.totalRefs,
  'Avg Refs/URL': stats.avgRefsPerUrl
});
console.log('By Type:', stats.byType);
```

### 2. 특정 아이템의 URL 추적

```typescript
// 특정 아이템의 모든 URL 확인
const itemUrls = blobManager.getUrlsByItemId('furniture-123');
console.log('URLs for item:', itemUrls);

// URL 메타데이터 확인
itemUrls.forEach(url => {
  const metadata = blobManager.getMetadata(url);
  console.log('Metadata:', metadata);
});
```

### 3. 메모리 사용량 모니터링

```typescript
// 주기적으로 메모리 보고
setInterval(() => {
  blobManager.reportMemoryUsage();
}, 10000);  // 10초마다
```

### 4. Blob URL 검증 테스트

```typescript
// URL 유효성 테스트
async function testBlobUrl(url: string) {
  console.log('Testing URL:', url);
  
  const isValid = await blobManager.validateUrl(url);
  console.log('Is valid:', isValid);
  
  if (!isValid) {
    console.log('Attempting recovery...');
    const result = await blobManager.ensureValidUrl(url, itemId);
    console.log('Recovery result:', result);
  }
}
```

### 5. ModelLoader 캐시 확인

```typescript
// ModelLoader 캐시 상태 확인 (개발 모드)
import { clearBlobModelCaches } from '@/utils/modelLoader';

// 캐시 정리
clearBlobModelCaches();
console.log('Model caches cleared');
```

## 성능 문제

### 1. 모델 로딩이 느림

**원인:**
- 너무 큰 모델 파일
- 캐시 미사용
- 네트워크 병목

**해결방법:**

```typescript
// 1. 캐시 활성화
const model = await loadModel(url, {
  useCache: true,  // ✅ 캐시 사용
  priority: 'high',
  onProgress: (progress) => {
    console.log('Loading:', Math.round(progress * 100) + '%');
  }
});

// 2. 모델 최적화
// - Blender에서 decimation 적용
// - 텍스처 크기 줄이기
// - GLTF draco 압축 사용

// 3. 우선순위 설정
const urgentModel = await loadModel(urgentUrl, {
  priority: 'high'
});
const backgroundModel = await loadModel(backgroundUrl, {
  priority: 'low'
});
```

### 2. 많은 가구 배치 시 성능 저하

**원인:**
- 모든 모델이 항상 렌더링됨
- Frustum culling 미작동

**해결방법:**

```typescript
// 1. LOD (Level of Detail) 사용
import { Lod } from '@react-three/drei';

// 2. Frustum culling 확인
// Three.js가 자동으로 처리

// 3. 불필요한 리렌더링 방지
const MemoizedFurniture = React.memo(DraggableFurniture);
```

## 에러 메시지 가이드

| 에러 메시지 | 원인 | 해결방법 |
|------------|------|---------|
| `Blob URL is not accessible` | Blob URL이 무효화됨 | `ensureValidUrl` 사용 |
| `Failed to recover blob` | 복구 소스를 찾을 수 없음 | IndexedDB 확인, itemId 확인 |
| `Blob URL revoked too early` | URL이 사용 전에 해제됨 | revoke 지연 시간 증가 |
| `Cannot find name 'blob'` | Blob 객체가 undefined | Null 체크 추가 |
| `Failed to create object URL` | Blob 생성 실패 | File 객체 유효성 확인 |
| `Memory leak detected` | URL이 해제되지 않음 | Cleanup 로직 확인 |

## 개발 환경 설정

### .env.local 설정

```bash
# Blob URL Safe Mode (개발 환경 권장)
NEXT_PUBLIC_BLOB_REVOKE_SAFE_MODE=true

# Placeholder 모델 사용 (빠른 테스트)
NEXT_PUBLIC_PLACEHOLDER_MODELS=true

# 디버그 모드
NODE_ENV=development
```

### Chrome DevTools 활용

1. **Application 탭**
   - IndexedDB → bumbum_custom_library 확인
   - Local Storage → blob URL 관련 데이터 확인

2. **Memory 탭**
   - Heap snapshot으로 메모리 누수 확인
   - Blob 객체 추적

3. **Performance 탭**
   - 렌더링 병목 확인
   - Blob URL 생성/해제 타이밍 분석

## 추가 리소스

- [Blob URL 관리 가이드](./Blob-URL-Management-Guide.md)
- [API 문서](./API-BlobManager.md)
- [마이그레이션 가이드](./Blob-URL-Migration-Guide.md)

## 지원

문제가 해결되지 않으면:
1. GitHub Issues에 버그 리포트 제출
2. 재현 가능한 최소 예제 제공
3. 콘솔 로그 및 스크린샷 첨부


