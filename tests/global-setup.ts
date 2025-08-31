import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 테스트 환경 초기화
  console.log('🧪 Playwright 글로벌 설정 시작...');
  
  // 브라우저 종료
  await browser.close();
  
  console.log('✅ Playwright 글로벌 설정 완료');
}

export default globalSetup;

