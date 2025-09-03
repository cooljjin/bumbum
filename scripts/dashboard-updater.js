#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

/**
 * 대시보드 데이터 자동 업데이트 클래스
 */
class DashboardUpdater {
  constructor() {
    this.watchPaths = [
      path.join(__dirname, '..', 'test-results'),
      path.join(__dirname, '..', 'coverage')
    ];
    this.updateInterval = 30000; // 30초
    this.lastUpdate = new Date();
    this.isRunning = false;
    this.updateLog = [];
    this.maxLogEntries = 100;
  }

  /**
   * 업데이트 로그에 항목 추가
   * @param {string} message - 로그 메시지
   * @param {string} type - 로그 타입 (info, warning, error)
   */
  addLogEntry(message, type = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      type
    };
    
    this.updateLog.unshift(logEntry);
    
    // 최대 로그 항목 수 제한
    if (this.updateLog.length > this.maxLogEntries) {
      this.updateLog = this.updateLog.slice(0, this.maxLogEntries);
    }
    
    console.log(`[${logEntry.timestamp}] [${type.toUpperCase()}] ${message}`);
  }

  /**
   * 파일 변경 감지 및 처리
   * @param {string} filePath - 변경된 파일 경로
   */
  async handleFileChange(filePath) {
    try {
      const fileName = path.basename(filePath);
      this.addLogEntry(`파일 변경 감지: ${fileName}`, 'info');
      
      // 파일 타입에 따른 처리
      if (fileName === 'results.json') {
        await this.updatePlaywrightResults();
      } else if (fileName === 'coverage-final.json') {
        await this.updateCoverageData();
      } else if (fileName === 'performance-metrics.json') {
        await this.updatePerformanceMetrics();
      }
      
      this.lastUpdate = new Date();
      this.addLogEntry(`파일 ${fileName} 업데이트 완료`, 'info');
      
    } catch (error) {
      this.addLogEntry(`파일 변경 처리 중 오류: ${error.message}`, 'error');
    }
  }

  /**
   * Playwright 테스트 결과 업데이트
   */
  async updatePlaywrightResults() {
    try {
      const resultsPath = path.join(__dirname, '..', 'test-results', 'results.json');
      const dashboardPath = path.join(__dirname, '..', 'test-results', 'dashboard-data.json');
      
      if (fs.existsSync(resultsPath)) {
        // Playwright 결과 파싱 스크립트 실행
        const { exec } = require('child_process');
        const scriptPath = path.join(__dirname, 'parse-playwright-results.js');
        
        return new Promise((resolve, reject) => {
          exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
              this.addLogEntry(`Playwright 결과 업데이트 실패: ${error.message}`, 'error');
              reject(error);
            } else {
              this.addLogEntry('Playwright 결과 업데이트 성공', 'info');
              resolve();
            }
          });
        });
      }
    } catch (error) {
      this.addLogEntry(`Playwright 결과 업데이트 중 오류: ${error.message}`, 'error');
    }
  }

  /**
   * 커버리지 데이터 업데이트
   */
  async updateCoverageData() {
    try {
      const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-final.json');
      const dashboardPath = path.join(__dirname, '..', 'coverage', 'dashboard-data.json');
      
      if (fs.existsSync(coveragePath)) {
        // 커버리지 파싱 스크립트 실행
        const { exec } = require('child_process');
        const scriptPath = path.join(__dirname, 'parse-coverage.js');
        
        return new Promise((resolve, reject) => {
          exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
              this.addLogEntry(`커버리지 데이터 업데이트 실패: ${error.message}`, 'error');
              reject(error);
            } else {
              this.addLogEntry('커버리지 데이터 업데이트 성공', 'info');
              resolve();
            }
          });
        });
      }
    } catch (error) {
      this.addLogEntry(`커버리지 데이터 업데이트 중 오류: ${error.message}`, 'error');
    }
  }

  /**
   * 성능 메트릭 업데이트
   */
  async updatePerformanceMetrics() {
    try {
      this.addLogEntry('성능 메트릭 업데이트 시작', 'info');
      
      // 성능 메트릭 수집 스크립트 실행
      const { exec } = require('child_process');
      const scriptPath = path.join(__dirname, 'collect-performance-metrics.js');
      
      return new Promise((resolve, reject) => {
        exec(`node ${scriptPath} http://localhost:3002`, (error, stdout, stderr) => {
          if (error) {
            this.addLogEntry(`성능 메트릭 업데이트 실패: ${error.message}`, 'error');
            reject(error);
          } else {
            this.addLogEntry('성능 메트릭 업데이트 성공', 'info');
            resolve();
          }
        });
      });
    } catch (error) {
      this.addLogEntry(`성능 메트릭 업데이트 중 오류: ${error.message}`, 'error');
    }
  }

  /**
   * 모든 데이터 업데이트
   */
  async updateAllData() {
    try {
      this.addLogEntry('전체 데이터 업데이트 시작', 'info');
      
      await Promise.all([
        this.updatePlaywrightResults(),
        this.updateCoverageData(),
        this.updatePerformanceMetrics()
      ]);
      
      this.addLogEntry('전체 데이터 업데이트 완료', 'info');
      
    } catch (error) {
      this.addLogEntry(`전체 데이터 업데이트 중 오류: ${error.message}`, 'error');
    }
  }

  /**
   * 파일 감시 시작
   */
  startWatching() {
    if (this.isRunning) {
      this.addLogEntry('파일 감시가 이미 실행 중입니다', 'warning');
      return;
    }

    this.isRunning = true;
    this.addLogEntry('파일 감시 시작', 'info');

    // 파일 변경 감지
    const watcher = chokidar.watch(this.watchPaths, {
      ignored: /(^|[\/\\])\../, // 숨김 파일 무시
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', (filePath) => this.handleFileChange(filePath))
      .on('change', (filePath) => this.handleFileChange(filePath))
      .on('unlink', (filePath) => this.addLogEntry(`파일 삭제: ${path.basename(filePath)}`, 'info'))
      .on('error', (error) => this.addLogEntry(`파일 감시 오류: ${error.message}`, 'error'));

    // 주기적 전체 업데이트
    const updateTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.updateAllData();
      } else {
        clearInterval(updateTimer);
      }
    }, this.updateInterval);

    // 프로세스 종료 시 정리
    process.on('SIGINT', () => {
      this.addLogEntry('프로세스 종료 신호 수신, 정리 중...', 'info');
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.addLogEntry('프로세스 종료 신호 수신, 정리 중...', 'info');
      this.stop();
      process.exit(0);
    });

    this.addLogEntry('파일 감시 및 자동 업데이트 시작됨', 'info');
  }

  /**
   * 파일 감시 중지
   */
  stop() {
    this.isRunning = false;
    this.addLogEntry('파일 감시 중지', 'info');
  }

  /**
   * 상태 정보 반환
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate.toISOString(),
      updateLog: this.updateLog.slice(0, 10), // 최근 10개 로그만
      watchPaths: this.watchPaths
    };
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  const updater = new DashboardUpdater();
  
  console.log('🚀 대시보드 자동 업데이트 시스템 시작');
  console.log('감시 경로:', updater.watchPaths);
  console.log('업데이트 간격:', updater.updateInterval / 1000, '초');
  console.log('Ctrl+C로 종료할 수 있습니다.\n');
  
  // 초기 데이터 업데이트
  await updater.updateAllData();
  
  // 파일 감시 시작
  updater.startWatching();
  
  // 상태 모니터링 (선택사항)
  setInterval(() => {
    const status = updater.getStatus();
    console.log(`\n📊 상태 업데이트: ${status.lastUpdate}`);
    console.log(`실행 중: ${status.isRunning ? '✅' : '❌'}`);
  }, 60000); // 1분마다 상태 출력
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main().catch(error => {
    console.error('대시보드 업데이트 시스템 실행 중 오류:', error);
    process.exit(1);
  });
}

module.exports = DashboardUpdater;

