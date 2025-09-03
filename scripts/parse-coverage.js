#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Jest 커버리지 데이터를 파싱하고 통계를 계산하는 함수
 * @param {string} coverageFilePath - 커버리지 JSON 파일 경로
 * @returns {Object} 파싱된 커버리지 통계
 */
function parseJestCoverage(coverageFilePath) {
  try {
    // 커버리지 파일 읽기
    const coverageData = JSON.parse(fs.readFileSync(coverageFilePath, 'utf8'));
    
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;
    
    // 각 파일의 커버리지 데이터 분석
    Object.values(coverageData).forEach(fileData => {
      if (fileData && typeof fileData === 'object') {
        // Statements 커버리지 계산
        if (fileData.statementMap && fileData.s) {
          totalStatements += Object.keys(fileData.statementMap).length;
          coveredStatements += Object.values(fileData.s).filter(count => count > 0).length;
        }
        
        // Branches 커버리지 계산
        if (fileData.branchMap && fileData.b) {
          totalBranches += Object.keys(fileData.branchMap).length;
          coveredBranches += Object.values(fileData.b).filter(branches => 
            branches.some(count => count > 0)
          ).length;
        }
        
        // Functions 커버리지 계산
        if (fileData.fnMap && fileData.f) {
          totalFunctions += Object.keys(fileData.fnMap).length;
          coveredFunctions += Object.values(fileData.f).filter(count => count > 0).length;
        }
        
        // Lines 커버리지 계산 (statements와 동일)
        if (fileData.statementMap && fileData.s) {
          totalLines += Object.keys(fileData.statementMap).length;
          coveredLines += Object.values(fileData.s).filter(count => count > 0).length;
        }
      }
    });
    
    // 퍼센트 계산
    const statementsCoverage = totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0;
    const branchesCoverage = totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0;
    const functionsCoverage = totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0;
    const linesCoverage = totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0;
    
    // 전체 평균 커버리지 계산
    const overallCoverage = Math.round((statementsCoverage + branchesCoverage + functionsCoverage + linesCoverage) / 4);
    
    return {
      statements: statementsCoverage,
      branches: branchesCoverage,
      functions: functionsCoverage,
      lines: linesCoverage,
      overall: overallCoverage,
      details: {
        statements: { total: totalStatements, covered: coveredStatements },
        branches: { total: totalBranches, covered: coveredBranches },
        functions: { total: totalFunctions, covered: coveredFunctions },
        lines: { total: totalLines, covered: coveredLines }
      },
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: Object.keys(coverageData).length,
        coverageLevel: getCoverageLevel(overallCoverage)
      }
    };
  } catch (error) {
    console.error('커버리지 파일 파싱 중 오류 발생:', error.message);
    return {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
      overall: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 커버리지 수준을 평가하는 함수
 * @param {number} coverage - 커버리지 퍼센트
 * @returns {string} 커버리지 수준
 */
function getCoverageLevel(coverage) {
  if (coverage >= 90) return 'excellent';
  if (coverage >= 80) return 'good';
  if (coverage >= 70) return 'fair';
  if (coverage >= 60) return 'poor';
  return 'critical';
}

/**
 * 커버리지 데이터를 HTML 대시보드용 JSON으로 저장하는 함수
 * @param {Object} coverageData - 파싱된 커버리지 데이터
 * @param {string} outputPath - 출력 파일 경로
 */
function saveCoverageForDashboard(coverageData, outputPath = 'coverage/dashboard-data.json') {
  try {
    // 출력 디렉토리 생성
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 대시보드용 데이터 저장
    fs.writeFileSync(outputPath, JSON.stringify(coverageData, null, 2));
    console.log(`✅ 커버리지 데이터가 ${outputPath}에 저장되었습니다.`);
    
    // 간단한 통계 출력
    console.log('\n📊 커버리지 요약:');
    console.log(`📝 Statements: ${coverageData.statements}%`);
    console.log(`🌿 Branches: ${coverageData.branches}%`);
    console.log(`⚙️ Functions: ${coverageData.functions}%`);
    console.log(`📄 Lines: ${coverageData.lines}%`);
    console.log(`🎯 Overall: ${coverageData.overall}% (${coverageData.summary?.coverageLevel || 'unknown'})`);
    
  } catch (error) {
    console.error('커버리지 데이터 저장 중 오류 발생:', error.message);
  }
}

/**
 * 메인 실행 함수
 */
function main() {
  const coverageFilePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');
  
  // 커버리지 파일 존재 확인
  if (!fs.existsSync(coverageFilePath)) {
    console.error('❌ 커버리지 파일을 찾을 수 없습니다:', coverageFilePath);
    console.log('💡 Jest 테스트를 실행한 후 다시 시도해주세요: npm run test:coverage');
    process.exit(1);
  }
  
  console.log('🔍 Jest 커버리지 데이터 파싱 중...');
  
  // 커버리지 데이터 파싱
  const coverageData = parseJestCoverage(coverageFilePath);
  
  if (coverageData.error) {
    console.error('❌ 커버리지 파싱 실패:', coverageData.error);
    process.exit(1);
  }
  
  // 대시보드용 데이터 저장
  saveCoverageForDashboard(coverageData);
  
  console.log('\n🎉 커버리지 파싱이 완료되었습니다!');
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = {
  parseJestCoverage,
  getCoverageLevel,
  saveCoverageForDashboard
};
