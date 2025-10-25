# 🧱 미니룸 방 크기 커스터마이징 기능 개발 지침서

## 🎯 목표

사용자가 **방의 가로·세로 길이(바닥 면적)** 와 **벽의 높이** 를 자유롭게 조절할 수 있는 UI를 미니룸 내에 추가한다.

* **가로/세로 최소값:** 3m
* **가로/세로 최대값:** 15m
* **높이 최소값:** 3m
* **높이 최대값:** 15m

이 작업은 두 명의 AI 에이전트가 **동시에 협업**할 수 있도록 병렬 분업 구조로 설계한다.

---

## 🧩 전체 구조 개요

* **UI Layer** : 사용자가 크기를 입력하거나 슬라이더로 조정할 수 있는 컨트롤러. (React 기반)
* **3D Logic Layer** : 입력값을 반영해 Three.js 상의 방 모델(바닥 Plane, 벽 Mesh)을 실시간으로 업데이트.
* **State Layer** : 크기 정보(가로, 세로, 높이)를 전역 저장소(Zustand)로 관리.

---

## 🤖 에이전트 역할 분담

### 🟢 Agent A – 3D 구조 및 상태 관리 담당

#### 주요 목표

* 실제 방 모델(Three.js Mesh)의 크기 변경 로직 구현.
* 상태 변화가 렌더링에 즉시 반영되도록 구조 정비.

#### 세부 작업

1. **상태 관리 (Zustand 확장)**

   * `roomDimensions` 상태를 생성: `{ width: number, depth: number, height: number }`
   * 기본값: `{ width: 6, depth: 6, height: 3 }`
   * setter 함수 `setRoomDimensions()` 구현 및 validation 포함.
   * validation 로직: 3~15 사이 값만 허용.

2. **3D Scene 반영 (Room3DContainer / Real3DRoom 수정)**

   * 바닥 Plane, 벽 Mesh의 scale 또는 geometry size를 `roomDimensions` 상태로부터 실시간 반영.
   * 벽 높이 변경 시 조명, 그림자 cast 거리 재계산.
   * 크기 변경 시 카메라 클리핑 플레인, 이동 범위 등의 보정 로직도 포함.

3. **성능 최적화**

   * React re-render 최소화: Zustand의 `shallow` selector 적용.
   * geometry dispose/recreate 주기 제어 → GC 부담 최소화.

---

### 🟣 Agent B – UI 및 인터랙션 담당

#### 주요 목표

* 사용자가 크기를 직접 조절할 수 있는 인터페이스 구현.
* 실시간 피드백을 제공하고, 입력값의 안정성을 보장.

#### 세부 작업

1. **UI 컴포넌트 추가 (RoomSizeControlPanel.tsx)**

   * 입력 방식: 숫자 입력 필드 + 슬라이더 동시 제공.
   * 필드: `가로 (width)`, `세로 (depth)`, `높이 (height)`
   * 범위 제한: `min=3`, `max=15`, `step=0.1`
   * 현재 크기 표시 (m 단위), 실시간 반영.

2. **UI 배치 위치**

   * **편집 모드 진입 시만 표시**
   * 기존 편집 모드 상단 UI의 **우측 ‘템플릿’ 버튼 오른쪽** 에 배치.
   * 버튼 형태로 “방 크기 조절” 이라는 레이블을 표시하고, 클릭 시 패널이 토글되도록 구성.

3. **이벤트 처리 및 전역 상태 연동**

   * 입력 이벤트 발생 시 `setRoomDimensions()` 호출.
   * 유효하지 않은 입력(범위 초과 등) 시 경고 메시지 또는 시각적 피드백.

4. **UI 디자인 가이드**

   * 우측 하단 플로팅 형태의 카드 (Tailwind + shadcn/ui 활용)
   * 예시:

     ```jsx
     <Card className="absolute bottom-4 right-4 w-64 p-4 bg-white/80 shadow-xl">
       <h3>방 크기 조절</h3>
       <Slider label="가로 (m)" min={3} max={15} step={0.1} />
       <Slider label="세로 (m)" min={3} max={15} step={0.1} />
       <Slider label="높이 (m)" min={3} max={15} step={0.1} />
     </Card>
     ```

5. **동시성 고려**

   * Agent A의 상태 로직이 완성되면, UI는 그 상태를 구독하여 즉시 반영.
   * `useEffect` 훅으로 변경 감지 및 Scene 갱신 이벤트 트리거.

---

## 🔄 협업 및 통합 규칙

* Agent A는 Zustand 상태와 3D 반영 로직 완성 후, `roomDimensions`의 인터페이스(JSON 형태) 정의서를 공유한다.
* Agent B는 그 정의서를 기반으로 UI를 구현하며, 상태 변경 테스트를 병행 진행한다.
* 두 에이전트는 동일한 브랜치 내에서 **병렬 작업 가능**, 단 `Room3DContainer`와 `RoomSizeControlPanel` 간 **props 충돌 방지**를 위해 명시적 prop 이름(`dimensions`, `onDimensionsChange`) 사용.

---

## 🧠 테스트 플랜

1. **UI 테스트**: 슬라이더/입력 변경 시 실시간 반영 확인.
2. **경계 테스트**: 2.9m / 15.1m 입력 시 제한 정상 작동 여부.
3. **성능 테스트**: 지속적인 조절 시 프레임 드랍 여부.
4. **3D 시각 검증**: 벽/바닥 비율이 깨지지 않는지, 카메라 충돌 없는지 확인.
5. **리팩터링 후 lint/typecheck**: `pnpm lint`, `pnpm typecheck` 통과 확인.

---

## 🕒 예상 소요 시간

| 구분            | 담당      | 시간      |
| ------------- | ------- | ------- |
| 상태 로직 & 3D 반영 | Agent A | 3h      |
| UI 및 인터랙션     | Agent B | 3h      |
| 통합 테스트 & 조정   | 공동      | 1h      |
| **총합**        |         | **7시간** |

---

## ✅ 결과 기대치

* 사용자는 미니룸 내에서 **직관적인 UI를 통해 방 크기를 조절**할 수 있다.
* 3D 공간이 실시간으로 재렌더링되어 즉각적인 시각 피드백을 제공한다.
* UI와 3D 로직이 독립적이면서도 상호 반응하도록 설계되어 병렬 개발이 가능하다.
