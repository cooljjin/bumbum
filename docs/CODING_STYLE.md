# 코딩 스타일 가이드

## 개요

이 문서는 Bondidi 3D 룸 에디터 프로젝트의 코딩 스타일과 컨벤션을 정의합니다. 모든 팀원이 일관된 코드 스타일을 유지하여 가독성과 유지보수성을 높이는 것을 목표로 합니다.

## 📋 목차

1. [일반 규칙](#일반-규칙)
2. [TypeScript 규칙](#typescript-규칙)
3. [React 컴포넌트 규칙](#react-컴포넌트-규칙)
4. [네이밍 컨벤션](#네이밍-컨벤션)
5. [파일 구조](#파일-구조)
6. [주석 작성](#주석-작성)
7. [테스트 작성](#테스트-작성)
8. [Git 커밋 메시지](#git-커밋-메시지)

## 일반 규칙

### 🔧 코드 포맷팅

- **들여쓰기**: 2칸 스페이스 사용
- **줄 길이**: 최대 100자 (주석 제외)
- **줄 끝**: LF (Unix) 사용
- **인코딩**: UTF-8 사용

```typescript
// ✅ 올바른 예
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}

// ❌ 잘못된 예 (줄이 너무 김)
function calculateTotal(items: Item[]): number { return items.reduce((sum, item) => { return sum + item.price * item.quantity; }, 0); }
```

### 🔄 세미콜론과 따옴표

- **세미콜론**: 항상 사용
- **따옴표**: 싱글 쿼트 사용 (`'`), 이스케이프가 필요한 경우에만 더블 쿼트 (`"`)

```typescript
// ✅ 올바른 예
const name = 'John';
const message = "Don't do that";
const path = 'C:\\Users\\John';

// ❌ 잘못된 예
const name = "John";
const path = 'C:\Users\John'; // 이스케이프 필요
```

### 🔗 임포트/익스포트

- **그룹화**: 관련된 임포트를 그룹화하고 빈 줄로 분리
- **순서**: React → 서드파티 라이브러리 → 내부 모듈 → 타입/인터페이스
- **절대 경로**: 상대 경로 대신 절대 경로 사용

```typescript
// ✅ 올바른 예
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import { useEditorStore } from '@/store/editorStore';
import { PlacedItem } from '@/types/editor';
import { createFurnitureModel } from '@/utils/modelLoader';

// ❌ 잘못된 예 (순서가 잘못됨)
import { PlacedItem } from '@/types/editor';
import React, { useState } from 'react';
import { createFurnitureModel } from '@/utils/modelLoader';
import { Canvas } from '@react-three/fiber';
```

## TypeScript 규칙

### 🔒 타입 정의

- **인터페이스 우선**: 클래스 대신 인터페이스 사용
- **Optional 속성**: `?` 사용, `| undefined` 사용하지 않음
- **Union 타입**: 가능한 경우 좁은 범위의 타입 사용

```typescript
// ✅ 올바른 예
interface User {
  id: string;
  name: string;
  email?: string; // 선택적 속성
  role: 'admin' | 'user' | 'guest'; // 유니온 타입
}

interface ComponentProps {
  items: Item[];
  onSelect?: (item: Item) => void;
  disabled?: boolean;
}

// ❌ 잘못된 예
interface User {
  id: string;
  name: string;
  email: string | undefined; // | undefined 사용하지 않음
  role: string; // 좁은 범위의 타입 사용
}
```

### 🔧 제네릭 타입

- **의미 있는 이름**: `T`, `U` 대신 의미 있는 이름 사용
- **제약 조건**: 필요한 경우에만 사용

```typescript
// ✅ 올바른 예
interface ApiResponse<Data = unknown> {
  data: Data;
  error?: string;
  status: number;
}

function fetchUser<UserData = User>(id: string): Promise<UserData> {
  // 구현
}

// ❌ 잘못된 예
interface Response<T = any> { // any 사용하지 않음
  data: T;
  error: string;
}

function fetchData<T>(url: string): Promise<T> { // 제네릭 이름이 의미 없음
  // 구현
}
```

### 🚫 any 타입 사용 금지

- **타입 단언**: `as` 대신 구체적인 타입 사용
- **unknown**: `any` 대신 `unknown` 사용
- **타입 가드**: 런타임 타입 확인 시 타입 가드 사용

```typescript
// ✅ 올바른 예
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function processValue(value: unknown): string {
  if (isString(value)) {
    return value.toUpperCase();
  }
  return String(value);
}

// ❌ 잘못된 예
function processValue(value: any): string { // any 사용
  return value.toString(); // 런타임 에러 가능성
}
```

## React 컴포넌트 규칙

### 🏗️ 컴포넌트 구조

- **함수형 컴포넌트**: 클래스 컴포넌트 대신 함수형 컴포넌트 사용
- **화살표 함수**: 익명 함수 대신 화살표 함수 사용
- **Props 타입**: 항상 인터페이스로 정의

```typescript
// ✅ 올바른 예
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// ❌ 잘못된 예 (클래스 컴포넌트)
class Button extends React.Component<ButtonProps> {
  render() {
    return (
      <button>
        {this.props.children}
      </button>
    );
  }
}
```

### 🎣 커스텀 훅

- **use 접두사**: 커스텀 훅 이름은 `use`로 시작
- **의존성 배열**: `useEffect`, `useCallback` 등에 정확한 의존성 명시

```typescript
// ✅ 올바른 예
const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
};

// ❌ 잘못된 예 (의존성 누락)
const useLocalStorage = (key: string, initialValue: any) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      setValue(JSON.parse(stored));
    }
  }, []); // key가 의존성에 없음
};
```

### 🔑 JSX 규칙

- **자동 닫힘**: 내용이 없는 태그는 자동 닫힘 사용
- **속성 정렬**: 알파벳 순서로 정렬 (단, 주요 속성은 먼저)
- **조건부 렌더링**: 삼항 연산자 대신 `&&` 사용 (가능한 경우)

```typescript
// ✅ 올바른 예
const UserCard: React.FC<UserCardProps> = ({ user, showDetails }) => {
  return (
    <div className="user-card">
      <img
        alt={user.name}
        className="avatar"
        src={user.avatar}
      />
      <h3>{user.name}</h3>
      {showDetails && (
        <div className="details">
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
        </div>
      )}
    </div>
  );
};

// ❌ 잘못된 예
const UserCard = ({ user, showDetails }) => // 타입 정의 누락
  <div className="user-card">
    <img src={user.avatar} alt={user.name} className="avatar" /> {/* 속성 순서 */}
    <h3>{user.name}</h3>
    {showDetails ? <div>Details</div> : null} {/* 삼항 연산자 불필요 */}
  </div>
```

## 네이밍 컨벤션

### 📝 변수와 함수

- **카멜 케이스**: 변수, 함수, 메서드
- **파스칼 케이스**: 컴포넌트, 클래스, 인터페이스, 타입
- **스네이크 케이스**: 상수 (대문자)
- **케밥 케이스**: 파일명

```typescript
// ✅ 올바른 예
const userName = 'john'; // 카멜 케이스
const UserProfile = () => {}; // 파스칼 케이스
const API_BASE_URL = 'https://api.example.com'; // 스네이크 케이스 (대문자)
const MAX_RETRY_COUNT = 3; // 상수

// 파일명
// user-profile.tsx (케밥 케이스)
// UserProfile.tsx (컴포넌트 파일)
// userProfile.ts (일반 파일)

// ❌ 잘못된 예
const username = 'john'; // userName이 더 명확
const user_profile = 'john'; // 카멜 케이스 사용
const userProfile = () => {}; // 컴포넌트는 파스칼 케이스
```

### 🏷️ 이벤트 핸들러

- **handle 접두사**: 이벤트 핸들러 함수
- **on 접두사**: props로 전달되는 콜백

```typescript
// ✅ 올바른 예
const handleSubmit = (event: React.FormEvent) => {
  event.preventDefault();
  // 제출 로직
};

const handleItemClick = (item: Item) => {
  // 아이템 클릭 로직
};

interface ButtonProps {
  onClick?: () => void; // props 콜백
  children: React.ReactNode;
}

// ❌ 잘못된 예
const onSubmit = () => {}; // 이벤트 핸들러는 handle 사용
const clickHandler = () => {}; // handleClick 사용
```

### 🎯 불리언 변수

- **is, has, can, should, will** 접두사 사용
- **양수형**: 부정형보다 양수형 선호

```typescript
// ✅ 올바른 예
const isLoading = false;
const hasItems = items.length > 0;
const canEdit = user.permissions.includes('edit');
const shouldShowModal = !isLoading && hasItems;

// ❌ 잘못된 예
const loading = false; // isLoading이 더 명확
const noItems = items.length === 0; // hasItems 사용
const disableEdit = !canEdit; // canEdit 사용
```

## 파일 구조

### 📁 디렉토리 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (routes)/          # 라우트 그룹
│   ├── api/               # API 엔드포인트
│   └── globals.css        # 전역 스타일
├── components/            # React 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── furniture/        # 가구 관련 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── hooks/                 # 커스텀 훅
├── store/                 # 상태 관리
├── utils/                 # 유틸리티 함수
├── types/                 # TypeScript 타입
├── data/                  # 정적 데이터
└── __tests__/            # 테스트 파일
```

### 📄 파일 명명 규칙

- **컴포넌트**: `ComponentName.tsx`
- **유틸리티**: `utilityName.ts`
- **타입**: `typeName.ts`
- **테스트**: `ComponentName.test.tsx`
- **인덱스**: `index.ts` (배럴 익스포트용)

```typescript
// ✅ 올바른 예
// components/Button.tsx
// components/ui/Input.tsx
// utils/formatDate.ts
// types/User.ts
// hooks/useLocalStorage.ts

// ❌ 잘못된 예
// components/button.tsx (대문자 사용)
// components/UI/input.tsx (일관되지 않은 케이스)
// utils/FormatDate.ts (카멜 케이스 사용)
```

### 📦 배럴 익스포트

- **index.ts**: 관련 모듈들을 하나의 파일에서 익스포트
- **깔끔한 임포트**: 디렉토리에서 직접 임포트 가능

```typescript
// ✅ 올바른 예
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';

// 다른 파일에서
import { Button, Input, Modal } from '@/components/ui';

// ❌ 잘못된 예
// components/ui/index.ts (불필요한 재익스포트)
export { default as Button } from './Button';
export { default as Input } from './Input';

// 다른 파일에서 (불필요한 긴 경로)
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
```

## 주석 작성

### 📝 JSDoc 주석

- **함수/클래스**: JSDoc 형식 사용
- **파라미터**: `@param` 태그 사용
- **리턴 값**: `@returns` 태그 사용
- **예제**: `@example` 태그 사용

```typescript
// ✅ 올바른 예
/**
 * 사용자 정보를 서버에 저장합니다.
 * @param userId - 사용자 ID
 * @param userData - 저장할 사용자 데이터
 * @returns 저장 성공 여부
 * @example
 * ```typescript
 * const success = await saveUser('123', { name: 'John', email: 'john@example.com' });
 * ```
 */
async function saveUser(userId: string, userData: Partial<User>): Promise<boolean> {
  try {
    await api.post(`/users/${userId}`, userData);
    return true;
  } catch (error) {
    console.error('Failed to save user:', error);
    return false;
  }
}

// ❌ 잘못된 예
// 사용자 저장 함수 (불충분한 정보)
function saveUser(userId: string, userData: any): Promise<boolean> {
  // 서버에 저장
  return api.post(`/users/${userId}`, userData);
}
```

### 📋 인라인 주석

- **복잡한 로직**: 복잡한 비즈니스 로직 설명
- **알고리즘**: 특이한 알고리즘 설명
- **TODO/FIXME**: 향후 작업 표시

```typescript
// ✅ 올바른 예
// 사용자가 최근 30일 이내에 로그인했는지 확인
const isRecentUser = user.lastLoginAt &&
  Date.now() - user.lastLoginAt.getTime() < 30 * 24 * 60 * 60 * 1000;

// 3D 모델의 경계 상자를 계산하여 충돌 감지 최적화
const boundingBox = new THREE.Box3().setFromObject(model);

// TODO: 성능 최적화를 위해 메모이제이션 추가 필요
const expensiveCalculation = useMemo(() => {
  return complexAlgorithm(data);
}, [data]);

// FIXME: 이 함수는 더 이상 사용되지 않음 - 다음 버전에서 제거
function deprecatedFunction() {
  // 구현
}

// ❌ 잘못된 예
const isRecent = user.lastLoginAt && Date.now() - user.lastLoginAt.getTime() < 30 * 24 * 60 * 60 * 1000; // 최근 사용자인지 확인
// 위의 주석은 코드가 이미 설명하고 있음
```

### 🏷️ TODO 주석

- **형식**: `TODO:`, `FIXME:`, `HACK:`, `NOTE:`
- **담당자**: 가능하다면 담당자 이름 포함
- **마감일**: 긴급한 경우 날짜 포함

```typescript
// ✅ 올바른 예
// TODO: 다음 스프린트에서 다크 모드 지원 추가
// FIXME: john - 메모리 누수 수정 (2024-01-15까지)
// HACK: 임시 해결책 - 더 나은 방법 찾아야 함
// NOTE: 이 알고리즘은 O(n²) 복잡도를 가지므로 대용량 데이터에 주의

// ❌ 잘못된 예
// 나중에 수정해야 함 (구체적이지 않음)
// 임시로 이렇게 함 (HACK 사용)
// john이 다음에 수정할 것 (담당자 표시)
```

## 테스트 작성

### 🧪 테스트 구조

- **describe**: 컴포넌트/모듈 단위로 그룹화
- **it**: 개별 테스트 케이스
- **beforeEach**: 테스트 전 초기화
- **afterEach**: 테스트 후 정리

```typescript
// ✅ 올바른 예
describe('UserProfile', () => {
  let mockUser: User;

  beforeEach(() => {
    mockUser = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    };
  });

  describe('Rendering', () => {
    it('renders user name correctly', () => {
      render(<UserProfile user={mockUser} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders user email when showEmail is true', () => {
      render(<UserProfile user={mockUser} showEmail={true} />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onEdit when edit button is clicked', () => {
      const mockOnEdit = jest.fn();
      render(<UserProfile user={mockUser} onEdit={mockOnEdit} />);

      fireEvent.click(screen.getByText('Edit'));
      expect(mockOnEdit).toHaveBeenCalledWith(mockUser.id);
    });
  });
});

// ❌ 잘못된 예
describe('UserProfile tests', () => { // 모호한 설명
  it('should work', () => { // 모호한 테스트 이름
    // 테스트 내용 없음
  });
});
```

### 🎭 모킹 전략

- **외부 의존성**: API 호출, 파일 시스템 등 모킹
- **내부 모듈**: 필요한 경우에만 모킹
- **타입 안전성**: 모킹된 함수의 타입 유지

```typescript
// ✅ 올바른 예
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

// API 모킹
jest.mock('../api/userApi', () => ({
  fetchUser: jest.fn(),
  updateUser: jest.fn()
}));

// 커스텀 훅 모킹
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true
  })
}));

describe('UserProfile', () => {
  it('fetches user data on mount', () => {
    const mockFetchUser = require('../api/userApi').fetchUser;
    mockFetchUser.mockResolvedValue(mockUser);

    render(<UserProfile userId="123" />);

    expect(mockFetchUser).toHaveBeenCalledWith('123');
  });
});

// ❌ 잘못된 예
// 과도한 모킹
jest.mock('react', () => ({
  useState: jest.fn(),
  useEffect: jest.fn()
})); // React 기본 훅까지 모킹
```

### 📊 테스트 커버리지

- **목표**: 함수/분기/라인 90% 이상
- **중요 부분**: 비즈니스 로직, 에러 처리, 엣지 케이스
- **무시**: 단순 getter/setter, 자동 생성 코드

```typescript
// ✅ 커버리지 목표 달성
describe('Calculator', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('subtracts two numbers', () => {
    expect(subtract(5, 3)).toBe(2);
  });

  it('handles negative numbers', () => {
    expect(add(-2, 3)).toBe(1);
  });

  it('handles floating point numbers', () => {
    expect(add(2.5, 3.7)).toBe(6.2);
  });

  it('throws error for invalid input', () => {
    expect(() => add('2', 3)).toThrow('Invalid input');
  });
});
```

## Git 커밋 메시지

### 📝 커밋 메시지 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 🎯 타입 종류

- **feat**: 새로운 기능 추가
- **fix**: 버그 수정
- **docs**: 문서 수정
- **style**: 코드 스타일 수정 (기능 변경 없음)
- **refactor**: 코드 리팩토링
- **test**: 테스트 코드 추가/수정
- **chore**: 빌드/설정 파일 수정

### 📋 커밋 메시지 예시

```bash
# ✅ 올바른 예
feat(auth): add user login functionality

- Implement JWT token-based authentication
- Add login/logout API endpoints
- Create login form component
- Add form validation

Closes #123

fix(ui): resolve modal close button alignment

- Fix modal close button positioning in mobile view
- Adjust button size for better touch targets

fix(api): handle null user data gracefully

- Add null checks for user data in API responses
- Return appropriate error messages for missing data
- Add unit tests for error cases

# ❌ 잘못된 예
fix: bug fixed (너무 모호함)
feat: new stuff (설명이 부족함)
fix bug (타입 누락)
FIX: BUG FIXED (대문자 사용)
```

### 🔗 이슈 연결

- **Closes/Fixes**: 이슈를 해결하는 경우
- **Refs**: 관련된 이슈가 있는 경우
- **BREAKING CHANGE**: 주요 변경 사항

```bash
# ✅ 올바른 예
feat(api): change user endpoint structure

BREAKING CHANGE: The /api/users endpoint now requires authentication
- Update client code to include auth token
- Update documentation with new auth requirements

Closes #456

fix(db): optimize query performance

- Add database indexes for frequently queried fields
- Optimize JOIN operations in user queries
- Add query result caching

Refs #789
```

## 🔧 도구 설정

### 📏 Prettier 설정

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### 🔍 ESLint + Prettier 통합

```json
// .eslintrc.js
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "prettier" // Prettier와 충돌하는 규칙 비활성화
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    // 프로젝트별 규칙들
  }
}
```

### 🤖 Husky + lint-staged (Pre-commit hooks)

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{js,json,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

---

## 📚 참고 자료

- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [React 공식 문서](https://react.dev/)
- [ESLint 규칙](https://eslint.org/docs/rules/)
- [Prettier 옵션](https://prettier.io/docs/en/options.html)
- [Conventional Commits](https://conventionalcommits.org/)

---

**문서 버전**: 1.0.0
**마지막 업데이트**: 2024년 12월
**작성자**: 개발팀
**승인자**: 기술 리드
