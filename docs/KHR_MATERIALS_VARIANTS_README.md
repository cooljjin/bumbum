# KHR_materials_variants 기반 색상/소재 설계 가이드 (bumbum)

본 문서는 가구 색상/소재 변경을 KHR_materials_variants(이하 "variants") 확장을 중심으로 설계·구현하기 위한 팀 표준입니다. 다른 AI/도구가 합류해도 맥락을 유지하도록 자산 파이프라인, 런타임 연동, 저장 스키마까지 한 번에 정의합니다.

## 목표
- 모델 품질(PBR)과 일관된 룩앤필 유지
- 코드 복잡도/버그 포인트 최소화(데이터 중심 전환)
- 앱/웹 용량 증가 억제(압축·공유 전략)
- 편집 상태의 저장/복원(공유 링크·앱 재실행)

## 핵심 아이디어
- 색상/소재는 "재질 프리셋"으로 관리하고, GLTF 안에 variants 로 선언
- 런타임은 지오메트리가 아닌 "재질 매핑"만 교체(빠르고 안정적)
- 텍스처는 가능하면 공용으로 재사용하고, 색 차이는 파라미터/마스크로 표현

## 아키텍처 개요
1) 자산(에셋) 파이프라인
   - DCC(Blender 등)에서 파트별 재질을 정의하고, variants로 색/소재 프리셋을 등록
   - 텍스처는 KTX2 압축, 지오메트리는 Draco/meshopt 압축
   - 검증: gltf-validator로 확장/압축/참조 이상 여부 체크

2) 앱/웹 런타임
   - `GLTFLoader`로 모델 로드(three.js의 variants 지원 사용)
   - 카탈로그에서 선택된 `variantName`을 적용
   - 선택 상태는 에디터 스토어에 저장하여 복원 가능

3) 상태 저장
   - `placedItem`에 `materialVariant` 필드를 추가하여 현재 선택된 변형을 기록

## 용량 전략(필수)
- 텍스처 공용화: 노멀/러프니스/메탈 등은 동일 텍스처 재사용, `baseColorFactor` 또는 마스크 틴트로 색만 변경
- 압축: `KHR_texture_basisu(KTX2)` + Draco/meshopt + `KHR_mesh_quantization`
- 지연 로딩: 모델은 번들이 아닌 CDN에서 필요 시 로드(웹/PWA/네이티브 공통 캐시)

## 카탈로그 스키마 확장 예시
`src/data/furnitureCatalog.ts` 항목에 variants 메타를 추가합니다.

```ts
// 예시: 카탈로그 아이템 (추가 필드만 발췌)
interface FurnitureItem {
  id: string;
  name: string;
  modelPath: string; // GLB (variants 포함)
  variants?: Array<{
    name: string;          // GLTF 내부 variantName (예: "oak", "walnut", "black")
    labelKo: string;       // UI 표기용
    default?: boolean;     // 기본 선택 여부
  }>;
}
```

## 런타임 적용(three.js) 개략
three.js의 GLTFLoader는 `KHR_materials_variants`를 지원합니다. 로딩 후 각 Mesh에 선언된 variant를 조회하고, 원하는 이름으로 선택합니다.

```ts
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

async function loadWithVariants(url: string) {
  const loader = new GLTFLoader();
  // KTX2/Draco 등 압축 로더는 기존 파이프라인과 동일하게 설정
  const gltf = await loader.loadAsync(url);

  // 1) 사용 가능한 variant 수집(메시 userData 또는 파서에서 제공)
  const available = new Set<string>();
  gltf.scene.traverse((obj: any) => {
    if (obj?.userData?.variants && Array.isArray(obj.userData.variants)) {
      obj.userData.variants.forEach((v: string) => available.add(v));
    }
  });

  // 2) 적용 유틸리티(로더 플러그인/파서 API 사용)
  const applyVariant = (variantName: string) => {
    gltf.scene.traverse((obj: any) => {
      const list: string[] = obj?.userData?.variants || [];
      if (list.includes(variantName) && obj?.userData?.variantMaterials?.[variantName]) {
        // 런타임 교체: 파서/플러그인의 selectVariant 유틸을 사용하거나,
        // 사전 주입된 userData.variantMaterials[variantName]으로 material을 교체하는 방식을 선택
        obj.material = obj.userData.variantMaterials[variantName];
        obj.material.needsUpdate = true;
      }
    });
  };

  return { gltf, available: Array.from(available), applyVariant };
}

// 사용 예시
// const { gltf, available, applyVariant } = await loadWithVariants('/models/sofa.glb');
// applyVariant('walnut');
```

참고: 실제 구현에서는 GLTFLoader의 variants 플러그인 메서드(selectVariant 등)를 직접 호출하는 유틸을 추가합니다. 위 코드는 프로젝트 컨텍스트에 맞춘 개략입니다.

## 에디터/스토어 연동
- `EditorStore.PlacedItem` 확장: `materialVariant?: string`
- 배치 시: 카탈로그의 `variants.find(v => v.default)?.name`를 저장
- 변경 시: 선택 아이템의 `materialVariant`를 갱신하고 런타임 유틸로 적용
- 저장/불러오기: 레이아웃 저장 시 `materialVariant` 포함

## 마이그레이션 단계별 작업
1) 파일 준비
   - 대표 SKU 1~2개(GLB)에 variants 삽입(색 3종)
   - 텍스처 KTX2, 지오메트리 Draco로 재패킹
2) 런타임 유틸
   - `utils/modelLoader.ts` 또는 신규 `utils/materialVariants.ts`에 `applyVariant(model, name)` 유틸 추가
   - 로더에서 모델 로드시 variants 목록을 수집해 `model.userData`에 저장
3) 카탈로그/스토어
   - `furnitureCatalog.ts`에 variants 메타 추가
   - `editorStore`의 `PlacedItem`에 `materialVariant` 필드 추가 및 액션(`setMaterialVariant`)
4) UI
   - EditToolbar/가구 패널에 variants 드롭다운/칩 UI 배치 → 선택 시 스토어 갱신 + 유틸 호출
5) 테스트
   - 로드/교체/저장/복원, 성능(프레임/메모리), 스냅샷 회귀

## 품질 가이드
- 패브릭/플라스틱은 공용 노멀/러프/메탈맵 재사용 + baseColorFactor 차이로 variants 구성
- 우드/메탈은 필요 시 별도 알베도 사용(가능하면 KTX2). 질감 차이가 큰 경우에만 텍스처 분기
- 공유 재질 주의: 재질 공유 시 인스턴스별 머티리얼 clone 후 적용(전역 전파 방지)

## 폴백 전략(확장 미탑재/레거시 모델)
- 모델에 variants가 없을 경우: 기존 색상 변경 엔진(틴트/마스크)로 폴백
- UI는 variants 섹션을 비활성화하고 "기본 색상"만 노출

## 체크리스트
- [ ] GLB 내부에 `KHR_materials_variants`가 존재하는가
- [ ] 기본 variant가 명확히 지정되는가
- [ ] 텍스처는 KTX2로 압축되었는가
- [ ] 공용 맵이 재사용되고 중복이 없는가
- [ ] 런타임에서 variant 목록/선택이 정상 동작하는가
- [ ] 레이아웃 저장/복원 시 `materialVariant`가 유지되는가

## 파일 위치 제안
- 문서: `docs/KHR_MATERIALS_VARIANTS_README.md`(본 문서)
- 유틸: `src/utils/materialVariants.ts`(신규 예정)
- 카탈로그: `src/data/furnitureCatalog.ts`(variants 메타 확장)
- 스토어: `src/store/editorStore.ts`(PlacedItem 확장)

---
문의/수정 제안은 PR에 댓글로 남겨주세요. 본 문서는 에셋/엔진/에디터 3팀 공동 기준입니다.

