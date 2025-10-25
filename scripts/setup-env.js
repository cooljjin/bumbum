#!/usr/bin/env node

/**
 * .env.local 파일 자동 생성 스크립트
 * Stable Dev Env Setup 가이드 적용
 * 
 * 실행 방법:
 * npm run setup:env
 * 또는
 * node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = `# ========================================
# Bumbum 프로젝트 환경 변수 설정
# Stable Dev Env Setup 가이드 적용
# ========================================

# ✅ SSR 비활성화 모드 (Canvas 렌더 오류 방지)
# React Three Fiber (R3F)와 Next.js App Router 조합에서 발생하는 SSR 문제 해결
NEXT_PUBLIC_SSR_DISABLED=true

# ✅ Blob URL 자동 revoke 비활성화 (개발용)
# 개발 환경에서 Blob URL이 조기에 해제되어 Canvas가 사라지는 문제 방지
NEXT_PUBLIC_BLOB_REVOKE_SAFE_MODE=true

# ✅ HMR 관련 안정화 옵션
# Hot Module Replacement가 파일 변경을 제대로 감지하도록 polling 활성화
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
NEXT_DISABLE_HMR_CACHE=1

# ✅ 캐시 무효화 방지 (렌더 반복 방지)
# 개발 환경 명시
NODE_ENV=development
`;

async function createEnvFile() {
  console.log('🔧 .env.local 파일 설정 시작...\n');

  // 이미 파일이 존재하는지 확인
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local 파일이 이미 존재합니다.');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('덮어쓰시겠습니까? (y/N): ', (ans) => {
        rl.close();
        resolve(ans.toLowerCase());
      });
    });

    if (answer !== 'y' && answer !== 'yes') {
      console.log('\n❌ 작업이 취소되었습니다.');
      console.log('💡 기존 .env.local 파일을 유지합니다.\n');
      return;
    }

    console.log('');
  }

  try {
    // 파일 생성
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ .env.local 파일이 생성되었습니다!\n');
    console.log('📝 생성된 환경 변수:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   ✓ NEXT_PUBLIC_SSR_DISABLED=true');
    console.log('   ✓ NEXT_PUBLIC_BLOB_REVOKE_SAFE_MODE=true');
    console.log('   ✓ CHOKIDAR_USEPOLLING=true');
    console.log('   ✓ WATCHPACK_POLLING=true');
    console.log('   ✓ NEXT_DISABLE_HMR_CACHE=1');
    console.log('   ✓ NODE_ENV=development');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🚀 다음 단계:');
    console.log('   1. npm run clean:cache  (캐시 정리)');
    console.log('   2. npm run dev          (개발 서버 시작)');
    console.log('\n   또는 한 번에:');
    console.log('   npm run clean:dev\n');
  } catch (error) {
    console.error('❌ .env.local 파일 생성 실패:', error.message);
    console.error('\n💡 수동으로 생성하세요:');
    console.error('   1. 프로젝트 루트에 .env.local 파일 생성');
    console.error('   2. docs/stable-dev-env-applied.md 참고\n');
  }
}

// 실행
createEnvFile();



