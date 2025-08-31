# Tailwind CSS v4 마이그레이션 의존성 분석

## 현재 설치된 패키지 버전

### Tailwind CSS 관련
- **tailwindcss**: v4.1.12 (v4 최신 버전)
- **@tailwindcss/postcss**: v4.1.12 (v4 전용 플러그인)

### PostCSS 관련
- **postcss**: v8.5.6
- **autoprefixer**: v10.4.21

### Babel 관련
- **@babel/cli**: v7.28.3
- **@babel/core**: v7.28.3
- **@babel/preset-env**: v7.28.3
- **@babel/preset-react**: v7.27.1
- **@babel/preset-typescript**: v7.27.1

## 마이그레이션 계획

### 1단계: 현재 설정 백업 ✅
- package.json.backup
- postcss.config.js.backup
- tailwind.config.js.backup
- babel.config.js.backup

### 2단계: Tailwind CSS v4 패키지 제거
- @tailwindcss/postcss v4.1.12 제거
- tailwindcss v4.1.12 제거

### 3단계: Tailwind CSS v3 설치
- tailwindcss v3.x 설치
- postcss v8.4.x (Next.js 호환 버전)
- autoprefixer v10.4.x 유지

### 4단계: Babel 제거 및 SWC 활성화
- babel.config.js 제거
- Next.js 기본 SWC 컴파일러 사용

### 5단계: 설정 파일 업데이트
- postcss.config.js v3 호환 설정
- tailwind.config.js v3 호환 설정

## 주의사항
- Next.js 15.4.2는 PostCSS v8.4.31을 사용
- 현재 PostCSS v8.5.6은 Next.js와 호환성 문제 가능성
- Tailwind CSS v4는 아직 안정화되지 않은 버전
- v3로 다운그레이드하여 안정성 확보

## 백업 완료 시간
2025-08-31 22:18 KST
