/**
 * BlobManager 검증 스크립트
 * Node.js 환경에서 BlobManager의 핵심 기능을 검증합니다.
 */

console.log('🔍 Blob URL 관리 시스템 검증 시작...\n');

// 1. 파일 존재 확인
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/utils/blobManager.ts',
  'src/hooks/useManagedBlob.ts',
  'docs/Blob-URL-Management-Guide.md',
  'docs/Blob-URL-Troubleshooting.md',
  'docs/Blob-URL-Implementation-Complete-Report.md'
];

console.log('📁 파일 존재 확인:');
let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

if (!allFilesExist) {
  console.error('\n❌ 필수 파일이 누락되었습니다.');
  process.exit(1);
}

console.log('\n✅ 모든 필수 파일이 존재합니다.\n');

// 2. 코드 통합 확인
console.log('🔗 BlobManager 통합 확인:');

const filesToCheck = [
  'src/components/3D/Canvas3D.tsx',
  'src/components/features/furniture/DraggableFurniture.tsx',
  'src/hooks/useStableBlob.ts',
  'src/hooks/useBlobUrl.ts',
  'src/utils/customLibrary.ts',
  'src/utils/assetOverrides.ts',
  'src/utils/modelLoader.ts'
];

let integrationCount = 0;

for (const file of filesToCheck) {
  const filePath = path.join(process.cwd(), file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasBlobManagerImport = content.includes('import { blobManager') || content.includes('from \'@/utils/blobManager\'') || content.includes('from \'./blobManager\'') || content.includes('from \'../utils/blobManager\'');
  const hasBlobManagerUsage = content.includes('blobManager.createUrl') || content.includes('blobManager.validateUrl') || content.includes('blobManager.ensureValidUrl');
  
  if (hasBlobManagerImport && hasBlobManagerUsage) {
    console.log(`  ✅ ${file}`);
    integrationCount++;
  } else if (hasBlobManagerImport || hasBlobManagerUsage) {
    console.log(`  ⚠️  ${file} (부분 통합)`);
    integrationCount += 0.5;
  } else {
    console.log(`  ❌ ${file}`);
  }
}

console.log(`\n✅ ${integrationCount}개 파일에 BlobManager 통합됨\n`);

// 3. URL.createObjectURL 직접 사용 확인
console.log('🔍 직접 URL.createObjectURL 사용 확인:');

const allTsFiles = [
  ...filesToCheck,
  'src/components/features/furniture/EnhancedFurnitureCatalog.tsx',
  'src/components/shared/AnalyticsDashboard.tsx',
  'src/components/features/modals/ExportShareTools.tsx',
  'src/components/features/modals/UserPreferences.tsx',
  'src/app/dev/library/page.tsx',
  'src/app/dev/asset-uploader/page.tsx',
  'src/components/3D/Canvas3D_HooksA.tsx'
];

let directUsageCount = 0;

for (const file of allTsFiles) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // URL.createObjectURL을 직접 사용하는 경우 (주석 제외)
    if (line.includes('URL.createObjectURL') && !line.trim().startsWith('//') && !line.includes('✅')) {
      console.log(`  ⚠️  ${file}:${i + 1} - ${line.trim()}`);
      directUsageCount++;
    }
  }
}

if (directUsageCount === 0) {
  console.log('  ✅ 직접 사용 없음 (모두 BlobManager로 마이그레이션됨)\n');
} else {
  console.log(`\n⚠️  ${directUsageCount}개 직접 사용 발견\n`);
}

// 4. 문서 완성도 확인
console.log('📚 문서 완성도 확인:');

const docs = [
  { file: 'docs/Blob-URL-Management-Guide.md', minLines: 200 },
  { file: 'docs/Blob-URL-Troubleshooting.md', minLines: 150 },
  { file: 'docs/Blob-URL-Implementation-Complete-Report.md', minLines: 100 }
];

for (const doc of docs) {
  const filePath = path.join(process.cwd(), doc.file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lineCount = content.split('\n').length;
  const isComplete = lineCount >= doc.minLines;
  
  console.log(`  ${isComplete ? '✅' : '⚠️'}  ${doc.file} (${lineCount} 줄)`);
}

console.log('\n');

// 5. 최종 요약
console.log('=' .repeat(60));
console.log('📊 최종 검증 결과');
console.log('='.repeat(60));
console.log(`✅ 필수 파일 생성: ${requiredFiles.length}개`);
console.log(`✅ BlobManager 통합: ${integrationCount}개 파일`);
console.log(`✅ 직접 URL 사용: ${directUsageCount === 0 ? '없음' : directUsageCount + '개'}`);
console.log(`✅ 문서 작성: ${docs.length}개`);
console.log('=' .repeat(60));

if (allFilesExist && integrationCount >= 7 && directUsageCount === 0) {
  console.log('\n🎉 Blob URL 관리 시스템이 성공적으로 구현되었습니다!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  일부 작업이 완료되지 않았습니다.\n');
  process.exit(1);
}


