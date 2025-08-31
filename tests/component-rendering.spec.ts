import { test, expect } from '@playwright/test';

test('Real3DRoom 컴포넌트 렌더링 확인 테스트', async ({ page }) => {
  // 페이지 로드
  await page.goto('http://localhost:3000');
  
  // 페이지가 로드될 때까지 대기
  await page.waitForLoadState('networkidle');
  
  // 3D 룸 섹션이 존재하는지 확인
  const roomSection = page.locator('section:has-text("3D 미니룸")');
  console.log('3D 룸 섹션 존재:', await roomSection.count() > 0);
  
  // Canvas 요소가 존재하는지 확인
  const canvas = page.locator('canvas');
  console.log('Canvas 요소 존재:', await canvas.count() > 0);
  
  // 편집 모드 진입
  const editButton = page.locator('button:has-text("✏️ 편집 모드")');
  await editButton.click();
  
  // 상태 변경 대기
  await page.waitForTimeout(3000);
  
  // 편집 모드 상태 확인
  const editModeStatus = page.locator('span:has-text("✏️ 편집 모드")');
  console.log('편집 모드 상태:', await editModeStatus.count() > 0 ? '활성화' : '비활성화');
  
  // 페이지의 전체 HTML 구조에서 "EditToolbar" 관련 텍스트 찾기
  const pageContent = await page.content();
  
  // EditToolbar 관련 텍스트들 확인
  const hasSelectButton = pageContent.includes('선택');
  const hasMoveButton = pageContent.includes('이동');
  const hasRotateButton = pageContent.includes('회전');
  const hasScaleButton = pageContent.includes('크기');
  const hasFurnitureButton = pageContent.includes('가구');
  const hasAutoLockButton = pageContent.includes('자동고정');
  
  console.log('EditToolbar 요소들:');
  console.log('- 선택 버튼:', hasSelectButton);
  console.log('- 이동 버튼:', hasMoveButton);
  console.log('- 회전 버튼:', hasRotateButton);
  console.log('- 크기 버튼:', hasScaleButton);
  console.log('- 가구 버튼:', hasFurnitureButton);
  console.log('- 자동고정 버튼:', hasAutoLockButton);
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/component-rendering.png' });
  
  // EditToolbar가 렌더링되었는지 확인
  if (hasSelectButton && hasMoveButton && hasRotateButton && hasScaleButton) {
    console.log('✅ EditToolbar가 정상적으로 렌더링되었습니다.');
  } else {
    console.log('❌ EditToolbar가 렌더링되지 않았습니다.');
  }
});
