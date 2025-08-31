import { test, expect } from '@playwright/test';

test.describe('페이지 구조 디버깅 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('domcontentloaded');
  });

  test('페이지 구조 분석 및 Real3DRoom 렌더링 확인', async ({ page }) => {
    console.log('=== 페이지 구조 분석 시작 ===');
    
    // 초기 페이지 스크린샷
    await page.screenshot({ path: 'debug-initial-page.png', fullPage: true });
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`페이지 제목: ${title}`);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);
    
    // "🚀 최적화 룸" 버튼 찾기
    const optimizedRoomButton = page.locator('button:has-text("🚀 최적화 룸")');
    const buttonCount = await optimizedRoomButton.count();
    console.log(`"🚀 최적화 룸" 버튼 개수: ${buttonCount}`);
    
    if (buttonCount > 0) {
      const button = optimizedRoomButton.first();
      const isVisible = await button.isVisible();
      console.log(`최적화 룸 버튼 보임: ${isVisible}`);
      
      if (isVisible) {
        // 버튼 클릭 전 상태 확인
        console.log('\n--- 버튼 클릭 전 상태 ---');
        await analyzePageStructure(page);
        
        // 최적화 룸 버튼 클릭
        console.log('\n🚀 최적화 룸 버튼 클릭');
        await button.click();
        
        // 렌더링 대기
        await page.waitForTimeout(3000);
        
        // 클릭 후 스크린샷
        await page.screenshot({ path: 'debug-after-click.png', fullPage: true });
        
        // 클릭 후 상태 확인
        console.log('\n--- 버튼 클릭 후 상태 ---');
        await analyzePageStructure(page);
        
        // Real3DRoom 관련 요소 찾기
        console.log('\n--- Real3DRoom 요소 검색 ---');
        await searchReal3DRoomElements(page);
        
      } else {
        console.log('❌ 최적화 룸 버튼이 보이지 않음');
      }
    } else {
      console.log('❌ "🚀 최적화 룸" 버튼을 찾을 수 없음');
    }
    
    console.log('=== 페이지 구조 분석 완료 ===');
  });
});

// 페이지 구조 분석 함수
async function analyzePageStructure(page: any) {
  console.log('📊 페이지 구조 분석 중...');
  
  // 모든 버튼 찾기
  const allButtons = page.locator('button');
  const buttonCount = await allButtons.count();
  console.log(`전체 버튼 개수: ${buttonCount}`);
  
  // 보이는 버튼들의 텍스트 확인
  for (let i = 0; i < Math.min(buttonCount, 20); i++) {
    try {
      const button = allButtons.nth(i);
      const isVisible = await button.isVisible();
      if (isVisible) {
        const text = await button.textContent();
        console.log(`보이는 버튼 ${i + 1}: "${text?.trim()}"`);
      }
    } catch (error) {
      // 무시
    }
  }
  
  // "시점" 관련 텍스트가 포함된 요소 찾기
  const viewElements = page.locator('*:has-text("시점")');
  const viewElementCount = await viewElements.count();
  console.log(`"시점" 텍스트가 포함된 요소 개수: ${viewElementCount}`);
  
  // "3D", "Room", "Canvas" 관련 요소 찾기
  const roomElements = page.locator('*:has-text("3D"), *:has-text("Room"), *:has-text("Canvas")');
  const roomElementCount = await roomElements.count();
  console.log(`"3D/Room/Canvas" 관련 요소 개수: ${roomElementCount}`);
  
  // 개발 모드 디버그 패널 찾기
  const debugPanel = page.locator('.absolute.bottom-4.left-4');
  const debugVisible = await debugPanel.isVisible();
  console.log(`디버그 패널 보임: ${debugVisible}`);
  
  if (debugVisible) {
    const debugText = await debugPanel.textContent();
    console.log('디버그 패널 내용:', debugText);
  }
}

// Real3DRoom 요소 검색 함수
async function searchReal3DRoomElements(page: any) {
  console.log('🔍 Real3DRoom 요소 검색 중...');
  
  // Canvas 요소 찾기
  const canvasElements = page.locator('canvas');
  const canvasCount = await canvasElements.count();
  console.log(`Canvas 요소 개수: ${canvasCount}`);
  
  // Three.js 관련 요소 찾기
  const threeElements = page.locator('*[data-threejs], *[class*="three"], *[class*="canvas"]');
  const threeCount = await threeElements.count();
  console.log(`Three.js 관련 요소 개수: ${threeCount}`);
  
  // 시점 전환 버튼을 다양한 방법으로 찾기
  const viewToggleSelectors = [
    'button:has-text("🎯 시점 자유")',
    'button:has-text("🔒 시점 고정")',
    'button:has-text("⏳ 전환 중")',
    'button:has-text("시점")',
    '[style*="position: fixed"] button',
    'button[style*="top: 120px"]',
    'button[style*="right: 20px"]'
  ];
  
  for (const selector of viewToggleSelectors) {
    try {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`✅ 선택자 "${selector}"에서 ${count}개 요소 발견`);
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          const isVisible = await element.isVisible();
          const text = await element.textContent();
          console.log(`  - 요소 ${i + 1}: "${text?.trim()}" (보임: ${isVisible})`);
        }
      }
    } catch (error) {
      console.log(`❌ 선택자 "${selector}" 검색 실패:`, error.message);
    }
  }
  
  // 페이지 전체 HTML에서 "시점" 관련 텍스트 검색
  const pageContent = await page.content();
  if (pageContent.includes('시점')) {
    console.log('✅ 페이지 HTML에서 "시점" 텍스트 발견');
    
    // "시점" 텍스트 주변 컨텍스트 확인
    const contextIndex = pageContent.indexOf('시점');
    const contextStart = Math.max(0, contextIndex - 100);
    const contextEnd = Math.min(pageContent.length, contextIndex + 100);
    const context = pageContent.substring(contextStart, contextEnd);
    console.log('시점 텍스트 주변 컨텍스트:', context);
  } else {
    console.log('❌ 페이지 HTML에서 "시점" 텍스트를 찾을 수 없음');
  }
}
