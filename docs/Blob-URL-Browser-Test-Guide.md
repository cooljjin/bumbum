# Blob URL 관리 시스템 브라우저 테스트 가이드

## 🧪 테스트 준비

### 1. 개발 서버 실행

```bash
npm run dev
```

서버가 실행되면 http://localhost:3000 을 브라우저에서 엽니다.

### 2. Chrome DevTools 열기

`F12` 또는 `Ctrl + Shift + I`를 눌러 개발자 도구를 엽니다.

## ✅ 테스트 시나리오

### 시나리오 1: BlobManager 초기화 확인

**Console에서 실행:**

```javascript
// BlobManager 인스턴스 확인 (전역에서 접근 가능해야 함)
const testBlob = new Blob(['test'], { type: 'text/plain' });

// 개발자 도구에서 window 객체를 통해 접근
console.log('🔍 Testing BlobManager...');
```

**예상 결과:**
- 콘솔에 `[BlobManager] 🚀 Initialized` 로그가 표시되어야 함

---

### 시나리오 2: 커스텀 가구 업로드 및 Blob URL 생성 테스트

**단계:**

1. 페이지 로드 후 콘솔 확인
2. "편집 모드" 버튼 클릭
3. "가구 카탈로그" 열기
4. "커스텀 가구" 섹션으로 이동
5. GLB 파일 업로드

**Console에서 확인:**

```javascript
// 업로드 후 BlobManager 통계 확인
console.log('📊 BlobManager Stats:', window.blobManagerStats);
```

**예상 콘솔 로그:**

```
[BlobManager] ✅ Created blob URL: {
  url: 'blob:http://localhost:3000/xxxxx-xxxx',
  type: 'model',
  itemId: 'custom-xxx',
  size: '2.5 MB'
}
```

---

### 시나리오 3: Blob URL 검증 테스트

**Console에서 실행:**

```javascript
// 페이지에 있는 모든 Blob URL 찾기
const blobUrls = Array.from(document.querySelectorAll('[src^="blob:"]'))
  .map(el => el.src);

console.log('🔍 Found blob URLs:', blobUrls.length);

// 각 URL 검증 (BlobManager 메서드를 직접 호출할 수는 없지만, 네트워크에서 확인 가능)
blobUrls.forEach(async (url, idx) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log(`✅ URL ${idx + 1}: Valid (${response.status})`);
  } catch (error) {
    console.error(`❌ URL ${idx + 1}: Invalid`, error);
  }
});
```

**예상 결과:**
- 모든 Blob URL이 200 OK 응답을 반환해야 함

---

### 시나리오 4: HMR 후 자동 복구 테스트

**단계:**

1. 커스텀 가구를 3D 룸에 배치
2. 코드 수정 (예: `src/app/page.tsx`에 주석 추가)
3. 자동 새로고침 대기
4. 콘솔 확인

**예상 콘솔 로그:**

```
[DraggableFurniture] 🔍 Validating blob URL: blob:http://localhost:3000/xxxxx
[DraggableFurniture] ⚠️ Blob URL invalid, attempting recovery...
[blobRecovery] 🔄 Starting blob recovery for: custom-xxx
[blobRecovery] 🔍 Recovering from IndexedDB: custom-xxx
[blobRecovery] ✅ Recovered from IndexedDB, size: 2500000
[BlobManager] ✅ Created blob URL: { ... }
[DraggableFurniture] ✅ Blob URL recovered: blob:http://localhost:3000/yyyyy
```

---

### 시나리오 5: 페이지 새로고침 후 복구 테스트

**단계:**

1. 커스텀 가구를 배치
2. `F5` 또는 `Ctrl + R`로 페이지 새로고침
3. 콘솔 확인

**예상 콘솔 로그:**

```
[Canvas3D] 🔍 Validating blob URL: blob:http://localhost:3000/xxxxx
[Canvas3D] ⚠️ Blob URL is invalid: blob:http://localhost:3000/xxxxx
[blobRecovery] 🔄 Starting blob recovery for: custom-xxx
[blobRecovery] ✅ Recovered from IndexedDB
[BlobManager] ✅ Created blob URL
```

---

### 시나리오 6: 메모리 관리 테스트

**Console에서 실행:**

```javascript
// 5분 동안 메모리 사용량 추적
setInterval(() => {
  if (performance.memory) {
    console.log('💾 Memory:', {
      used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
      total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
      limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
    });
  }
}, 60000); // 1분마다
```

**예상 결과:**
- 메모리 사용량이 안정적으로 유지되어야 함
- 5분 후 자동 정리 로그가 표시되어야 함:
  ```
  [BlobManager] 🧹 Cleaned up expired URLs: X
  [BlobManager] 📊 Memory usage: { urls: Y, totalSize: 'Z MB' }
  ```

---

### 시나리오 7: Export/Download 테스트

**단계:**

1. "설정" 버튼 클릭
2. "디자인 내보내기" 선택
3. JSON 파일 다운로드
4. 콘솔 확인

**예상 콘솔 로그:**

```
[BlobManager] ✅ Created blob URL: {
  url: 'blob:http://localhost:3000/xxxxx',
  type: 'export',
  source: 'download',
  size: 'X KB'
}
[BlobManager] 🗑️ Revoked blob URL and cleared model cache: { ... }
```

---

## 🔍 추가 검증 도구

### 1. Application 탭 확인

**IndexedDB:**
- `bumbum_custom_library` DB가 존재해야 함
- `items` 스토어에 커스텀 가구 데이터가 있어야 함
- `blobs` 스토어에 파일 데이터가 있어야 함

**Local Storage:**
- `custom-furniture-{itemId}` 키에 base64 데이터가 있어야 함 (있는 경우)

### 2. Network 탭 확인

**Blob URL 요청:**
- Blob URL 요청이 200 OK로 성공해야 함
- 404나 에러가 없어야 함

### 3. Memory 탭 확인

**Heap Snapshot:**
1. "Take snapshot" 클릭
2. "Blob" 검색
3. Blob 객체 수와 크기 확인

**예상 결과:**
- Blob 객체가 적절한 수준으로 유지되어야 함
- 사용하지 않는 Blob은 정리되어야 함

---

## ✅ 성공 기준

모든 시나리오에서 다음을 확인:

1. ✅ BlobManager가 정상 초기화됨
2. ✅ Blob URL이 정상 생성됨
3. ✅ 검증 로직이 작동함
4. ✅ HMR 후 자동 복구됨
5. ✅ 새로고침 후 자동 복구됨
6. ✅ 메모리가 안정적으로 관리됨
7. ✅ Export/Download가 정상 작동함

---

## ❌ 실패 시 조치

### 문제: Blob URL이 복구되지 않음

**확인 사항:**
1. IndexedDB에 데이터가 있는가?
2. itemId가 올바른가?
3. 콘솔에 에러 로그가 있는가?

**해결:**
```javascript
// IndexedDB 수동 확인
const request = indexedDB.open('bumbum_custom_library', 1);
request.onsuccess = (event) => {
  const db = event.target.result;
  const tx = db.transaction(['items'], 'readonly');
  const store = tx.objectStore('items');
  const getAll = store.getAll();
  
  getAll.onsuccess = () => {
    console.log('📦 IndexedDB items:', getAll.result);
  };
};
```

### 문제: 메모리 사용량이 계속 증가함

**확인 사항:**
1. Blob URL이 해제되고 있는가?
2. Three.js 객체가 dispose되고 있는가?

**해결:**
- 컴포넌트 언마운트 시 cleanup 로직 확인
- BlobManager의 자동 정리가 작동하는지 확인

---

## 📸 스크린샷 가이드

테스트 중 다음 시점에 스크린샷을 찍어 기록:

1. **초기 로드** - 페이지가 정상 렌더링됨
2. **가구 업로드** - Blob URL 생성 로그
3. **HMR 후** - 복구 로그
4. **새로고침 후** - 복구 로그
5. **5분 후** - 자동 정리 로그

---

## 🎯 최종 체크리스트

- [ ] 개발 서버 정상 실행
- [ ] 페이지 로드 시 에러 없음
- [ ] BlobManager 초기화 확인
- [ ] 커스텀 가구 업로드 성공
- [ ] Blob URL 생성 로그 확인
- [ ] HMR 후 자동 복구 확인
- [ ] 새로고침 후 자동 복구 확인
- [ ] 메모리 안정성 확인
- [ ] Export/Download 정상 작동

---

모든 테스트가 통과하면 **Blob URL 관리 시스템이 완벽하게 작동**하는 것입니다! 🎉


