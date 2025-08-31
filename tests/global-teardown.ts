import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Playwright 글로벌 정리 시작...');
  
  // 테스트 결과 정리
  // 임시 파일 삭제 등
  
  console.log('✅ Playwright 글로벌 정리 완료');
}

export default globalTeardown;

