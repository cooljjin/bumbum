# Chrome DevTools MCP 설정 가이드

Chrome DevTools MCP를 사용하면 AI 코딩 어시스턴트가 Chrome 브라우저를 직접 제어하고, 웹 페이지를 분석하며, 성능 지표를 확인할 수 있습니다.

## 설정 방법

### 1단계: Cursor MCP 설정

1. **Cursor 설정 파일 열기**:
   - `Ctrl + ,` → 설정 열기
   - 우측 상단 `{}` 아이콘 클릭 (Open Settings JSON)

2. **MCP 설정 추가**:
   설정 파일에 다음 내용을 추가하세요:

   ```json
   {
     "mcpServers": {
       "chrome-devtools": {
         "command": "npx",
         "args": ["-y", "chrome-devtools-mcp@latest"]
       }
     }
   }
   ```

   만약 이미 다른 MCP 서버가 설정되어 있다면:

   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-playwright"]
       },
       "chrome-devtools": {
         "command": "npx",
         "args": ["-y", "chrome-devtools-mcp@latest"]
       }
     }
   }
   ```

### 2단계: Chrome 디버그 모드 실행

Chrome DevTools MCP가 작동하려면 Chrome이 디버그 모드로 실행되어야 합니다.

**방법 1: 배치 파일 사용 (권장)**

프로젝트 루트에 있는 `start-chrome-debug.bat` 파일을 실행하세요:

```bash
.\start-chrome-debug.bat
```

**방법 2: 수동 실행**

터미널에서 다음 명령어를 실행하세요:

```bash
# 먼저 실행 중인 Chrome 프로세스를 종료합니다
taskkill /F /IM chrome.exe

# Chrome을 디버그 모드로 시작합니다
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug-profile"
```

**macOS/Linux:**

```bash
# 먼저 실행 중인 Chrome 프로세스를 종료합니다
pkill -9 "Google Chrome"

# Chrome을 디버그 모드로 시작합니다 (macOS)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug-profile"

# Chrome을 디버그 모드로 시작합니다 (Linux)
google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug-profile"
```

### 3단계: Cursor 재시작

1. Cursor를 완전히 종료합니다
2. Cursor를 다시 시작합니다

### 4단계: 테스트

Cursor의 AI 채팅에서 다음과 같이 테스트해보세요:

```
Chrome DevTools MCP를 사용해서 https://web.dev 페이지의 LCP(Largest Contentful Paint)를 확인해줘
```

또는

```
Chrome에서 https://www.google.com을 열고 페이지 로딩 시간을 측정해줘
```

## Chrome DevTools MCP 기능

Chrome DevTools MCP를 사용하면 다음과 같은 작업을 수행할 수 있습니다:

### 1. 성능 분석
- **LCP (Largest Contentful Paint)**: 최대 콘텐츠풀 페인트 시간 측정
- **FCP (First Contentful Paint)**: 첫 콘텐츠풀 페인트 시간 측정
- **TBT (Total Blocking Time)**: 총 차단 시간 측정
- **CLS (Cumulative Layout Shift)**: 누적 레이아웃 이동 측정

### 2. 페이지 분석
- DOM 구조 분석
- CSS 스타일 검사
- JavaScript 에러 확인
- 네트워크 요청 모니터링

### 3. 스크린샷 및 녹화
- 페이지 스크린샷 캡처
- 사용자 상호작용 녹화

### 4. 접근성 검사
- ARIA 속성 확인
- 키보드 네비게이션 테스트
- 색상 대비 분석

## 사용 예제

### 예제 1: 웹 페이지 성능 측정

```
Chrome DevTools MCP를 사용해서 우리 프로젝트의 메인 페이지 (localhost:3000) 성능을 측정해줘. LCP, FCP, TBT를 확인하고 개선 방안을 제안해줘.
```

### 예제 2: 모바일 반응형 테스트

```
Chrome DevTools MCP로 우리 사이트를 iPhone 14 화면 크기로 열고 레이아웃이 제대로 작동하는지 확인해줘.
```

### 예제 3: JavaScript 에러 확인

```
Chrome DevTools MCP로 우리 사이트를 열고 콘솔에 에러가 있는지 확인해줘.
```

### 예제 4: 네트워크 요청 분석

```
Chrome DevTools MCP를 사용해서 우리 사이트의 네트워크 요청을 분석해줘. 어떤 리소스가 가장 오래 걸리는지 알려줘.
```

## 문제 해결

### Chrome이 디버그 모드로 시작되지 않음

1. **Chrome 프로세스 완전히 종료**:
   - 작업 관리자 (Ctrl + Shift + Esc) 열기
   - "chrome.exe" 프로세스 모두 종료
   - 배치 파일 다시 실행

2. **Chrome 경로 확인**:
   - Chrome이 다른 위치에 설치되어 있다면 경로를 수정하세요:
   ```bash
   "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
   ```

### MCP 서버가 연결되지 않음

1. **Cursor 재시작**: Cursor를 완전히 종료하고 다시 시작
2. **설정 확인**: MCP 설정이 올바르게 저장되었는지 확인
3. **npm 확인**: `npm --version`으로 npm이 설치되어 있는지 확인

### npx 명령어를 찾을 수 없음

Node.js가 설치되어 있지 않은 경우입니다:

1. [Node.js 공식 사이트](https://nodejs.org/)에서 다운로드
2. LTS 버전 설치 (현재 20.x 권장)
3. 설치 후 터미널 재시작
4. `node --version`과 `npm --version`으로 확인

## 참고 자료

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Chrome DevTools MCP 공식 문서](https://developer.chrome.com/blog/chrome-devtools-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 주의 사항

1. **디버그 모드의 Chrome은 보안상 취약**할 수 있으므로 개발 용도로만 사용하세요.
2. **개인 데이터 보호**: `--user-data-dir`로 임시 프로필을 사용하여 개인 데이터를 보호합니다.
3. **리소스 사용**: Chrome 디버그 모드는 일반 모드보다 더 많은 메모리를 사용할 수 있습니다.

## 추가 도움말

문제가 계속되면 다음을 확인하세요:

1. Cursor의 개발자 도구 (Help → Toggle Developer Tools) 열기
2. 콘솔에서 MCP 관련 에러 메시지 확인
3. 에러 메시지를 AI에게 공유하여 해결 방안 요청







