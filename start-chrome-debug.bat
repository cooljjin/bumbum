@echo off
REM Chrome을 디버그 모드로 실행하는 배치 파일
REM Chrome DevTools MCP를 사용하기 위해 필요합니다

REM Chrome 프로세스 종료
taskkill /F /IM chrome.exe 2>nul

REM Chrome을 디버그 모드로 시작
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug-profile"

echo Chrome이 디버그 모드로 시작되었습니다 (포트: 9222)
echo 이 창을 닫지 마세요.
pause







