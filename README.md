# 🏠 Bondidi Project - 가구 라이브러리 UI 리팩토링

3D 가구 라이브러리와 룸 에디터를 위한 현대적인 웹 애플리케이션입니다.

## ✨ 주요 기능

- **3D 가구 라이브러리**: GLB/GLTF 모델 지원
- **실시간 룸 에디터**: 드래그 앤 드롭 인터페이스
- **반응형 디자인**: 모바일부터 데스크톱까지 지원
- **성능 최적화**: 이미지 lazy loading, 메모리 관리
- **TypeScript**: 완벽한 타입 안정성

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 18.0.0 이상
- npm 9.0.0 이상

### 설치 및 실행

```bash
# 프로젝트 클론
git clone https://github.com/your-org/bondidi-project.git
cd bondidi-project

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 확인
open http://localhost:3000
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 확인
npm run start
```

## 📚 문서

프로젝트에 대한 자세한 정보는 다음 문서들을 참조하세요:

- **[📖 API 문서](docs/API.md)** - 주요 API와 타입 정의
- **[🧩 컴포넌트 가이드](docs/COMPONENTS.md)** - 컴포넌트 사용법 및 예제
- **[👨‍💻 개발자 온보딩](docs/DEVELOPMENT.md)** - 새로운 개발자를 위한 가이드
- **[🏗️ 아키텍처 문서](docs/ARCHITECTURE.md)** - 프로젝트 구조 및 설계 원칙

## 🏗️ 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx          # 메인 페이지
│   ├── room-editor/      # 룸 에디터 페이지
│   └── globals.css       # 전역 스타일
├── components/            # React 컴포넌트
│   ├── Real3DRoom.tsx    # 3D 룸 렌더링
│   ├── DraggableFurniture.tsx # 가구 인터랙션
│   ├── FurnitureCatalog.tsx   # 가구 카탈로그
│   └── ...               # 기타 컴포넌트
├── store/                 # 상태 관리
│   └── editorStore.ts    # Zustand 스토어
├── hooks/                 # 커스텀 훅
├── utils/                 # 유틸리티 함수
├── types/                 # TypeScript 타입 정의
└── data/                  # 정적 데이터
```

## 🛠️ 기술 스택

- **프론트엔드**: React 18, Next.js 15
- **3D 그래픽스**: Three.js, React Three Fiber
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS
- **언어**: TypeScript
- **테스트**: Jest, React Testing Library

## 🔧 개발 도구

### 코드 품질

```bash
# ESLint 실행
npm run lint

# 자동 수정
npm run lint:fix

# 타입 검사
npm run type-check
```

### 테스트

```bash
# 단위 테스트 실행
npm run test

# 테스트 커버리지
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

## 📱 주요 컴포넌트

### Real3DRoom
3D 씬의 메인 컨테이너로, Three.js 렌더링과 카메라 제어를 담당합니다.

### DraggableFurniture
개별 가구 아이템의 3D 렌더링과 드래그 앤 드롭 인터랙션을 처리합니다.

### FurnitureCatalog
가구 카탈로그를 표시하며, 이미지 lazy loading과 검색 기능을 제공합니다.

### RoomEditor
전체 룸 에디터를 관리하는 메인 컴포넌트입니다.

## 🎯 성능 최적화

- **이미지 Lazy Loading**: Intersection Observer API 활용
- **3D 모델 메모리 관리**: 자동 리소스 정리
- **번들 최적화**: Webpack 설정으로 Tree shaking 및 청크 분할
- **컴포넌트 메모이제이션**: React.memo를 통한 불필요한 리렌더링 방지

## 🔒 보안

- **입력 검증**: TypeScript를 통한 타입 안전성
- **XSS 방지**: 안전한 HTML 렌더링
- **데이터 암호화**: 민감한 정보의 로컬 스토리지 보호

## 🧪 테스트

- **단위 테스트**: 컴포넌트 및 유틸리티 함수
- **통합 테스트**: 사용자 워크플로우
- **E2E 테스트**: 전체 애플리케이션 동작

## 📊 모니터링

- **성능 모니터링**: Core Web Vitals, FPS 추적
- **에러 모니터링**: Error Boundary를 통한 에러 캐치
- **사용자 행동 분석**: 성능 메트릭 수집

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 개발 가이드라인

- [코딩 컨벤션](docs/DEVELOPMENT.md#코딩-컨벤션) 준수
- [테스트 작성](docs/DEVELOPMENT.md#테스트-작성) 필수
- [코드 리뷰](docs/DEVELOPMENT.md#코드-리뷰) 프로세스 준수

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원 및 연락처

- **프로젝트 이슈**: [GitHub Issues](https://github.com/your-org/bondidi-project/issues)
- **기술 지원**: [개발자 가이드](docs/DEVELOPMENT.md#지원-및-연락처)
- **문서 관련**: [문서 저장소](docs/)

## 🙏 감사의 말

- [Three.js](https://threejs.org/) - 3D 그래픽스 라이브러리
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - React Three.js 통합
- [Zustand](https://github.com/pmndrs/zustand) - 상태 관리 라이브러리
- [Tailwind CSS](https://tailwindcss.com/) - 유틸리티 퍼스트 CSS 프레임워크

---

**프로젝트 버전**: 2.1.0  
**마지막 업데이트**: 2024년 12월  
**개발팀**: Bondidi Team
