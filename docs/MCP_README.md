# MCP Integration Guide (Cursor ↔ Codex)

본 문서는 MCP(Model Context Protocol) 기반 도구를 Cursor와 Codex(CLI/IDE)에서 동시에 사용할 때 포트/전송 방식 충돌을 방지하기 위한 가이드입니다.

## 목적

- Cursor와 Codex가 같은 MCP 서버를 동시에 사용할 때 발생할 수 있는 **포트 충돌**, **전송 방식 혼동(stdio vs TCP)**, **세션 겹침**을 예방합니다.
- 프로젝트 내 제공되는 MCP 유틸 스크립트를 소개하고, 표준 포트 할당 규칙을 정의합니다.

## 전송 방식 개요

- stdio
  - 특징: 프로세스 표준 입출력으로 JSON-RPC 교신. 일반적으로 **하나의 서버 프로세스당 한 클라이언트** 연결을 가정.
  - 장점: 설정이 간단, 별도 포트 불필요.
  - 주의: Cursor와 Codex가 같은 stdio 서버 프로세스에 동시에 연결하려고 하면 충돌이 납니다. 각자 **서버 인스턴스를 분리**해서 붙이거나, TCP 전송을 사용하세요.

- TCP (host:port)
  - 특징: 네트워크 소켓으로 JSON-RPC 교신. 포트를 명시적으로 열기 때문에 **포트 충돌 방지**가 핵심.
  - 장점: 여러 클라이언트에서 붙기 쉬움(서버 구현에 따라 다름), 연결 관리 용이.
  - 주의: **이미 사용 중인 포트**에 서버를 띄우면 실패. 포트를 구분해 운영하고, 충돌 시 포트 변경/프로세스 종료를 통해 정리하세요.

## 프로젝트 내 제공 스크립트

- `scripts/mcp-smoke.js`
  - 용도: stdio 기반 MCP 서버에 대해 `initialize` 핸드셰이크가 되는지 **헬스체크**.
  - 사용: `node scripts/mcp-smoke.js -- <server_cmd> [args...]`

- `scripts/mcp-tcp-client.js`
  - 용도: TCP 기반 MCP 서버(host:port)에 연결해 `initialize` 수행, 선택적으로 `tools/list` 요청.
  - 사용: `node scripts/mcp-tcp-client.js --host 127.0.0.1 --port 9881 [--list-tools]`

- `scripts/mcp-dummy-server.js`
  - 용도: 단순 stdio MCP 서버(테스트/데모용). `initialize`에 정상 응답.
  - 사용: `node scripts/mcp-smoke.js -- node scripts/mcp-dummy-server.js`

## 포트 할당 규칙(권장)

동시 사용 시 아래와 같이 **역할별 표준 포트**를 권장합니다. 실제 서버가 TCP를 지원할 경우 적용하세요.

- Cursor 전용: `9881`
- Codex 전용: `9882`
- 임시/실험: `9883` ~ `9890`

특정 MCP 서버가 **단일 인스턴스만** 허용하거나 **멀티 클라이언트**를 지원하지 않는다면, 위 포트를 참고해 **서버 인스턴스를 분리**해 띄우세요.

## 충돌 진단/정리 방법

- 포트 사용 확인(macOS/Linux)
  - `lsof -nP -iTCP -sTCP:LISTEN | rg 988`
  - `lsof -i :9881`
- 프로세스 종료
  - 안전하게 종료: 해당 앱(UI)에서 서버 중지 또는 Ctrl+C
  - 필요 시 강제 종료: `kill -9 <PID>` (권장하지 않음)
- stdio 혼선 증상 예시
  - 로그에 `Unexpected token 'C', "Content-Length: ..." is not valid JSON`가 보이면, JSON 바디만 기대하는 쪽에 헤더가 함께 들어간 경우입니다. MCP는 `Content-Length` 헤더 + 바디 프레이밍을 사용하므로, **프로토콜/전송을 맞추고 적절한 클라이언트를 사용**하세요.

## 사용 시나리오

1) Cursor와 Codex를 동시에 사용, MCP 서버도 동시에 붙이기
   - TCP 전송을 사용하는 MCP 서버를 준비하고, 포트를 분리해 운영
   - 예시: Cursor → `9881`, Codex → `9882`
   - Codex 확인: `node scripts/mcp-tcp-client.js --host 127.0.0.1 --port 9882 --list-tools`

2) stdio만 지원하는 MCP 서버 사용
   - Cursor와 Codex가 **동시에 같은 서버 프로세스에 붙을 수 없음**
   - 방법 A: 클라이언트별로 **서버 인스턴스 분리**(각자의 프로세스 실행)
   - 방법 B: 한쪽에서만 연결, 필요 시 다른 쪽에서 연결하기 전에 먼저 분리(정리)
   - 헬스체크: `node scripts/mcp-smoke.js -- <server_cmd> [args...]`

## Cursor 설정(예시)

아래는 참고용 예시입니다. 실제 Cursor의 MCP 설정 UI/파일에 맞게 적용하세요.

```json
{
  "servers": [
    {
      "name": "my-mcp-tcp",
      "transport": "tcp",
      "host": "127.0.0.1",
      "port": 9881
    },
    {
      "name": "my-mcp-stdio",
      "transport": "stdio",
      "command": "node",
      "args": ["/absolute/or/workspace/path/scripts/mcp-dummy-server.js"]
    }
  ]
}
```

주의: stdio 서버에 Cursor와 Codex를 동시에 붙이지 마세요. 각자 별도 서버 인스턴스를 띄우거나 TCP 전송을 사용하세요.

## Codex(이 환경)에서 확인 명령

- stdio 서버 핸드셰이크 확인
  - `node scripts/mcp-smoke.js -- node scripts/mcp-dummy-server.js`
- TCP 서버 연결 확인
  - `node scripts/mcp-tcp-client.js --host 127.0.0.1 --port 9882 --list-tools`

## 모범 운영 체크리스트

- 포트는 역할별로 고정(9881: Cursor, 9882: Codex)
- stdio 서버는 **클라이언트당 프로세스 1개 원칙**
- TCP 서버는 **포트 충돌 감시** 후 기동(`lsof`로 선점 여부 확인)
- 로그에서 프레이밍/프로토콜 오류가 나오면 전송 방식 점검(stdio 헤더/바디, TCP JSON-RPC)

## 부록: 흔한 문제와 해결

- 문제: `Unexpected token 'C', "Content-Length" ...` (stdio)
  - 원인: 헤더 포함 프레임을 JSON만 기대하는 파이프에 전달함
  - 조치: MCP 클라이언트를 사용해 올바른 프레이밍으로 통신하거나 서버 측 전송 방식을 프로토콜에 맞게 수정

- 문제: `EADDRINUSE` 또는 서버가 기동하지 않음(TCP)
  - 원인: 포트 충돌
  - 조치: 권장 포트 범위에서 미사용 포트 선택, 기존 프로세스 종료, 포트 재할당

- 문제: 한쪽(Codex/Cursor)에서 연결되면 다른 쪽이 붙지 못함(stdio)
  - 원인: stdio 서버는 원칙적으로 단일 연결
  - 조치: 서버 인스턴스를 분리하거나 TCP 전송으로 전환

