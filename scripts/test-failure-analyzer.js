#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 테스트 실패 분석 및 알림 클래스
 */
class TestFailureAnalyzer {
  constructor() {
    this.failurePatterns = {
      timeout: /timeout|timed out|time out/i,
      assertion: /expect|assert|failed assertion/i,
      network: /network|connection|fetch|http/i,
      element: /element not found|selector|locator/i,
      browser: /browser|chrome|firefox|safari/i,
      memory: /memory|heap|out of memory/i,
      syntax: /syntax|parse|unexpected token/i,
      dependency: /module not found|import|require/i
    };
    
    this.solutionSuggestions = {
      timeout: [
        '테스트 타임아웃 값을 늘려보세요 (예: test.setTimeout(30000))',
        '네트워크 지연이 있는지 확인하세요',
        '테스트 환경의 성능을 점검하세요'
      ],
      assertion: [
        '테스트 데이터가 예상과 일치하는지 확인하세요',
        '비동기 작업 완료를 기다리는 로직을 추가하세요',
        '테스트 환경의 상태를 점검하세요'
      ],
      network: [
        '네트워크 연결 상태를 확인하세요',
        'API 엔드포인트가 정상 작동하는지 확인하세요',
        '프록시나 방화벽 설정을 점검하세요'
      ],
      element: [
        '페이지 로딩 완료를 기다리는 로직을 추가하세요',
        '요소 선택자가 올바른지 확인하세요',
        '동적 콘텐츠 로딩을 고려하세요'
      ],
      browser: [
        '브라우저 버전 호환성을 확인하세요',
        '브라우저 드라이버를 최신 버전으로 업데이트하세요',
        '브라우저별 특수한 동작을 고려하세요'
      ],
      memory: [
        '테스트 실행 전 메모리 사용량을 점검하세요',
        '불필요한 리소스를 정리하는 로직을 추가하세요',
        '테스트 환경의 메모리 제한을 확인하세요'
      ],
      syntax: [
        '테스트 코드의 문법 오류를 확인하세요',
        'ESLint나 Prettier를 사용하여 코드를 검사하세요',
        'TypeScript 타입 오류를 점검하세요'
      ],
      dependency: [
        '필요한 패키지가 설치되어 있는지 확인하세요',
        'package.json의 의존성 버전을 점검하세요',
        'node_modules를 삭제하고 재설치해보세요'
      ]
    };
  }

  /**
   * 테스트 실패 원인을 분석하는 함수
   * @param {Object} testResult - 테스트 결과 객체
   * @returns {Object} 분석 결과
   */
  analyzeFailure(testResult) {
    const analysis = {
      failureType: 'unknown',
      confidence: 0,
      suggestions: [],
      errorDetails: {},
      severity: 'medium'
    };

    if (!testResult || !testResult.errors || testResult.errors.length === 0) {
      return analysis;
    }

    const errorMessage = testResult.errors[0]?.message || '';
    const errorStack = testResult.errors[0]?.stack || '';
    const fullError = `${errorMessage} ${errorStack}`.toLowerCase();

    // 실패 패턴 매칭
    let bestMatch = { type: 'unknown', score: 0 };
    
    for (const [type, pattern] of Object.entries(this.failurePatterns)) {
      const matches = fullError.match(pattern);
      if (matches) {
        const score = matches.length + (fullError.includes(type) ? 2 : 0);
        if (score > bestMatch.score) {
          bestMatch = { type, score };
        }
      }
    }

    // 분석 결과 설정
    if (bestMatch.type !== 'unknown') {
      analysis.failureType = bestMatch.type;
      analysis.confidence = Math.min(90, bestMatch.score * 20);
      analysis.suggestions = this.solutionSuggestions[bestMatch.type] || [];
      
      // 심각도 결정
      if (['timeout', 'network', 'memory'].includes(bestMatch.type)) {
        analysis.severity = 'high';
      } else if (['assertion', 'element'].includes(bestMatch.type)) {
        analysis.severity = 'medium';
      } else {
        analysis.severity = 'low';
      }
    }

    // 에러 상세 정보
    analysis.errorDetails = {
      message: testResult.errors[0]?.message || '알 수 없는 오류',
      stack: testResult.errors[0]?.stack || '',
      timestamp: testResult.startTime || new Date().toISOString(),
      duration: testResult.duration || 0
    };

    return analysis;
  }

  /**
   * Playwright 테스트 결과에서 실패 분석
   * @param {string} resultsPath - 테스트 결과 파일 경로
   * @returns {Array} 실패 분석 결과 배열
   */
  analyzePlaywrightFailures(resultsPath) {
    try {
      if (!fs.existsSync(resultsPath)) {
        return [];
      }

      const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      const failures = [];

      if (resultsData.suites) {
        resultsData.suites.forEach(suite => {
          if (suite.specs) {
            suite.specs.forEach(spec => {
              if (spec.tests) {
                spec.tests.forEach(test => {
                  if (test.results && test.results.length > 0) {
                    const result = test.results[0];
                    if (result.status === 'failed') {
                      const analysis = this.analyzeFailure(result);
                      failures.push({
                        suite: suite.title,
                        spec: spec.title,
                        test: test.title,
                        browser: test.projectName || 'Unknown',
                        analysis: analysis,
                        timestamp: result.startTime || new Date().toISOString()
                      });
                    }
                  }
                });
              }
            });
          }
        });
      }

      return failures;
    } catch (error) {
      console.error('Playwright 실패 분석 중 오류:', error.message);
      return [];
    }
  }

  /**
   * Jest 테스트 결과에서 실패 분석
   * @param {string} coveragePath - 커버리지 파일 경로
   * @returns {Array} 실패 분석 결과 배열
   */
  analyzeJestFailures(coveragePath) {
    try {
      if (!fs.existsSync(coveragePath)) {
        return [];
      }

      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const failures = [];

      // Jest 커버리지 데이터는 성공/실패 정보를 직접 제공하지 않으므로
      // 커버리지가 낮은 파일들을 문제가 있는 것으로 간주
      Object.entries(coverageData).forEach(([filePath, fileData]) => {
        if (fileData && typeof fileData === 'object') {
          const coverage = this.calculateFileCoverage(fileData);
          if (coverage < 50) { // 50% 미만 커버리지
            failures.push({
              file: filePath,
              coverage: coverage,
              analysis: {
                failureType: 'coverage',
                confidence: 80,
                suggestions: [
                  '테스트 케이스를 추가하여 커버리지를 높이세요',
                  '핵심 비즈니스 로직에 대한 테스트를 우선적으로 작성하세요',
                  '에지 케이스와 예외 상황에 대한 테스트를 추가하세요'
                ],
                severity: 'medium'
              },
              timestamp: new Date().toISOString()
            });
          }
        }
      });

      return failures;
    } catch (error) {
      console.error('Jest 실패 분석 중 오류:', error.message);
      return [];
    }
  }

  /**
   * 파일별 커버리지 계산
   * @param {Object} fileData - 파일 커버리지 데이터
   * @returns {number} 커버리지 퍼센트
   */
  calculateFileCoverage(fileData) {
    let totalStatements = 0;
    let coveredStatements = 0;

    if (fileData.statementMap && fileData.s) {
      totalStatements = Object.keys(fileData.statementMap).length;
      coveredStatements = Object.values(fileData.s).filter(count => count > 0).length;
    }

    return totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0;
  }

  /**
   * 알림 데이터 생성
   * @param {Array} failures - 실패 분석 결과 배열
   * @returns {Object} 알림 데이터
   */
  generateNotificationData(failures) {
    const notificationData = {
      totalFailures: failures.length,
      criticalFailures: failures.filter(f => f.analysis.severity === 'high').length,
      failuresByType: {},
      recentFailures: failures.slice(0, 5), // 최근 5개 실패
      timestamp: new Date().toISOString()
    };

    // 실패 타입별 분류
    failures.forEach(failure => {
      const type = failure.analysis.failureType;
      if (!notificationData.failuresByType[type]) {
        notificationData.failuresByType[type] = 0;
      }
      notificationData.failuresByType[type]++;
    });

    return notificationData;
  }

  /**
   * 알림 데이터를 파일로 저장
   * @param {Object} notificationData - 알림 데이터
   * @param {string} outputPath - 출력 파일 경로
   */
  saveNotificationData(notificationData, outputPath = 'test-results/failure-notifications.json') {
    try {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(notificationData, null, 2));
      console.log(`✅ 알림 데이터가 ${outputPath}에 저장되었습니다.`);
    } catch (error) {
      console.error('알림 데이터 저장 중 오류:', error.message);
    }
  }

    /**
   * 메인 실행 함수
   */
  async main() {
    const resultsPath = path.join(__dirname, '..', 'test-results', 'results.json');
    const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-final.json');
    const outputPath = path.join(__dirname, '..', 'test-results', 'failure-notifications.json');

    console.log('🔍 테스트 실패 분석 시작...');

    // Playwright 실패 분석
    const playwrightFailures = this.analyzePlaywrightFailures(resultsPath);
    console.log(`📊 Playwright 실패 분석 완료: ${playwrightFailures.length}개 실패 발견`);

    // Jest 실패 분석
    const jestFailures = this.analyzeJestFailures(coveragePath);
    console.log(`📊 Jest 실패 분석 완료: ${jestFailures.length}개 문제 발견`);

    // 전체 실패 통합
    const allFailures = [...playwrightFailures, ...jestFailures];
    
    if (allFailures.length > 0) {
      console.log('\n🚨 발견된 문제들:');
      allFailures.forEach((failure, index) => {
        console.log(`\n${index + 1}. ${failure.suite || failure.file || 'Unknown'}`);
        console.log(`   타입: ${failure.analysis.failureType}`);
        console.log(`   심각도: ${failure.analysis.severity}`);
        console.log(`   신뢰도: ${failure.analysis.confidence}%`);
        if (failure.analysis.suggestions.length > 0) {
          console.log(`   해결 방안: ${failure.analysis.suggestions[0]}`);
        }
      });
    } else {
      console.log('✅ 모든 테스트가 정상적으로 통과했습니다!');
    }

    // 알림 데이터 생성 및 저장
    const notificationData = this.generateNotificationData(allFailures);
    this.saveNotificationData(notificationData, outputPath);

    console.log('\n🎉 테스트 실패 분석이 완료되었습니다!');
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  const analyzer = new TestFailureAnalyzer();
  analyzer.main().catch(error => {
    console.error('테스트 실패 분석 중 오류:', error);
    process.exit(1);
  });
}

module.exports = TestFailureAnalyzer;
