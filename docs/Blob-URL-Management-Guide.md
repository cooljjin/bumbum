# Blob URL 관리 가이드

## 개요

Bumbum 프로젝트는 중앙 집중식 Blob URL 관리 시스템을 사용하여 모든 Blob URL의 생명주기를 관리합니다. 이 시스템은 URL 생성, 검증, 복구, 해제를 자동으로 처리하며, 메모리 누수를 방지합니다.

## 핵심 컴포넌트

### 1. BlobManager

모든 Blob URL을 중앙에서 관리하는 싱글톤 클래스입니다.

```typescript
import { blobManager } from '@/utils/blobManager';

// Blob URL 생성
const url = blobManager.createUrl(blob, {
  type: 'model',  // 'model' | 'texture' | 'thumbnail' | 'export' | 'other'
  itemId: 'furniture-123',
  source: 'custom-furniture',  // 'custom-furniture' | 'built-in' | 'upload' | 'download' | 'async'
  maxAge: 30 * 60 * 1000  // 30분 (옵션)
});

// Blob URL 검증
const isValid = await blobManager.validateUrl(url);

// Blob URL 복구
const recoveredUrl = await blobManager.recoverUrl(itemId, oldUrl);

// Blob URL 확인 및 자동 복구
const result = await blobManager.ensureValidUrl(url, itemId);
if (result.url) {
  console.log('URL:', result.url);
  console.log('복구 여부:', result.recovered);
}

// Blob URL 해제
blobManager.revokeUrl(url);

// 강제 해제 (참조 카운트 무시)
blobManager.revokeUrl(url, true);
```

### 2. useManagedBlob Hook

React 컴포넌트에서 Blob URL을 쉽게 관리할 수 있는 훅입니다.

```typescript
import { useManagedBlob } from '@/hooks/useManagedBlob';

function MyComponent({ file, itemId }: Props) {
  const {
    blobUrl,
    isLoading,
    error,
    isRecovered,
    refresh,
    revoke
  } = useManagedBlob(file, {
    type: 'model',
    itemId,
    autoRecover: true,
    onError: (error) => console.error('Blob error:', error),
    onReady: (url) => console.log('URL ready:', url),
    onRecovered: (url) => console.log('URL recovered:', url)
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refresh} />;
  if (!blobUrl) return null;

  return <Model url={blobUrl} />;
}
```

### 3. useManagedBlobBatch Hook

여러 Blob을 한 번에 관리합니다.

```typescript
import { useManagedBlobBatch } from '@/hooks/useManagedBlob';

function ThumbnailGrid({ files }: Props) {
  const urls = useManagedBlobBatch(files, {
    type: 'thumbnail',
    source: 'upload'
  });

  return (
    <div className="grid">
      {urls.map((url, idx) => (
        url && <img key={idx} src={url} alt={`Image ${idx}`} />
      ))}
    </div>
  );
}
```

## 주요 기능

### 1. 자동 URL 검증

BlobManager는 주기적으로 URL의 유효성을 검증합니다.

```typescript
// 자동으로 유효성 검증 및 복구
const result = await blobManager.ensureValidUrl(currentUrl, itemId);
```

### 2. 3단계 Fallback 복구

Blob URL이 무효화되면 다음 순서로 복구를 시도합니다:

1. **LocalStorage**: `custom-furniture-{itemId}` 키에서 base64 데이터 복구
2. **IndexedDB**: `bumbum_custom_library` DB에서 파일 복구
3. **API**: `/api/furniture/{itemId}` 엔드포인트에서 다운로드

```typescript
// blobRecovery.ts에서 자동으로 처리
const blob = await regenerateBlobFromSource(itemId);
```

### 3. 메모리 관리

- **참조 카운트**: 동일한 URL을 여러 곳에서 사용할 때 자동으로 관리
- **자동 정리**: 5분마다 만료된 URL 자동 제거
- **수동 정리**: 필요 시 수동으로 정리 가능

```typescript
// 메모리 사용량 보고
blobManager.reportMemoryUsage();

// 만료된 URL 정리
blobManager.cleanupExpiredUrls();

// 모든 URL 정리
blobManager.revokeAll();
```

### 4. ModelLoader 캐시 통합

BlobManager는 Three.js modelLoader 캐시와 통합되어 무효화된 URL의 캐시를 자동으로 정리합니다.

```typescript
// modelLoader.ts에서 자동으로 처리
if (url.startsWith('blob:')) {
  const isValid = await blobManager.validateUrl(url);
  if (!isValid) {
    // 캐시 자동 정리
    modelCache.delete(url);
  }
}
```

## 에러 처리

### BlobError 타입

```typescript
enum BlobErrorType {
  REVOKED = 'revoked',              // URL이 해제됨
  INVALID = 'invalid',              // 무효한 URL
  RECOVERY_FAILED = 'recovery_failed',  // 복구 실패
  STORAGE_ERROR = 'storage_error',  // 저장소 에러
  CREATION_ERROR = 'creation_error' // 생성 에러
}

class BlobError extends Error {
  type: BlobErrorType;
  url?: string;
  itemId?: string;
}
```

### 에러 처리 예시

```typescript
try {
  const url = blobManager.createUrl(blob, metadata);
} catch (error) {
  if (error instanceof BlobError) {
    switch (error.type) {
      case BlobErrorType.REVOKED:
        // URL이 해제됨 - 복구 시도
        const recovered = await blobManager.recoverUrl(itemId);
        break;
      case BlobErrorType.INVALID:
        // 무효한 URL - 검증 후 재생성
        break;
      case BlobErrorType.RECOVERY_FAILED:
        // 복구 실패 - Fallback 모델 사용
        break;
      case BlobErrorType.CREATION_ERROR:
        // 생성 에러 - 사용자에게 알림
        break;
    }
  }
}
```

## 베스트 프랙티스

### 1. 항상 BlobManager 사용

❌ **나쁜 예시:**
```typescript
const url = URL.createObjectURL(blob);
// ... 나중에 URL을 해제하는 것을 잊음
```

✅ **좋은 예시:**
```typescript
const url = blobManager.createUrl(blob, {
  type: 'model',
  itemId: 'furniture-123'
});
// 자동으로 관리되고 정리됨
```

### 2. itemId 제공

복구 기능을 사용하려면 항상 `itemId`를 제공하세요.

```typescript
const url = blobManager.createUrl(blob, {
  type: 'model',
  itemId: item.id,  // ✅ 복구 가능
  source: 'custom-furniture'
});
```

### 3. React에서는 useManagedBlob 사용

직접 BlobManager를 사용하는 대신 `useManagedBlob` 훅을 사용하세요.

```typescript
// ✅ 좋은 예시
const { blobUrl } = useManagedBlob(file, {
  type: 'model',
  itemId,
  autoRecover: true
});
```

### 4. 다운로드/Export 시

일회성 URL은 사용 후 즉시 해제하세요.

```typescript
const url = blobManager.createUrl(blob, {
  type: 'export',
  source: 'download'
});

// 다운로드 후 해제
setTimeout(() => blobManager.revokeUrl(url), 150);
```

### 5. 개발 모드에서 디버깅

```typescript
// 통계 확인
const stats = blobManager.getStats();
console.log('Total URLs:', stats.totalUrls);
console.log('Total size:', stats.totalSize);
console.log('By type:', stats.byType);

// 특정 타입의 URL 목록
const modelUrls = blobManager.getUrlsByType('model');
const itemUrls = blobManager.getUrlsByItemId('furniture-123');
```

## 성능 최적화

### 1. 참조 카운트 활용

동일한 Blob URL을 여러 컴포넌트에서 사용할 때:

```typescript
// 첫 번째 컴포넌트
const url = blobManager.createUrl(blob, metadata);  // refCount = 1

// 두 번째 컴포넌트 (동일한 URL 사용)
blobManager.incrementRefCount(url);  // refCount = 2

// URL은 모든 참조가 해제될 때까지 유지됨
```

### 2. 캐시 설정

```typescript
// 캐스텀 maxAge 설정
const url = blobManager.createUrl(blob, {
  type: 'model',
  itemId: 'furniture-123',
  maxAge: 60 * 60 * 1000  // 1시간
});
```

### 3. 배치 정리

```typescript
// 주기적으로 만료된 URL 정리
setInterval(() => {
  blobManager.cleanupExpiredUrls();
}, 5 * 60 * 1000);  // 5분마다
```

## 문제 해결

### HMR 후 Blob URL이 사라짐

**원인**: HMR 시 Blob URL이 해제됨

**해결**: `autoRecover` 옵션 사용

```typescript
const { blobUrl } = useManagedBlob(file, {
  autoRecover: true,  // ✅ 자동 복구 활성화
  itemId
});
```

### 새로고침 후 Blob URL이 무효화됨

**원인**: Blob URL은 브라우저 세션에만 존재

**해결**: BlobManager가 자동으로 복구

```typescript
// ensureValidUrl이 자동으로 복구
const result = await blobManager.ensureValidUrl(savedUrl, itemId);
```

### 메모리 누수

**원인**: Blob URL이 해제되지 않음

**해결**: BlobManager 사용 및 자동 정리 활성화

```typescript
// BlobManager가 자동으로 관리
// 5분마다 만료된 URL 자동 정리
blobManager.cleanupExpiredUrls();
```

### 캐시가 너무 커짐

**원인**: 오래된 모델이 캐시에 남아있음

**해결**: 수동으로 캐시 정리

```typescript
import { clearBlobModelCaches } from '@/utils/modelLoader';

// Blob URL 모델 캐시 모두 정리
clearBlobModelCaches();
```

## 추가 리소스

- [BlobManager API 문서](./API-BlobManager.md)
- [useManagedBlob API 문서](./API-useManagedBlob.md)
- [문제 해결 가이드](./Blob-URL-Troubleshooting.md)
- [마이그레이션 가이드](./Blob-URL-Migration-Guide.md)

## 기여

Blob URL 관리 시스템에 대한 개선 사항이나 버그 리포트는 GitHub Issues를 통해 제출해주세요.

## 라이선스

MIT License


