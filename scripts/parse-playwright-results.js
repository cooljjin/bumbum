#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Playwright 테스트 결과를 파싱하고 통계를 계산하는 함수
 * @param {string} resultsFilePath - 테스트 결과 JSON 파일 경로
 * @returns {Object} 파싱된 테스트 통계
 */
function parsePlaywrightResults(resultsFilePath) {
  try {
    // 테스트 결과 파일 읽기
    const resultsData = JSON.parse(fs.readFileSync(resultsFilePath, 'utf8'));
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let totalDuration = 0;
    let browserResults = {};
    let testSuites = [];
    
    // 전체 통계
    if (resultsData.stats) {
      totalTests = resultsData.stats.expected || 0;
      passedTests = resultsData.stats.expected - (resultsData.stats.unexpected || 0);
      failedTests = resultsData.stats.unexpected || 0;
      skippedTests = resultsData.stats.skipped || 0;
      totalDuration = resultsData.stats.duration || 0;
    }
    
    // 브라우저별 결과 분석
    if (resultsData.suites) {
      resultsData.suites.forEach(suite => {
        if (suite.specs) {
          suite.specs.forEach(spec => {
            if (spec.tests) {
              spec.tests.forEach(test => {
                if (test.results && test.results.length > 0) {
                  const result = test.results[0];
                  const browserName = test.projectName || 'Unknown';
                  
                  if (!browserResults[browserName]) {
                    browserResults[browserName] = {
                      total: 0,
                      passed: 0,
                      failed: 0,
                      skipped: 0,
                      duration: 0
                    };
                  }
                  
                  browserResults[browserName].total++;
                  browserResults[browserName].duration += result.duration || 0;
                  
                  if (result.status === 'passed') {
                    browserResults[browserName].passed++;
                  } else if (result.status === 'failed') {
                    browserResults[browserName].failed++;
                  } else if (result.status === 'skipped') {
                    browserResults[browserName].skipped++;
                  }
                  
                  // 테스트 스위트 정보 수집
                  testSuites.push({
                    name: suite.title,
                    spec: spec.title,
                    browser: browserName,
                    status: result.status,
                    duration: result.duration,
                    startTime: result.startTime,
                    errors: result.errors || []
                  });
                }
              });
            }
          });
        }
      });
    }
    
    // 성공률 계산
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    // 결과 데이터 구성
    const parsedResults = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
        successRate: successRate,
        totalDuration: Math.round(totalDuration / 1000), // 초 단위로 변환
        startTime: resultsData.stats?.startTime || new Date().toISOString()
      },
      browsers: browserResults,
      testSuites: testSuites,
      lastUpdated: new Date().toISOString()
    };
    
    return parsedResults;
    
  } catch (error) {
    console.error('Playwright 테스트 결과 파싱 중 오류 발생:', error.message);
    return {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        successRate: 0,
        totalDuration: 0,
        startTime: new Date().toISOString()
      },
      browsers: {},
      testSuites: [],
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * 메인 실행 함수
 */
function main() {
  const resultsFilePath = path.join(__dirname, '..', 'test-results', 'results.json');
  const outputPath = path.join(__dirname, '..', 'test-results', 'dashboard-data.json');
  
  console.log('Playwright 테스트 결과 파싱 시작...');
  console.log('입력 파일:', resultsFilePath);
  
  // 파일 존재 여부 확인
  if (!fs.existsSync(resultsFilePath)) {
    console.log('테스트 결과 파일이 존재하지 않습니다. 샘플 데이터를 생성합니다.');
    
    const sampleData = {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        successRate: 0,
        totalDuration: 0,
        startTime: new Date().toISOString()
      },
      browsers: {},
      testSuites: [],
      lastUpdated: new Date().toISOString(),
      note: '테스트 결과 파일이 없습니다. 테스트를 실행해주세요.'
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(sampleData, null, 2));
    console.log('샘플 데이터 생성 완료:', outputPath);
    return;
  }
  
  // 테스트 결과 파싱
  const parsedResults = parsePlaywrightResults(resultsFilePath);
  
  // 결과 출력
  console.log('\n=== 파싱된 테스트 결과 ===');
  console.log(`총 테스트 수: ${parsedResults.summary.total}`);
  console.log(`통과: ${parsedResults.summary.passed}`);
  console.log(`실패: ${parsedResults.summary.failed}`);
  console.log(`스킵: ${parsedResults.summary.skipped}`);
  console.log(`성공률: ${parsedResults.summary.successRate}%`);
  console.log(`총 실행 시간: ${parsedResults.summary.totalDuration}초`);
  
  // 브라우저별 결과 출력
  if (Object.keys(parsedResults.browsers).length > 0) {
    console.log('\n=== 브라우저별 결과 ===');
    Object.entries(parsedResults.browsers).forEach(([browser, stats]) => {
      console.log(`${browser}: ${stats.passed}/${stats.total} 통과 (${Math.round((stats.passed/stats.total)*100)}%)`);
    });
  }
  
  // 대시보드용 JSON 파일 생성
  fs.writeFileSync(outputPath, JSON.stringify(parsedResults, null, 2));
  console.log('\n대시보드 데이터 파일 생성 완료:', outputPath);
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = { parsePlaywrightResults };

