# 3D 아바타 개선 통합 문서

## 개요
- 대상: src/components/3D/Room3DContainer.tsx, src/components/features/room/SimpleAvatar.tsx 등 3D 아바타 관련 코드 전반
- 목표: 3D 아바타 이동·애니메이션 로직 안정화 및 유지보수 편의성 향상
- 권장 순서: 5번 ▶ 4번 ▶ 1번 ▶ 2번 ▶ 3번

## 작업 체크리스트

### 5. ClickToMoveAvatar 정리
- [ ] 사용 여부 확인 후 ClickToMoveAvatar 제거 또는 최신 로직을 공유 훅/유틸로 이관
- [ ] 전역 이벤트 리스너 정리, 문서화 추가 시 README 반영 고려
- 참고 파일: src/components/features/room/ClickToMoveAvatar.tsx
- 검증: 빌드/타입 통과 및 기존 아바타 이동 기능 정상 동작

### 4. GLTF 클론 방식 개선
- [ ] scene.clone(true) → SkeletonUtils.clone(scene)로 교체
- [ ] 	hree/examples/jsm/utils/SkeletonUtils 임포트 추가 및 빌드 설정 확인
- [ ] 리소스 정리(useEffect cleanup) 유지 확인
- 참고 파일: src/components/features/room/SimpleAvatar.tsx
- 검증: 런타임에서 본/스켈레톤 경고 미발생, 애니메이션 정상 재생

### 1. onPointerMissed 좌표 계산 보정
- [ ] window.innerWidth/Height 대신 캔버스 getBoundingClientRect() 사용
- [ ] 스크롤/패딩 상황에서도 정확한 NDC 변환 수행
- 참고 파일: src/components/3D/Room3DContainer.tsx
- 검증: 다양한 레이아웃에서 클릭 지점과 이동 지점 일치 여부 수동 테스트

### 2. 유효하지 않은 타겟 처리 개선
- [ ] 바닥 교차 실패 시 setAvatarTargetPosition 호출 생략
- [ ] 카메라 미존재/레이캐스트 실패 시 조용히 종료
- 참고 파일: src/components/3D/Room3DContainer.tsx
- 검증: UI 영역 클릭 시 아바타가 (0,0,0)으로 복귀하지 않는지 확인

### 3. 이동 좌표 룸 경계 내로 제한
- [ ] getRoomBoundaries 또는 constrainFurnitureToRoom 활용해 좌표 클램프
- [ ] 룸 크기 변경 시 재사용 가능한 헬퍼 구성 여부 점검
- 참고 파일: src/components/3D/Room3DContainer.tsx, src/utils/roomBoundary.ts
- 검증: 룸 외부 클릭 시 아바타가 벽 밖으로 나가지 않는지 확인

## 검증 & 배포
- [ ] 타입 검사: pnpm lint / pnpm typecheck
- [ ] 기능 테스트: 주요 시나리오 수동 점검 (아바타 이동, 가구 선택/해제, 캔버스 클릭)
- [ ] 변경 사항 요약 및 PR/커밋 메시지 준비

## 메모
- 필요 시 임시 로그를 debug 플래그로 감싼 뒤 최종 단계에서 제거
- 5번 작업에서 로직을 분리했다면 후속 단계에서도 동일 유틸을 사용하도록 정리
