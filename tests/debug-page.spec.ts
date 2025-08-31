import { test, expect } from '@playwright/test';

test('페이지 구조 디버깅', async ({ page }) => {
  // 메인 페이지로 이동
  await page.goto('/');

  // JavaScript가 완전히 로드될 때까지 대기
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  // 추가 대기 시간 (React 컴포넌트 로딩을 위해)
  await page.waitForTimeout(3000);

  console.log('✅ 페이지 로드 완료');

  // 페이지 스크린샷 찍기
  await page.screenshot({ path: 'debug-page-loaded-improved.png' });

  // 모든 버튼 요소 찾기 (더 구체적인 선택자 사용)
  const allButtons = page.locator('button, [role="button"]');
  const buttonCount = await allButtons.count();

  console.log(`📊 발견된 버튼/버튼역할 요소 수: ${buttonCount}`);

  // 각 버튼의 텍스트와 속성 출력
  for (let i = 0; i < buttonCount; i++) {
    const button = allButtons.nth(i);
    const buttonText = await button.textContent();
    const buttonClass = await button.getAttribute('class') || '';
    const buttonDataTestId = await button.getAttribute('data-testid') || '';

    if (buttonText && buttonText.trim()) {
      console.log(`버튼 ${i + 1}: "${buttonText}" | class: "${buttonClass}" | data-testid: "${buttonDataTestId}"`);
    }
  }

  // "편집"이 포함된 모든 요소 찾기
  const editElements = page.locator('*').filter({ hasText: /편집/ });
  const editCount = await editElements.count();

  console.log(`📊 "편집" 포함 요소 수: ${editCount}`);

  for (let i = 0; i < editCount; i++) {
    const element = editElements.nth(i);
    const elementText = await element.textContent();
    const elementTag = await element.evaluate(el => el.tagName);
    const elementClass = await element.getAttribute('class') || '';
    console.log(`편집 요소 ${i + 1}: <${elementTag}> "${elementText}" | class: "${elementClass}"`);
  }

  // data-testid 속성이 있는 요소들 찾기
  const testElements = page.locator('[data-testid]');
  const testCount = await testElements.count();

  console.log(`📊 data-testid 요소 수: ${testCount}`);

  for (let i = 0; i < testCount; i++) {
    const element = testElements.nth(i);
    const testId = await element.getAttribute('data-testid');
    const elementText = await element.textContent();
    const elementTag = await element.evaluate(el => el.tagName);
    console.log(`data-testid ${i + 1}: <${elementTag}> "${testId}" - "${elementText}"`);
  }

  // Canvas 요소 확인
  const canvasElements = page.locator('canvas');
  const canvasCount = await canvasElements.count();

  console.log(`📊 Canvas 요소 수: ${canvasCount}`);

  for (let i = 0; i < canvasCount; i++) {
    const canvas = canvasElements.nth(i);
    const canvasId = await canvas.getAttribute('id') || '';
    const canvasClass = await canvas.getAttribute('class') || '';
    console.log(`Canvas ${i + 1}: id="${canvasId}" class="${canvasClass}"`);
  }

  // 특정 영역 스크린샷
  if (canvasCount > 0) {
    const canvas = canvasElements.first();
    if (await canvas.isVisible()) {
      await canvas.screenshot({ path: 'debug-canvas.png' });
      console.log('✅ Canvas 스크린샷 저장됨');
    }
  }

  // 페이지 제목 확인
  const pageTitle = await page.title();
  console.log(`📄 페이지 제목: "${pageTitle}"`);

  // URL 확인
  const currentUrl = page.url();
  console.log(`🔗 현재 URL: "${currentUrl}"`);

  // 페이지에서 특정 텍스트 검색
  const pageText = await page.textContent();
  const hasMiniRoom = pageText?.includes('미니룸') || false;
  const hasEdit = pageText?.includes('편집') || false;
  const hasFurniture = pageText?.includes('가구') || false;

  console.log(`🔍 페이지 텍스트 분석:
    - "미니룸" 포함: ${hasMiniRoom}
    - "편집" 포함: ${hasEdit}
    - "가구" 포함: ${hasFurniture}`);
});
