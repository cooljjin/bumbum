#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * 웹 페이지 성능 메트릭을 수집하는 함수
 * @param {string} url - 테스트할 URL
 * @returns {Object} 수집된 성능 메트릭
 */
async function collectPerformanceMetrics(url) {
  let browser;
  
  try {
    // 브라우저 실행 (headless 모드)
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // 성능 메트릭 수집을 위한 이벤트 리스너 설정
    const metrics = {
      navigationTiming: {},
      performanceMetrics: {},
      memoryInfo: {},
      timestamp: new Date().toISOString()
    };
    
    // 네비게이션 타이밍 수집
    page.on('load', async () => {
      const navigationTiming = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0];
        if (timing) {
          return {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
            loadComplete: timing.loadEventEnd - timing.loadEventStart,
            domInteractive: timing.domInteractive - timing.fetchStart,
            firstPaint: timing.domContentLoadedEventEnd - timing.fetchStart,
            totalTime: timing.loadEventEnd - timing.fetchStart
          };
        }
        return {};
      });
      
      metrics.navigationTiming = navigationTiming;
    });
    
    // 성능 메트릭 수집
    const performanceMetrics = await page.evaluate(() => {
      const memory = performance.memory;
      return {
        memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
        memoryLimit: memory ? Math.round(memory.jsHeapSizeLimit / 1024 / 1024) : 0,
        memoryTotal: memory ? Math.round(memory.totalJSHeapSize / 1024 / 1024) : 0,
        timestamp: performance.now()
      };
    });
    
    metrics.performanceMetrics = performanceMetrics;
    
    // 페이지 로드
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // 추가 대기 시간 (JavaScript 실행 완료 대기)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 최종 메트릭 수집
    const finalMetrics = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0];
      const memory = performance.memory;
      
      return {
        navigationTiming: {
          domContentLoaded: timing ? timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart : 0,
          loadComplete: timing ? timing.loadEventEnd - timing.loadEventStart : 0,
          domInteractive: timing ? timing.domInteractive - timing.fetchStart : 0,
          firstPaint: timing ? timing.domContentLoadedEventEnd - timing.fetchStart : 0,
          totalTime: timing ? timing.loadEventEnd - timing.fetchStart : 0
        },
        performanceMetrics: {
          memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
          memoryLimit: memory ? Math.round(memory.jsHeapSizeLimit / 1024 / 1024) : 0,
          memoryTotal: memory ? Math.round(memory.totalJSHeapSize / 1024 / 1024) : 0,
          timestamp: performance.now()
        }
      };
    });
    
    // 메트릭 병합
    Object.assign(metrics, finalMetrics);
    
    // 성능 점수 계산
    const performanceScore = calculatePerformanceScore(metrics);
    metrics.performanceScore = performanceScore;
    
    return metrics;
    
  } catch (error) {
    console.error('성능 메트릭 수집 중 오류 발생:', error.message);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 성능 점수를 계산하는 함수
 * @param {Object} metrics - 수집된 성능 메트릭
 * @returns {number} 성능 점수 (0-100)
 */
function calculatePerformanceScore(metrics) {
  let score = 100;
  
  // 네비게이션 타이밍 기반 점수
  if (metrics.navigationTiming) {
    const { totalTime, domContentLoaded, loadComplete } = metrics.navigationTiming;
    
    // 총 로드 시간 점수 (3초 이하: 100점, 5초 이하: 80점, 10초 이하: 60점)
    if (totalTime > 10000) score -= 40;
    else if (totalTime > 5000) score -= 20;
    else if (totalTime > 3000) score -= 10;
    
    // DOM 콘텐츠 로드 시간 점수
    if (domContentLoaded > 2000) score -= 15;
    else if (domContentLoaded > 1000) score -= 10;
    
    // 로드 완료 시간 점수
    if (loadComplete > 1000) score -= 10;
    else if (loadComplete > 500) score -= 5;
  }
  
  // 메모리 사용량 기반 점수
  if (metrics.performanceMetrics) {
    const { memoryUsage, memoryLimit } = metrics.performanceMetrics;
    
    if (memoryLimit > 0) {
      const memoryUsagePercent = (memoryUsage / memoryLimit) * 100;
      
      if (memoryUsagePercent > 80) score -= 20;
      else if (memoryUsagePercent > 60) score -= 15;
      else if (memoryUsagePercent > 40) score -= 10;
    }
  }
  
  return Math.max(0, score);
}

/**
 * 메인 실행 함수
 */
async function main() {
  const url = process.argv[2] || 'http://localhost:3000';
  const outputPath = path.join(__dirname, '..', 'test-results', 'performance-metrics.json');
  
  console.log('성능 메트릭 수집 시작...');
  console.log('테스트 URL:', url);
  
  try {
    // 성능 메트릭 수집
    const metrics = await collectPerformanceMetrics(url);
    
    // 결과 출력
    console.log('\n=== 수집된 성능 메트릭 ===');
    
    if (metrics.error) {
      console.error('오류:', metrics.error);
      return;
    }
    
    if (metrics.navigationTiming) {
      console.log('네비게이션 타이밍:');
      console.log(`  DOM 콘텐츠 로드: ${metrics.navigationTiming.domContentLoaded}ms`);
      console.log(`  로드 완료: ${metrics.navigationTiming.loadComplete}ms`);
      console.log(`  DOM 인터랙티브: ${metrics.navigationTiming.domInteractive}ms`);
      console.log(`  첫 페인트: ${metrics.navigationTiming.firstPaint}ms`);
      console.log(`  총 시간: ${metrics.navigationTiming.totalTime}ms`);
    }
    
    if (metrics.performanceMetrics) {
      console.log('\n성능 메트릭:');
      console.log(`  메모리 사용량: ${metrics.performanceMetrics.memoryUsage}MB`);
      console.log(`  메모리 한계: ${metrics.performanceMetrics.memoryLimit}MB`);
      console.log(`  총 메모리: ${metrics.performanceMetrics.memoryTotal}MB`);
    }
    
    if (metrics.performanceScore !== undefined) {
      console.log(`\n성능 점수: ${metrics.performanceScore}/100`);
      
      if (metrics.performanceScore >= 90) {
        console.log('🎉 우수한 성능입니다!');
      } else if (metrics.performanceScore >= 70) {
        console.log('👍 양호한 성능입니다.');
      } else if (metrics.performanceScore >= 50) {
        console.log('⚠️ 성능 개선이 필요합니다.');
      } else {
        console.log('🚨 심각한 성능 문제가 있습니다.');
      }
    }
    
    // 결과를 JSON 파일로 저장
    fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2));
    console.log('\n성능 메트릭 파일 저장 완료:', outputPath);
    
  } catch (error) {
    console.error('성능 메트릭 수집 실패:', error.message);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = { collectPerformanceMetrics, calculatePerformanceScore };
