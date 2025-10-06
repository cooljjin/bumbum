// Zustand 스토어 성능 최적화 테스트

import { performanceManager } from '../src/utils/PerformanceManager';

// 성능 테스트 클래스
class PerformanceTest {
  private testResults: Map<string, any> = new Map();

  // 기본 성능 테스트
  async runBasicPerformanceTest() {
    console.log('🚀 기본 성능 테스트 시작...');
    
    // 성능 모니터링 시작
    performanceManager.startStoreMonitoring('editor-store');
    
    // 테스트 실행
    const startTime = performance.now();
    
    // 가상의 상태 업데이트 시뮬레이션
    await this.simulateStateUpdates();
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // 결과 저장
    this.testResults.set('basic', {
      totalTime,
      averageUpdateTime: totalTime / 100, // 100번의 업데이트 가정
      memoryUsage: performanceManager.checkMemoryUsage()
    });
    
    console.log(`✅ 기본 성능 테스트 완료: ${totalTime.toFixed(2)}ms`);
    
    // 성능 리포트 생성
    const report = performanceManager.generateStoreReport('editor-store');
    console.log(report);
  }

  // 메모리 최적화 테스트
  async runMemoryOptimizationTest() {
    console.log('🧠 메모리 최적화 테스트 시작...');
    
    const initialMemory = performanceManager.checkMemoryUsage();
    
    // 대량의 데이터 생성
    const largeData = this.generateLargeData(1000);
    
    // 메모리 사용량 체크
    const afterDataCreation = performanceManager.checkMemoryUsage();
    
    // 데이터 정리
    const optimizedData = performanceManager.optimizeArray(largeData);
    const afterOptimization = performanceManager.checkMemoryUsage();
    
    // 결과 저장
    this.testResults.set('memory', {
      initialMemory,
      afterDataCreation,
      afterOptimization,
      dataSize: largeData.length,
      optimizedSize: optimizedData.length
    });
    
    console.log('✅ 메모리 최적화 테스트 완료');
    console.log(`초기 메모리: ${(initialMemory.used / 1024 / 1024).toFixed(2)}MB`);
    console.log(`데이터 생성 후: ${(afterDataCreation.used / 1024 / 1024).toFixed(2)}MB`);
    console.log(`최적화 후: ${(afterOptimization.used / 1024 / 1024).toFixed(2)}MB`);
  }

  // 배치 업데이트 테스트
  async runBatchUpdateTest() {
    console.log('📦 배치 업데이트 테스트 시작...');
    
    const startTime = performance.now();
    
    // 개별 업데이트 시뮬레이션
    for (let i = 0; i < 100; i++) {
      await this.simulateSingleUpdate(i);
    }
    
    const individualTime = performance.now() - startTime;
    
    // 배치 업데이트 시뮬레이션
    const batchStartTime = performance.now();
    await this.simulateBatchUpdate(100);
    const batchTime = performance.now() - batchStartTime;
    
    // 결과 저장
    this.testResults.set('batch', {
      individualTime,
      batchTime,
      improvement: ((individualTime - batchTime) / individualTime) * 100
    });
    
    console.log('✅ 배치 업데이트 테스트 완료');
    console.log(`개별 업데이트: ${individualTime.toFixed(2)}ms`);
    console.log(`배치 업데이트: ${batchTime.toFixed(2)}ms`);
    console.log(`성능 향상: ${((individualTime - batchTime) / individualTime) * 100}%`);
  }

  // 비교 함수 성능 테스트
  async runComparisonTest() {
    console.log('🔍 비교 함수 성능 테스트 시작...');
    
    const testData = this.generateTestData();
    
    // 얕은 비교 테스트
    const shallowStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      performanceManager.shallowEqual(testData, { ...testData });
    }
    const shallowTime = performance.now() - shallowStart;
    
    // 깊은 비교 테스트
    const deepStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      performanceManager.deepEqual(testData, { ...testData });
    }
    const deepTime = performance.now() - deepStart;
    
    // 결과 저장
    this.testResults.set('comparison', {
      shallowTime,
      deepTime,
      shallowFaster: shallowTime < deepTime,
      performanceRatio: deepTime / shallowTime
    });
    
    console.log('✅ 비교 함수 성능 테스트 완료');
    console.log(`얕은 비교: ${shallowTime.toFixed(2)}ms`);
    console.log(`깊은 비교: ${deepTime.toFixed(2)}ms`);
    console.log(`얕은 비교가 ${(deepTime / shallowTime).toFixed(2)}배 빠름`);
  }

  // 통합 성능 테스트
  async runIntegrationTest() {
    console.log('🔗 통합 성능 테스트 시작...');
    
    const startTime = performance.now();
    
    // 모든 테스트 실행
    await this.runBasicPerformanceTest();
    await this.runMemoryOptimizationTest();
    await this.runBatchUpdateTest();
    await this.runComparisonTest();
    
    const totalTime = performance.now() - startTime;
    
    // 최종 결과 저장
    this.testResults.set('integration', {
      totalTime,
      testCount: this.testResults.size - 1
    });
    
    console.log('✅ 통합 성능 테스트 완료');
    console.log(`총 테스트 시간: ${totalTime.toFixed(2)}ms`);
  }

  // 테스트 결과 요약
  generateTestSummary(): string {
    let summary = '📊 성능 테스트 결과 요약\n';
    summary += '='.repeat(40) + '\n\n';
    
    this.testResults.forEach((result, testName) => {
      summary += `**${testName} 테스트**\n`;
      
      if (testName === 'basic') {
        summary += `  총 시간: ${result.totalTime.toFixed(2)}ms\n`;
        summary += `  평균 업데이트 시간: ${result.averageUpdateTime.toFixed(2)}ms\n`;
        summary += `  메모리 사용량: ${(result.memoryUsage.used / 1024 / 1024).toFixed(2)}MB\n`;
      } else if (testName === 'memory') {
        summary += `  데이터 크기: ${result.dataSize}\n`;
        summary += `  최적화 후 크기: ${result.optimizedSize}\n`;
        summary += `  메모리 절약: ${((result.afterDataCreation.used - result.afterOptimization.used) / 1024 / 1024).toFixed(2)}MB\n`;
      } else if (testName === 'batch') {
        summary += `  개별 업데이트: ${result.individualTime.toFixed(2)}ms\n`;
        summary += `  배치 업데이트: ${result.batchTime.toFixed(2)}ms\n`;
        summary += `  성능 향상: ${result.improvement.toFixed(2)}%\n`;
      } else if (testName === 'comparison') {
        summary += `  얕은 비교: ${result.shallowTime.toFixed(2)}ms\n`;
        summary += `  깊은 비교: ${result.deepTime.toFixed(2)}ms\n`;
        summary += `  성능 비율: ${result.performanceRatio.toFixed(2)}:1\n`;
      } else if (testName === 'integration') {
        summary += `  총 테스트 시간: ${result.totalTime.toFixed(2)}ms\n`;
        summary += `  테스트 수: ${result.testCount}\n`;
      }
      
      summary += '\n';
    });
    
    return summary;
  }

  // 가상의 상태 업데이트 시뮬레이션
  private async simulateStateUpdates(): Promise<void> {
    return new Promise(resolve => {
      let count = 0;
      const maxCount = 100;
      
      const update = () => {
        if (count >= maxCount) {
          resolve();
          return;
        }
        
        // 가상의 상태 업데이트
        performanceManager.incrementRenderCount('editor-store');
        count++;
        
        // 다음 프레임에서 실행
        requestAnimationFrame(update);
      };
      
      update();
    });
  }

  // 단일 업데이트 시뮬레이션
  private async simulateSingleUpdate(_index: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        performanceManager.incrementRenderCount('editor-store');
        resolve();
      }, Math.random() * 10);
    });
  }

  // 배치 업데이트 시뮬레이션
  private async simulateBatchUpdate(count: number): Promise<void> {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        for (let i = 0; i < count; i++) {
          performanceManager.incrementRenderCount('editor-store');
        }
        resolve();
      });
    });
  }

  // 대량 데이터 생성
  private generateLargeData(size: number): any[] {
    const data = [];
    for (let i = 0; i < size; i++) {
      data.push({
        id: `item-${i}`,
        name: `Item ${i}`,
        position: { x: i, y: i, z: i },
        metadata: {
          category: `category-${i % 5}`,
          description: `Description for item ${i}`.repeat(10)
        }
      });
    }
    return data;
  }

  // 테스트 데이터 생성
  private generateTestData(): any {
    return {
      id: 'test-item',
      name: 'Test Item',
      position: { x: 100, y: 200, z: 300 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      metadata: {
        category: 'test',
        description: 'This is a test item for performance testing'
      },
      children: [
        { id: 'child-1', name: 'Child 1' },
        { id: 'child-2', name: 'Child 2' }
      ]
    };
  }
}

// 테스트 실행 함수
export const runPerformanceTests = async () => {
  console.log('🎯 Zustand 스토어 성능 테스트 시작\n');
  
  const test = new PerformanceTest();
  
  try {
    // 개별 테스트 실행
    await test.runBasicPerformanceTest();
    await test.runMemoryOptimizationTest();
    await test.runBatchUpdateTest();
    await test.runComparisonTest();
    
    // 통합 테스트 실행
    await test.runIntegrationTest();
    
    // 결과 요약 출력
    const summary = test.generateTestSummary();
    console.log(summary);
    
    console.log('🎉 모든 성능 테스트가 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 성능 테스트 실행 중 오류 발생:', error);
  }
};

// 브라우저 환경에서 실행
if (typeof window !== 'undefined') {
  // 개발 모드에서만 자동 실행
  if (process.env.NODE_ENV === 'development') {
    // 5초 후 자동 실행
    setTimeout(() => {
      console.log('🔄 5초 후 성능 테스트를 자동으로 실행합니다...');
      runPerformanceTests();
    }, 5000);
  }
}

export default PerformanceTest;
