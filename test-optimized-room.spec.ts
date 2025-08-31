import { test, expect } from '@playwright/test';

test.describe('최적화 룸 시점 전환 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');
  });

  test('최적화 룸 페이지로 이동 및 시점 전환 테스트', async ({ page }) => {
    console.log('=== 최적화 룸 페이지 테스트 시작 ===');
    
    // 초기 페이지 스크린샷
    await page.screenshot({ path: 'main-page.png', fullPage: true });
    
    // "🚀 최적화 룸" 링크/버튼 찾기
    const optimizedRoomLink = page.locator('*:has-text("🚀 최적화 룸")');
    const linkCount = await optimizedRoomLink.count();
    console.log(`"🚀 최적화 룸" 요소 개수: ${linkCount}`);
    
    if (linkCount > 0) {
      // 첫 번째 요소의 태그와 텍스트 확인
      const firstElement = optimizedRoomLink.first();
      const tagName = await firstElement.evaluate(el => el.tagName.toLowerCase());
      const text = await firstElement.textContent();
      const isVisible = await firstElement.isVisible();
      console.log(`첫 번째 요소: <${tagName}> "${text?.trim()}" - 보임: ${isVisible}`);
      
      if (isVisible) {
        console.log('✅ 최적화 룸 링크 발견 - 클릭 시도');
        
        // 클릭 전 스크린샷
        await page.screenshot({ path: 'before-click-optimized-room.png', fullPage: true });
        
        // 링크 클릭
        await firstElement.click();
        console.log('최적화 룸 링크 클릭 완료');
        
        // 페이지 이동 대기
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        
        // 이동 후 URL 확인
        const currentUrl = page.url();
        console.log(`현재 URL: ${currentUrl}`);
        
        // 이동 후 스크린샷
        await page.screenshot({ path: 'after-click-optimized-room.png', fullPage: true });
        
        // 페이지에서 "시점" 관련 요소 찾기
        const viewElements = page.locator('*:has-text("시점")');
        const viewElementCount = await viewElements.count();
        console.log(`이동 후 "시점" 텍스트가 포함된 요소 개수: ${viewElementCount}`);
        
        if (viewElementCount > 0) {
          // 시점 전환 버튼 찾기
          const viewToggleButton = page.locator('button:has-text("시점 자유"), button:has-text("시점 고정"), button:has-text("전환 중")');
          const buttonCount = await viewToggleButton.count();
          console.log(`시점 전환 관련 버튼 개수: ${buttonCount}`);
          
          if (buttonCount > 0) {
            for (let i = 0; i < buttonCount; i++) {
              try {
                const button = viewToggleButton.nth(i);
                const text = await button.textContent();
                const isVisible = await button.isVisible();
                console.log(`버튼 ${i + 1}: "${text?.trim()}" - 보임: ${isVisible}`);
                
                if (isVisible) {
                  console.log(`✅ 보이는 시점 전환 버튼 발견: "${text?.trim()}"`);
                  
                  // 시점 전환 테스트
                  await testViewTransition(page, button);
                  break;
                }
              } catch (error) {
                console.error(`버튼 ${i + 1} 테스트 중 오류:`, error);
              }
            }
          } else {
            console.log('❌ 시점 전환 관련 버튼을 찾을 수 없음');
          }
        } else {
          console.log('❌ "시점" 관련 텍스트를 찾을 수 없음');
        }
        
      } else {
        console.log('❌ 최적화 룸 링크가 보이지 않음');
      }
    } else {
      console.log('❌ "🚀 최적화 룸" 요소를 찾을 수 없음');
      
      // 페이지의 모든 링크 확인
      const allLinks = page.locator('a, button');
      const totalLinkCount = await allLinks.count();
      console.log(`전체 링크/버튼 개수: ${totalLinkCount}`);
      
      for (let i = 0; i < Math.min(totalLinkCount, 20); i++) {
        try {
          const link = allLinks.nth(i);
          const text = await link.textContent();
          const isVisible = await link.isVisible();
          if (isVisible && text?.includes('룸')) {
            console.log(`룸 관련 링크 ${i + 1}: "${text?.trim()}"`);
          }
        } catch (error) {
          // 무시
        }
      }
    }
    
    console.log('=== 최적화 룸 페이지 테스트 완료 ===');
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
