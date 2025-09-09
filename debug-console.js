const { chromium } = require('playwright');

async function debugConsole() {
  console.log('🔍 브라우저 콘솔 디버깅 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--remote-debugging-port=9223']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    console.log(`📝 CONSOLE [${msg.type()}]:`, msg.text());
  });
  
  // 페이지 로드 이벤트
  page.on('load', () => {
    console.log('✅ 페이지 로드 완료');
  });
  
  // JavaScript 오류 캡처
  page.on('pageerror', error => {
    console.log('❌ JavaScript 오류:', error.message);
  });
  
  console.log('🌐 http://localhost:3002 접속 중...');
  await page.goto('http://localhost:3002');
  
  // 페이지 로드 대기
  await page.waitForTimeout(3000);
  
  // 현재 편집 모드 상태 확인
  const editModeButton = await page.locator('[title*="편집"]').first();
  if (await editModeButton.count() > 0) {
    const title = await editModeButton.getAttribute('title');
    console.log('🎯 편집 모드 버튼 발견:', title);
  } else {
    console.log('❌ 편집 모드 버튼을 찾을 수 없음');
  }
  
  // 가구 요소들 확인
  const furnitureElements = await page.locator('[class*="furniture"], [class*="Draggable"]').all();
  console.log(`🏠 가구 요소 ${furnitureElements.length}개 발견`);
  
  // 초기 가구 배치 로그 확인을 위한 대기
  console.log('⏳ 3초 대기 (초기 가구 배치 로그 확인용)...');
  await page.waitForTimeout(3000);
  
  // 현재 페이지 콘솔 로그 확인
  console.log('📊 현재 페이지 상태 확인...');
  
  // 가구 선택 및 드래그 시도
  if (furnitureElements.length > 0) {
    console.log('🖱️ 첫 번째 가구 클릭 시도...');
    try {
      await furnitureElements[0].click();
      console.log('✅ 가구 클릭 성공');
      await page.waitForTimeout(1000);
    } catch (error) {
      console.log('❌ 가구 클릭 실패:', error.message);
    }
  }
  
  // 10초간 대기하여 로그 확인
  console.log('⏳ 10초간 로그 모니터링 중...');
  await page.waitForTimeout(10000);
  
  console.log('🎯 디버깅 완료');
  await browser.close();
}

debugConsole().catch(console.error);
