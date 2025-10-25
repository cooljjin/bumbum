#!/usr/bin/env node

/**
 * 개발 환경 캐시 정리 스크립트
 * Stable Dev Env Setup 가이드 적용
 * 
 * 실행 방법:
 * npm run clean:cache
 * 또는
 * node scripts/clean-cache.js
 */

const fs = require('fs');
const path = require('path');

// 삭제할 캐시 디렉토리 목록
const cacheDirectories = [
  '.next',
  'node_modules/.cache',
  '.turbo',
  'out',
];

console.log('🧹 캐시 정리 시작...\n');

let deletedCount = 0;
let skippedCount = 0;

cacheDirectories.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  
  if (fs.existsSync(fullPath)) {
    try {
      // 재귀적으로 디렉토리 삭제
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ 삭제 완료: ${dir}`);
      deletedCount++;
    } catch (error) {
      console.error(`❌ 삭제 실패: ${dir}`, error.message);
    }
  } else {
    console.log(`⏭️  건너뛰기: ${dir} (존재하지 않음)`);
    skippedCount++;
  }
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🎉 캐시 정리 완료!`);
console.log(`   삭제: ${deletedCount}개`);
console.log(`   건너뛰기: ${skippedCount}개`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('💡 다음 명령어로 개발 서버를 시작하세요:');
console.log('   npm run dev\n');



