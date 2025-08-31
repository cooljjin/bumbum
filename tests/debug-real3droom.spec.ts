import { test, expect } from '@playwright/test';

test('Real3DRoom 컴포넌트 디버깅', async ({ page }) => {
  // 콘솔 오류 수집
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 페이지 오류 수집
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  // 메인 페이지로 이동
  await page.goto('http://localhost:3005');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 3D 룸 로딩 대기 (최대 10초)
  await page.waitForTimeout(10000);
  
  // 페이지 전체 스크린샷
  await page.screenshot({ 
    path: 'debug-real3droom.png',
    fullPage: true 
  });
  
  // 콘솔 오류 출력
  console.log('콘솔 오류들:', consoleErrors);
  
  // 페이지 오류 출력
  console.log('페이지 오류들:', pageErrors);
  
  // Real3DRoom 컴포넌트가 로드되었는지 확인
  const real3DRoomElements = await page.locator('[data-testid="real3droom"], .real3droom, #real3droom').count();
  console.log('Real3DRoom 컴포넌트 요소 개수:', real3DRoomElements);
  
  // 3D 관련 요소들 확인
  const threeJsElements = await page.locator('canvas, [class*="three"], [class*="Three"]').count();
  console.log('Three.js 관련 요소 개수:', threeJsElements);
  
  // 편집 모드 버튼 클릭 시도
  try {
    await page.click('button:has-text("✏️ 편집 모드")');
    console.log('편집 모드 버튼 클릭 성공');
    
    // 편집 모드 상태 확인
    await page.waitForTimeout(2000);
    const editModeActive = await page.locator('button:has-text("👁️ 뷰 모드")').isVisible();
    console.log('편집 모드 활성화됨:', editModeActive);
    
  } catch (error) {
    console.log('편집 모드 버튼 클릭 실패:', error);
  }
  
  // 페이지 HTML에서 Real3DRoom 관련 내용 확인
  const pageContent = await page.content();
  const hasReal3DRoom = pageContent.includes('Real3DRoom') || pageContent.includes('real3droom');
  console.log('Real3DRoom 관련 HTML 존재:', hasReal3DRoom);
  
  // 3D 로딩 메시지 확인
  const hasLoadingMessage = pageContent.includes('3D 룸을 로딩 중입니다');
  console.log('3D 로딩 메시지 존재:', hasLoadingMessage);
});
