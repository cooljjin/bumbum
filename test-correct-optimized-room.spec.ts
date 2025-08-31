import { test, expect } from '@playwright/test';

test.describe('올바른 최적화 룸 시점 전환 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('domcontentloaded');
  });

  test('최적화 룸 활성화 및 시점 전환 테스트', async ({ page }) => {
    console.log('=== 올바른 최적화 룸 테스트 시작 ===');
    
    // 초기 페이지 스크린샷
    await page.screenshot({ path: 'initial-main-page.png', fullPage: true });
    
    // "🚀 최적화 룸" 버튼 찾기 (메인 페이지의 토글 버튼)
    const optimizedRoomButton = page.locator('button:has-text("🚀 최적화 룸")');
    await expect(optimizedRoomButton).toBeVisible();
    
    console.log('✅ 최적화 룸 버튼 발견');
    
    // 최적화 룸 버튼 클릭
    await optimizedRoomButton.click();
    console.log('🚀 최적화 룸 버튼 클릭 완료');
    
    // Real3DRoom 컴포넌트 렌더링 대기
    await page.waitForTimeout(2000);
    
    // 클릭 후 스크린샷
    await page.screenshot({ path: 'after-optimized-room-click.png', fullPage: true });
    
    // 이제 Real3DRoom 컴포넌트 내부의 시점 전환 버튼 찾기
    const viewToggleButton = page.locator('button:has-text("🎯 시점 자유"), button:has-text("🔒 시점 고정"), button:has-text("⏳ 전환 중")');
    await expect(viewToggleButton).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Real3DRoom 내부 시점 전환 버튼 발견');
    
    // 디버그 패널 확인
    try {
      const debugPanel = page.locator('.absolute.bottom-4.left-4');
      if (await debugPanel.isVisible()) {
        const debugText = await debugPanel.textContent();
        console.log('디버그 패널 상태:', debugText);
      } else {
        console.log('❌ 디버그 패널이 보이지 않음');
      }
    } catch (error) {
      console.log('디버그 패널을 찾을 수 없음');
    }
    
    // 시점 전환 테스트 실행
    await testViewTransition(page, viewToggleButton);
    
    console.log('=== 올바른 최적화 룸 테스트 완료 ===');
  });
});

// 시점 전환 테스트 함수
async function testViewTransition(page: any, button: any) {
  console.log('\n=== 시점 전환 테스트 시작 ===');
  
  // 초기 상태 확인
  let buttonText = await button.textContent();
  console.log(`초기 버튼 상태: ${buttonText?.trim()}`);
  
  // 디버그 패널에서 초기 상태 확인
  try {
    const debugPanel = page.locator('.absolute.bottom-4.left-4');
    if (await debugPanel.isVisible()) {
      const debugText = await debugPanel.textContent();
      console.log('디버그 패널 초기 상태:', debugText);
    }
  } catch (error) {
    console.log('디버그 패널을 찾을 수 없음');
  }
  
  // 버튼 클릭
  await button.click();
  console.log('시점 전환 버튼 클릭 완료');
  
  // 클릭 직후 상태 확인
  await page.waitForTimeout(100);
  buttonText = await button.textContent();
  console.log(`클릭 직후 버튼 상태: ${buttonText?.trim()}`);
  
  // 클릭 직후 디버그 패널 상태 확인
  try {
    const debugPanel = page.locator('.absolute.bottom-4.left-4');
    if (await debugPanel.isVisible()) {
      const debugText = await debugPanel.textContent();
      console.log('클릭 직후 디버그 패널 상태:', debugText);
    }
  } catch (error) {
    console.log('디버그 패널을 찾을 수 없음');
  }
  
  // 애니메이션 중 상태 확인
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(200);
    buttonText = await button.textContent();
    console.log(`애니메이션 ${i + 1}/10: ${buttonText?.trim()}`);
    
    // 디버그 패널 상태도 확인
    try {
      const debugPanel = page.locator('.absolute.bottom-4.left-4');
      if (await debugPanel.isVisible()) {
        const debugText = await debugPanel.textContent();
        if (debugText?.includes('애니메이션: 진행 중')) {
          console.log('✅ 디버그 패널에서 애니메이션 진행 중 상태 발견!');
        }
      }
    } catch (error) {
      // 무시
    }
    
    if (buttonText?.includes('전환 중')) {
      console.log('✅ "전환 중" 텍스트 발견!');
      break;
    }
  }
  
  // 애니메이션 완료까지 대기
  await page.waitForTimeout(3000);
  
  // 최종 상태 확인
  buttonText = await button.textContent();
  console.log(`최종 버튼 상태: ${buttonText?.trim()}`);
  
  // 최종 디버그 패널 상태 확인
  try {
    const debugPanel = page.locator('.absolute.bottom-4.left-4');
    if (await debugPanel.isVisible()) {
      const debugText = await debugPanel.textContent();
      console.log('최종 디버그 패널 상태:', debugText);
    }
  } catch (error) {
    console.log('디버그 패널을 찾을 수 없음');
  }
  
  // 스크린샷 촬영
  await page.screenshot({ path: 'view-transition-complete.png', fullPage: true });
  
  console.log('=== 시점 전환 테스트 완료 ===');
}
