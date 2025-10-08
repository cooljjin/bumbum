# 🧬 아바타 Idle 애니메이션 재점검 및 개선 지침 (단일 에이전트 버전)

## 1. 목표

`SimpleAvatar.tsx`의 idle 전환 로직을 정상화하고 애니메이션 자산 및 상태 전환을 정비하여,
아바타가 이동 중 / 정지 상태에서 자연스럽게 idle ⇄ walk 를 전환하도록 한다.

---

## 2. 작업 단계

### 🔹 0단계 – 애니메이션 자산 감사

* `Animation_stop.glb` 및 `Meshy_Merged_Animations.glb`의 모든 클립 목록을 출력하여 `idle` 관련 클립 존재 여부를 확인한다.
* 실제 `idle` 클립이 있는 모델(예: `Animation_stop.glb`)을 기준으로 사용 목록을 결정하거나, 필요시 두 자산을 병합한다.
* 클립 이름이 복잡할 경우 idle 클립명을 상수나 설정 파일에서 관리할 수 있도록 한다.
* 2025-10-07 감사 로그:
  * `/models/avartar/Animation_Walking_withSkin.glb` → `Armature|walking_man|baselayer` (walk 전용)
  * `/models/avartar/Animation_stop.glb` → `Axe_Breathe_and_Look_Around`, `Dead`, `Idle_03`, `Idle_11`, `Idle_6`, `Idle_7`, `Idle_9`, `Idle`
  * `/models/avartar/Meshy_Merged_Animations.glb` → `Axe_Breathe_and_Look_Around`, `Dead`, `Idle_03`, `Idle_11`, `Idle_6`, `Idle_7`, `Idle_9`, `Idle`

### 🔹 1단계 – Idle 클립 매핑 로직 강화

* 정규식을 `idle|stand|wait|rest|pose|still|breath|calm` 등으로 확장한다.
* 이름이 매칭되지 않을 경우 클립 길이 / 키워드 조합 등을 기준으로 idle 후보를 선호하는 보조 로직을 추가한다.
* 필요 시 `idleActionOverride` 속성을 추가해 외부에서 명시적으로 idle 클립을 지정할 수 있도록 한다.

### 🔹 2단계 – 이동 상태 판별 검증

* `isMoving` 상태 갱신이 모든 이동 경로에서 정상적으로 호출되는지 검증한다.
* `MIN_MOVE_THRESHOLD`, `MIN_TARGET_DELTA`를 환경별로 조정해 이동 종료 타이밍을 정확하게 잡는다.
* 단일 클립 모드에서도 idle/walk 전환 로직이 정상적으로 작동하는지 시뮬레이션한다.

### 🔹 3단계 – 애니메이션 전환 파라미터 조율

* `FADE_DURATION`(기본 0.25 초)을 idle 전환 속도에 맞게 미세 조정한다.
* Idle 복귀 시 `timeScale`이 1로 정상화되고, walk 전환 시 `WALK_TIME_SCALE`이 유지되는지 검증한다.
* 필요 시 `mixer.stopAllAction()` 또는 `reset()` 호출 타이밍을 조정해 액션 간 충돌을 방지한다.

### 🔹 4단계 – 로그와 모니터링 정리

* `NODE_ENV !== 'production'` 조건으로 로그를 제어하거나, 간단한 로그용 유틸을 도입한다.
* Idle 전환 및 이동 상태 감지에 필요한 최소 로그만 남게 하고 나머지는 디버깅 옵션으로 전환한다.

---

## 3. 구현 시 주의 사항

* 기존 `fadeIn/out`, `LoopRepeat`, `timeScale` 등 이미 구현된 로직을 중복 적용하지 않는다.
* 자산 교체 시 GLB 파일 용량 및 로딩 시간 변화를 점검한다.
* `SkeletonUtils.clone` 사용으로 인해 메모리 증가 여부를 모니터링한다.
* 외부 스토어 또는 Prop으로 애니메이션 상태를 제어할 경우, 내부 상태(`idleActionRef`, `walkActionRef`, `singleClipModeRef`)와의 충돌을 방지한다.

---

## 4. 테스트 계획

1. **기본 진입 테스트** – 초기 진입 시 idle 애니메이션이 자동 재생되는지 확인.
2. **이동 후 idle 복귀** – 이동 종료 후 `isMoving=false` 상태에서 idle 전환이 정상적으로 이루어지는지 확인.
3. **단일 클립 모드 검증** – idle/walk 클립이 하나뿐일 때 전환 로직이 오작동 하지 않는지 검증.
4. **자산 교체 테스트** – 이름이 다른 GLB를 교체해 idle 탐지 로직이 범용적으로 작동하는지 확인.
5. **성능/로그 점검** – `pnpm lint`, `pnpm typecheck` 실행 및 프로더션 빌드에서 로그 노이즈 확인.

---

## 5. 예상 일정 (단일 에이전트 기준)

| 단계     | 작업             | 예상 소요      |
| ------ | -------------- | ---------- |
| 0단계    | 자산 감사 및 클립 확인  | 1.5 시간     |
| 1단계    | idle 매핑 로직 개선  | 1 시간       |
| 2단계    | 이동 상태 검증       | 1 시간       |
| 3단계    | 전환 파라미터 조율     | 0.5 시간     |
| 4단계    | 로그 정리 및 최종 테스트 | 1 시간       |
| **합계** |                | **약 5 시간** |

---

## 6. 마무리 및 문서화

* 모든 수정 사항을 `README` 또는 프로젝트 위키에 기록한다.
* 애니메이션 자산 검증 결과, idle 탐지 로직 변경 사유, 테스트 결과를 요약해 공유한다.
* `pnpm lint` / `pnpm typecheck` 통과 후 PR 검수 및 병합을 진행한다.
