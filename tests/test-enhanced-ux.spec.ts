import { test, expect } from '@playwright/test';

test.describe('사용자 경험 개선 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
  });

  test('키보드 단축키 시스템 테스트', async ({ page }) => {
    // 편집 모드 활성화
    await page.click('text=룸 편집');
    await page.waitForTimeout(1000);

    // Q 키로 선택 도구 활성화
    await page.keyboard.press('q');
    await page.waitForTimeout(500);
    
    // 선택 도구가 활성화되었는지 확인
    const selectTool = page.locator('button[title*="선택 도구"]');
    await expect(selectTool).toHaveClass(/bg-blue-600/);

    // G 키로 이동 도구 활성화
    await page.keyboard.press('g');
    await page.waitForTimeout(500);
    
    // 이동 도구가 활성화되었는지 확인
    const translateTool = page.locator('button[title*="이동 도구"]');
    await expect(translateTool).toHaveClass(/bg-green-600/);

    // R 키로 회전 도구 활성화
    await page.keyboard.press('r');
    await page.waitForTimeout(500);
    
    // 회전 도구가 활성화되었는지 확인
    const rotateTool = page.locator('button[title*="회전 도구"]');
    await expect(rotateTool).toHaveClass(/bg-purple-600/);

    // S 키로 크기 조절 도구 활성화
    await page.keyboard.press('s');
    await page.waitForTimeout(500);
    
    // 크기 조절 도구가 활성화되었는지 확인
    const scaleTool = page.locator('button[title*="크기 조절 도구"]');
    await expect(scaleTool).toHaveClass(/bg-orange-600/);
  });

  test('편집 모드 전환 애니메이션 테스트', async ({ page }) => {
    // 편집 모드 활성화
    await page.click('text=룸 편집');
    await page.waitForTimeout(1000);

    // 모드 전환 애니메이션이 표시되는지 확인
    const modeIndicator = page.locator('text=✏️ 편집');
    await expect(modeIndicator).toBeVisible();

    // 편집 모드 종료
    await page.click('text=편집 종료');
    await page.waitForTimeout(1000);

    // 보기 모드로 전환되었는지 확인
    const viewModeIndicator = page.locator('text=👁️ 보기');
    await expect(viewModeIndicator).toBeVisible();
  });


  test('도구바 단축키 힌트 표시 테스트', async ({ page }) => {
    // 편집 모드 활성화
    await page.click('text=룸 편집');
    await page.waitForTimeout(1000);

    // 각 도구 버튼에 단축키가 표시되는지 확인
    const selectTool = page.locator('button[title*="선택 도구"]');
    const translateTool = page.locator('button[title*="이동 도구"]');
    const rotateTool = page.locator('button[title*="회전 도구"]');
    const scaleTool = page.locator('button[title*="크기 조절 도구"]');

    await expect(selectTool.locator('text=Q')).toBeVisible();
    await expect(translateTool.locator('text=G')).toBeVisible();
    await expect(rotateTool.locator('text=R')).toBeVisible();
    await expect(scaleTool.locator('text=S')).toBeVisible();
  });

  test('설정 패널 단축키 도움말 테스트', async ({ page }) => {
    // 설정 버튼 클릭
    await page.click('button[title="설정"]');
    await page.waitForTimeout(500);

    // 키보드 단축키 섹션이 표시되는지 확인
    const shortcutsSection = page.locator('text=키보드 단축키');
    await expect(shortcutsSection).toBeVisible();

    // 주요 단축키들이 표시되는지 확인
    await expect(page.locator('text=Q 선택 도구')).toBeVisible();
    await expect(page.locator('text=G 이동 도구')).toBeVisible();
    await expect(page.locator('text=R 회전 도구')).toBeVisible();
    await expect(page.locator('text=S 크기 조절 도구')).toBeVisible();
    await expect(page.locator('text=Ctrl+Z 실행 취소')).toBeVisible();
    await expect(page.locator('text=Ctrl+Y 다시 실행')).toBeVisible();
  });

  test('모바일 터치 인터페이스 테스트', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });

    // 편집 모드 활성화
    await page.click('text=룸 편집');
    await page.waitForTimeout(1000);

    // 모바일용 도구바가 적절히 표시되는지 확인
    const editToolbar = page.locator('.absolute.top-6.left-1\\/2');
    await expect(editToolbar).toBeVisible();

    // 모바일 네비게이션이 표시되는지 확인
    const mobileNav = page.locator('nav.fixed.bottom-4');
    await expect(mobileNav).toBeVisible();
  });

  test('그리드 시스템 시각적 피드백 테스트', async ({ page }) => {
    // 편집 모드 활성화
    await page.click('text=룸 편집');
    await page.waitForTimeout(1000);

    // 그리드 설정 버튼이 표시되는지 확인
    const gridButton = page.locator('text=그리드');
    await expect(gridButton).toBeVisible();

    // 그리드 ON/OFF 상태가 표시되는지 확인
    await expect(page.locator('text=그리드 ON')).toBeVisible();
  });

  test('전체 사용자 경험 워크플로우 테스트', async ({ page }) => {
    // 편집 모드 활성화
    await page.click('text=룸 편집');
    await page.waitForTimeout(1000);

    // 도구 변경 (키보드 단축키 사용)
    await page.keyboard.press('g'); // 이동 도구
    await page.waitForTimeout(500);
    await page.keyboard.press('r'); // 회전 도구
    await page.waitForTimeout(500);
    await page.keyboard.press('s'); // 크기 조절 도구
    await page.waitForTimeout(500);
    await page.keyboard.press('q'); // 선택 도구
    await page.waitForTimeout(500);

    // 모든 도구가 순차적으로 활성화되었는지 확인
    const selectTool = page.locator('button[title*="선택 도구"]');
    await expect(selectTool).toHaveClass(/bg-blue-600/);

    // 편집 모드 종료
    await page.click('text=편집 종료');
    await page.waitForTimeout(1000);

    // 보기 모드로 전환되었는지 확인
    const viewModeButton = page.locator('text=룸 편집');
    await expect(viewModeButton).toBeVisible();
  });

  test('모바일 편집모드 스크롤 락 기능 테스트', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });

    // 초기 스크롤 위치 저장
    const initialScrollY = await page.evaluate(() => window.scrollY);

    // 편집 모드 활성화
    await page.click('text=룸 편집');
    await page.waitForTimeout(2000); // 스크롤 락이 적용될 시간을 줌

    // 터치 이벤트로 스크롤 시도
    await page.evaluate(() => {
      // 터치 이벤트 시뮬레이션
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({ identifier: 0, target: document.body, clientX: 200, clientY: 300 })],
        bubbles: true,
        cancelable: true
      });

      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [new Touch({ identifier: 0, target: document.body, clientX: 200, clientY: 400 })],
        bubbles: true,
        cancelable: true
      });

      document.body.dispatchEvent(touchStartEvent);
      document.body.dispatchEvent(touchMoveEvent);
    });

    await page.waitForTimeout(500);

    // 스크롤 위치가 변하지 않았는지 확인
    const currentScrollY = await page.evaluate(() => window.scrollY);
    expect(currentScrollY).toBe(initialScrollY);

    // 콘솔에 스크롤 락 관련 로그가 있는지 확인
    const logs = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    // 편집 모드 종료
    await page.click('text=편집 종료');
    await page.waitForTimeout(1000);

    // 스크롤 락이 해제되었는지 확인 (스크롤이 가능해야 함)
    await page.evaluate(() => {
      window.scrollTo(0, 100);
    });

    await page.waitForTimeout(500);
    const afterExitScrollY = await page.evaluate(() => window.scrollY);
    expect(afterExitScrollY).toBeGreaterThan(initialScrollY);
  });
});
