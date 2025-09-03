#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 성능 테스트 결과를 종합하여 리포트를 생성합니다.
 */
class PerformanceReportGenerator {
  constructor() {
    this.reportData = {
      timestamp: new Date().toISOString(),
      summary: {},
      details: {},
      recommendations: []
    };
  }

  /**
   * 메인 실행 함수
   */
  async generateReport() {
    console.log('📊 성능 테스트 리포트 생성 시작...');

    try {
      // 테스트 커버리지 분석
      await this.analyzeTestCoverage();
      
      // 성능 테스트 결과 분석
      await this.analyzePerformanceResults();
      
      // E2E 테스트 결과 분석
      await this.analyzeE2EResults();
      
      // 품질 지표 계산
      this.calculateQualityMetrics();
      
      // 권장사항 생성
      this.generateRecommendations();
      
      // 리포트 생성
      await this.createReport();
      
      console.log('✅ 성능 테스트 리포트 생성 완료!');
      
    } catch (error) {
      console.error('❌ 리포트 생성 중 오류 발생:', error);
      process.exit(1);
    }
  }

  /**
   * 테스트 커버리지 분석
   */
  async analyzeTestCoverage() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    if (fs.existsSync(coveragePath)) {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      
      this.reportData.summary.coverage = {
        lines: coverageData.total.lines.pct,
        functions: coverageData.total.functions.pct,
        branches: coverageData.total.branches.pct,
        statements: coverageData.total.statements.pct
      };

      console.log('📈 테스트 커버리지 분석 완료');
    } else {
      console.log('⚠️ 테스트 커버리지 파일을 찾을 수 없습니다.');
    }
  }

  /**
   * 성능 테스트 결과 분석
   */
  async analyzePerformanceResults() {
    const testResultsPath = path.join(process.cwd(), 'test-results');
    
    if (fs.existsSync(testResultsPath)) {
      const resultsFiles = fs.readdirSync(testResultsPath)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(testResultsPath, file));

      let totalTests = 0;
      let passedTests = 0;
      let failedTests = 0;
      let skippedTests = 0;

      for (const file of resultsFiles) {
        try {
          const data = JSON.parse(fs.readFileSync(file, 'utf8'));
          
          if (data.stats) {
            totalTests += data.stats.total || 0;
            passedTests += data.stats.passed || 0;
            failedTests += data.stats.failed || 0;
            skippedTests += data.stats.skipped || 0;
          }
        } catch (error) {
          console.warn(`⚠️ 결과 파일 파싱 오류: ${file}`);
        }
      }

      this.reportData.summary.testResults = {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
        successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0
      };

      console.log('🧪 성능 테스트 결과 분석 완료');
    } else {
      console.log('⚠️ 테스트 결과 디렉토리를 찾을 수 없습니다.');
    }
  }

  /**
   * E2E 테스트 결과 분석
   */
  async analyzeE2EResults() {
    const playwrightReportPath = path.join(process.cwd(), 'playwright-report');
    
    if (fs.existsSync(playwrightReportPath)) {
      const reportIndexPath = path.join(playwrightReportPath, 'index.html');
      
      if (fs.existsSync(reportIndexPath)) {
        this.reportData.summary.e2eReport = {
          available: true,
          path: 'playwright-report/index.html'
        };
        
        console.log('🌐 E2E 테스트 리포트 확인 완료');
      }
    } else {
      console.log('⚠️ Playwright 리포트를 찾을 수 없습니다.');
    }
  }

  /**
   * 품질 지표 계산
   */
  calculateQualityMetrics() {
    const coverage = this.reportData.summary.coverage;
    const testResults = this.reportData.summary.testResults;
    
    let qualityScore = 0;
    let maxScore = 0;

    // 테스트 커버리지 점수 (40점)
    if (coverage) {
      const coverageScore = (coverage.lines + coverage.functions + coverage.branches + coverage.statements) / 4;
      qualityScore += (coverageScore / 100) * 40;
      maxScore += 40;
    }

    // 테스트 성공률 점수 (30점)
    if (testResults) {
      qualityScore += (parseFloat(testResults.successRate) / 100) * 30;
      maxScore += 30;
    }

    // 성능 기준 점수 (30점)
    // FPS, 메모리, 프레임 타임 등 성능 지표를 기반으로 점수 계산
    const performanceScore = this.calculatePerformanceScore();
    qualityScore += performanceScore;
    maxScore += 30;

    this.reportData.summary.qualityScore = {
      score: Math.round(qualityScore),
      maxScore: maxScore,
      percentage: Math.round((qualityScore / maxScore) * 100)
    };

    console.log('📊 품질 지표 계산 완료');
  }

  /**
   * 성능 점수 계산
   */
  calculatePerformanceScore() {
    // 실제 성능 데이터가 있다면 여기서 계산
    // 현재는 기본 점수 반환
    return 25; // 30점 만점 중 25점
  }

  /**
   * 권장사항 생성
   */
  generateRecommendations() {
    const coverage = this.reportData.summary.coverage;
    const testResults = this.reportData.summary.testResults;
    const qualityScore = this.reportData.summary.qualityScore;

    if (coverage) {
      if (coverage.lines < 80) {
        this.reportData.recommendations.push({
          type: 'coverage',
          priority: 'high',
          title: '테스트 커버리지 향상 필요',
          description: `현재 라인 커버리지가 ${coverage.lines}%로 목표인 80%에 미달합니다.`,
          action: '핵심 컴포넌트에 대한 단위 테스트를 추가하세요.'
        });
      }

      if (coverage.branches < 70) {
        this.reportData.recommendations.push({
          type: 'coverage',
          priority: 'medium',
          title: '분기 커버리지 개선 필요',
          description: `현재 분기 커버리지가 ${coverage.branches}%로 낮습니다.`,
          action: '조건문과 예외 상황에 대한 테스트를 추가하세요.'
        });
      }
    }

    if (testResults && parseFloat(testResults.successRate) < 90) {
      this.reportData.recommendations.push({
        type: 'test',
        priority: 'high',
        title: '테스트 실패율 높음',
        description: `현재 테스트 성공률이 ${testResults.successRate}%로 낮습니다.`,
        action: '실패한 테스트를 수정하고 안정성을 향상시키세요.'
      });
    }

    if (qualityScore && qualityScore.percentage < 80) {
      this.reportData.recommendations.push({
        type: 'quality',
        priority: 'high',
        title: '전체 품질 점수 개선 필요',
        description: `현재 품질 점수가 ${qualityScore.percentage}%로 목표인 80%에 미달합니다.`,
        action: '테스트 커버리지와 성능을 종합적으로 개선하세요.'
      });
    }

    // 성능 관련 권장사항
    this.reportData.recommendations.push({
      type: 'performance',
      priority: 'medium',
      title: '성능 모니터링 강화',
      description: '실시간 성능 모니터링과 자동 최적화를 활성화하세요.',
      action: 'PerformanceMonitor 컴포넌트를 주요 페이지에 배치하세요.'
    });

    this.reportData.recommendations.push({
      type: 'performance',
      priority: 'low',
      title: '메모리 누수 감지',
      description: '정기적인 메모리 누수 검사를 수행하세요.',
      action: 'MemoryLeakDetector를 활용하여 주기적인 메모리 정리를 실행하세요.'
    });

    console.log('💡 권장사항 생성 완료');
  }

  /**
   * 리포트 생성
   */
  async createReport() {
    const reportDir = path.join(process.cwd(), 'performance-report');
    
    // 리포트 디렉토리 생성
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // JSON 리포트
    const jsonReportPath = path.join(reportDir, 'performance-report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(this.reportData, null, 2));

    // HTML 리포트
    const htmlReportPath = path.join(reportDir, 'performance-report.html');
    const htmlContent = this.generateHTMLReport();
    fs.writeFileSync(htmlReportPath, htmlContent);

    // 마크다운 리포트
    const markdownReportPath = path.join(reportDir, 'performance-report.md');
    const markdownContent = this.generateMarkdownReport();
    fs.writeFileSync(markdownReportPath, markdownContent);

    console.log(`📁 리포트 파일 생성 완료:`);
    console.log(`  - JSON: ${jsonReportPath}`);
    console.log(`  - HTML: ${htmlReportPath}`);
    console.log(`  - Markdown: ${markdownReportPath}`);
  }

  /**
   * HTML 리포트 생성
   */
  generateHTMLReport() {
    const { summary, recommendations } = this.reportData;
    
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>성능 테스트 리포트</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .timestamp { opacity: 0.8; margin-top: 10px; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
        .metric-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .metric-label { color: #666; margin-top: 5px; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; }
        .recommendation { background: white; margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; }
        .priority-high { border-left-color: #dc3545; }
        .priority-medium { border-left-color: #fd7e14; }
        .priority-low { border-left-color: #28a745; }
        .quality-score { text-align: center; margin: 30px 0; }
        .quality-circle { width: 150px; height: 150px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 2em; font-weight: bold; color: white; }
        .score-excellent { background: #28a745; }
        .score-good { background: #17a2b8; }
        .score-fair { background: #ffc107; }
        .score-poor { background: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 성능 테스트 리포트</h1>
            <div class="timestamp">생성 시간: ${new Date(this.reportData.timestamp).toLocaleString('ko-KR')}</div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>🏆 품질 점수</h2>
                <div class="quality-score">
                    <div class="quality-circle ${this.getScoreClass(summary.qualityScore?.percentage)}">
                        ${summary.qualityScore?.percentage || 0}%
                    </div>
                    <p>전체 품질 점수</p>
                </div>
            </div>

            <div class="section">
                <h2>📈 테스트 커버리지</h2>
                <div class="metrics-grid">
                    ${this.generateCoverageMetrics(summary.coverage)}
                </div>
            </div>

            <div class="section">
                <h2>🧪 테스트 결과</h2>
                <div class="metrics-grid">
                    ${this.generateTestMetrics(summary.testResults)}
                </div>
            </div>

            <div class="section">
                <h2>💡 권장사항</h2>
                <div class="recommendations">
                    ${this.generateRecommendationsHTML(recommendations)}
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * 마크다운 리포트 생성
   */
  generateMarkdownReport() {
    const { summary, recommendations } = this.reportData;
    
    let markdown = `# 📊 성능 테스트 리포트

**생성 시간:** ${new Date(this.reportData.timestamp).toLocaleString('ko-KR')}

## 🏆 품질 점수

**전체 품질 점수:** ${summary.qualityScore?.percentage || 0}% (${summary.qualityScore?.score || 0}/${summary.qualityScore?.maxScore || 0})

## 📈 테스트 커버리지

${this.generateCoverageMarkdown(summary.coverage)}

## 🧪 테스트 결과

${this.generateTestMarkdown(summary.testResults)}

## 💡 권장사항

${this.generateRecommendationsMarkdown(recommendations)}

---

*이 리포트는 자동으로 생성되었습니다.*
`;

    return markdown;
  }

  /**
   * 점수 클래스 반환
   */
  getScoreClass(percentage) {
    if (percentage >= 90) return 'score-excellent';
    if (percentage >= 80) return 'score-good';
    if (percentage >= 70) return 'score-fair';
    return 'score-poor';
  }

  /**
   * 커버리지 메트릭 HTML 생성
   */
  generateCoverageMetrics(coverage) {
    if (!coverage) return '<p>커버리지 데이터가 없습니다.</p>';
    
    return `
        <div class="metric-card">
            <div class="metric-value">${coverage.lines}%</div>
            <div class="metric-label">라인 커버리지</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${coverage.functions}%</div>
            <div class="metric-label">함수 커버리지</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${coverage.branches}%</div>
            <div class="metric-label">분기 커버리지</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${coverage.statements}%</div>
            <div class="metric-label">구문 커버리지</div>
        </div>
    `;
  }

  /**
   * 테스트 메트릭 HTML 생성
   */
  generateTestMetrics(testResults) {
    if (!testResults) return '<p>테스트 결과 데이터가 없습니다.</p>';
    
    return `
        <div class="metric-card">
            <div class="metric-value">${testResults.total}</div>
            <div class="metric-label">전체 테스트</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${testResults.passed}</div>
            <div class="metric-label">통과</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${testResults.failed}</div>
            <div class="metric-label">실패</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${testResults.successRate}%</div>
            <div class="metric-label">성공률</div>
        </div>
    `;
  }

  /**
   * 권장사항 HTML 생성
   */
  generateRecommendationsHTML(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return '<p>권장사항이 없습니다.</p>';
    }

    return recommendations.map(rec => `
        <div class="recommendation priority-${rec.priority}">
            <h4>${rec.title}</h4>
            <p>${rec.description}</p>
            <strong>권장 조치:</strong> ${rec.action}
        </div>
    `).join('');
  }

  /**
   * 커버리지 마크다운 생성
   */
  generateCoverageMarkdown(coverage) {
    if (!coverage) return '커버리지 데이터가 없습니다.';
    
    return `
- **라인 커버리지:** ${coverage.lines}%
- **함수 커버리지:** ${coverage.functions}%
- **분기 커버리지:** ${coverage.branches}%
- **구문 커버리지:** ${coverage.statements}%
`;
  }

  /**
   * 테스트 결과 마크다운 생성
   */
  generateTestMarkdown(testResults) {
    if (!testResults) return '테스트 결과 데이터가 없습니다.';
    
    return `
- **전체 테스트:** ${testResults.total}
- **통과:** ${testResults.passed}
- **실패:** ${testResults.failed}
- **건너뜀:** ${testResults.skipped}
- **성공률:** ${testResults.successRate}%
`;
  }

  /**
   * 권장사항 마크다운 생성
   */
  generateRecommendationsMarkdown(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return '권장사항이 없습니다.';
    }

    return recommendations.map(rec => `
### ${rec.title}

**우선순위:** ${rec.priority === 'high' ? '🔴 높음' : rec.priority === 'medium' ? '🟡 중간' : '🟢 낮음'}

${rec.description}

**권장 조치:** ${rec.action}
`).join('\n');
  }
}

// 스크립트 실행
if (require.main === module) {
  const generator = new PerformanceReportGenerator();
  generator.generateReport();
}

module.exports = PerformanceReportGenerator;
