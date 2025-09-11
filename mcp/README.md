MCP Playwright 컨텍스트 축소 워크플로

빠르게 쓰는 법
- 한 번만 스냅샷: `playwright__browser_snapshot` 결과를 파일로 저장(예: `mcp/snapshot-home.txt`).
- refs 채우기: `npm run mcp:refresh`로 `mcp/refs.json`의 `ref`를 최신화.
- 조작/검증: 대화에서는 긴 스냅샷 대신 별칭의 `ref`만 써서 클릭/타이핑/평가 수행.

주요 파일
- `mcp/refs.json`: 페이지별 요소 별칭 → `ref` 매핑. `selector`는 재획득 힌트.
- `mcp/snapshot-home.txt`: 최근 스냅샷(예시). UI 바뀌면 새로 저장.
- `mcp/helpers/refreshRefs.js`: 스냅샷을 파싱해 `refs.json`의 `ref`를 자동 갱신.
- `mcp/helpers/evalShort.js`: `evaluate` 응답을 자동으로 짧게 잘라주는 함수 문자열 생성.
- `mcp/helpers/getRef.js`: 별칭으로 현재 `ref`를 출력(스크립트/디버깅에 유용).

명령어
- `npm run mcp:refresh`: `mcp/snapshot-home.txt`로 refs 갱신
- `npm run mcp:refresh:dry`: 적용 전 변경 사항 미리보기
- `npm run mcp:snap:save`: stdin으로 받은 스냅샷을 `mcp/snapshots/snapshot-YYYYMMDD-HHMMSS.txt`에 저장
- `npm run mcp:refresh:latest`: 가장 최신 스냅샷 파일로 refs 갱신
- `npm run mcp:auto`: stdin 스냅샷 저장 후 최신 파일로 자동 갱신

헬퍼 예시
- 제목 80자 확인: `node mcp/helpers/evalShort.js fn "document.title" --maxLen 80`
- 요소 텍스트 120자 확인: `node mcp/helpers/evalShort.js el "element.textContent" --maxLen 120`
- 별칭→ref: `node mcp/helpers/getRef.js settingsButton`

자동 저장 + 최신 갱신 워크플로
- 스냅샷 저장: `playwright__browser_snapshot`의 YAML을 stdin으로 전달
  - 예: (CLI에서) `cat mcp/snapshot-home.txt | npm run mcp:snap:save`
- 최신 갱신: `npm run mcp:refresh:latest` (기본 `--page home`)
- 원스텝: `cat mcp/snapshot-home.txt | npm run mcp:auto`

팁
- `ref not found`가 뜨면: 스냅샷 저장 → `mcp:refresh` 실행.
- 안정성: 가능하면 `[data-testid]` / `getByRole` 레이블 기반 선택자 사용.
- 텍스트 변경 시: `selector`의 텍스트만 고치고 다시 `mcp:refresh`.
