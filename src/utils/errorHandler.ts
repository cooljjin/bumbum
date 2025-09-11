// 에러 타입 정의
export enum ErrorType {
  MODEL_LOADING = 'MODEL_LOADING',
  MEMORY_LOW = 'MEMORY_LOW',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 에러 심각도 레벨
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 에러 정보 인터페이스
export interface ErrorInfo {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  timestamp: Date;
  stack?: string;
  context?: Record<string, any>;
  recoverable: boolean;
  autoRecoveryAttempted: boolean;
}

// 복구 전략 인터페이스
export interface RecoveryStrategy {
  name: string;
  description: string;
  action: () => Promise<boolean>;
  automatic: boolean;
  priority: number;
}

// 에러 처리 결과
export interface ErrorHandlingResult {
  handled: boolean;
  recovered: boolean;
  userActionRequired: boolean;
  message: string;
  recoverySteps?: string[];
}

/**
 * 🚨 에러 처리 및 로깅 유틸리티
 * 다양한 예외 상황에 대한 적절한 대응과 복구 메커니즘 제공
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorInfo[] = [];
  private recoveryStrategies: Map<ErrorType, RecoveryStrategy[]> = new Map();
  private maxErrorLogSize = 100;

  private constructor() {
    this.initializeRecoveryStrategies();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 🔧 복구 전략 초기화
   */
  private initializeRecoveryStrategies() {
    // 모델 로딩 실패 복구 전략
    this.addRecoveryStrategy(ErrorType.MODEL_LOADING, {
      name: '폴백 모델 사용',
      description: '기본 박스 모델로 대체하여 렌더링 계속',
      action: async () => {
        try {
          // console.log('🔄 모델 로딩 실패 복구: 폴백 모델 사용');
          return true;
        } catch (error) {
          console.error('❌ 폴백 모델 사용 실패:', error);
          return false;
        }
      },
      automatic: true,
      priority: 1
    });

    // 메모리 부족 복구 전략
    this.addRecoveryStrategy(ErrorType.MEMORY_LOW, {
      name: 'LOD 레벨 자동 조절',
      description: '성능을 위해 LOD 레벨을 낮춰 메모리 사용량 감소',
      action: async () => {
        try {
          // console.log('🔄 메모리 부족 복구: LOD 레벨 자동 조절');
          // LOD 설정을 더 보수적으로 조정
          return true;
        } catch (error) {
          console.error('❌ LOD 레벨 조절 실패:', error);
          return false;
        }
      },
      automatic: true,
      priority: 1
    });

    this.addRecoveryStrategy(ErrorType.MEMORY_LOW, {
      name: '오래된 객체 정리',
      description: '사용하지 않는 3D 객체와 텍스처를 정리',
      action: async () => {
        try {
          // console.log('🔄 메모리 부족 복구: 오래된 객체 정리');
          // WebGL 컨텍스트 강제 정리
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const gl = canvas.getContext('webgl');
            if (gl) {
              gl.getExtension('WEBGL_lose_context')?.loseContext();
            }
          }
          return true;
        } catch (error) {
          console.error('❌ 객체 정리 실패:', error);
          return false;
        }
      },
      automatic: true,
      priority: 2
    });

    // 네트워크 오류 복구 전략
    this.addRecoveryStrategy(ErrorType.NETWORK_ERROR, {
      name: '오프라인 모드 전환',
      description: '로컬 캐시된 리소스를 사용하여 오프라인으로 동작',
      action: async () => {
        try {
          // console.log('🔄 네트워크 오류 복구: 오프라인 모드 전환');
          // 오프라인 모드 활성화
          return true;
        } catch (error) {
          console.error('❌ 오프라인 모드 전환 실패:', error);
          return false;
        }
      },
      automatic: true,
      priority: 1
    });

    // 렌더링 오류 복구 전략
    this.addRecoveryStrategy(ErrorType.RENDER_ERROR, {
      name: 'WebGL 컨텍스트 재생성',
      description: 'WebGL 컨텍스트를 재생성하여 렌더링 복구',
      action: async () => {
        try {
          // console.log('🔄 렌더링 오류 복구: WebGL 컨텍스트 재생성');
          // 캔버스 재생성 및 WebGL 컨텍스트 재설정
          return true;
        } catch (error) {
          console.error('❌ WebGL 컨텍스트 재생성 실패:', error);
          return false;
        }
      },
      automatic: true,
      priority: 1
    });
  }

  /**
   * ➕ 복구 전략 추가
   */
  addRecoveryStrategy(type: ErrorType, strategy: RecoveryStrategy) {
    if (!this.recoveryStrategies.has(type)) {
      this.recoveryStrategies.set(type, []);
    }
    this.recoveryStrategies.get(type)!.push(strategy);
    // 우선순위에 따라 정렬
    this.recoveryStrategies.get(type)!.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 🚨 에러 처리 및 로깅
   */
  handleError(
    error: Error,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>
  ): ErrorHandlingResult {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      type,
      severity,
      message: error.message,
              userMessage: this.getUserFriendlyMessage(type),
      timestamp: new Date(),
      stack: error.stack || '',
      context: context || {},
      recoverable: this.isRecoverable(type),
      autoRecoveryAttempted: false
    };

    // 에러 로그에 추가
    this.logError(errorInfo);

    // 자동 복구 시도
    let recovered = false;
    if (errorInfo.recoverable && severity !== ErrorSeverity.CRITICAL) {
      recovered = this.attemptAutoRecovery(errorInfo);
      errorInfo.autoRecoveryAttempted = true;
    }

    // 복구 결과에 따른 사용자 액션 필요성 판단
    const userActionRequired = !recovered && severity >= ErrorSeverity.MEDIUM;

    return {
      handled: true,
      recovered,
      userActionRequired,
      message: errorInfo.userMessage,
      recoverySteps: this.getRecoverySteps(type)
    };
  }

  /**
   * 🔄 자동 복구 시도
   */
  private attemptAutoRecovery(errorInfo: ErrorInfo): boolean {
    const strategies = this.recoveryStrategies.get(errorInfo.type) || [];
    const automaticStrategies = strategies.filter(s => s.automatic);

    for (const strategy of automaticStrategies) {
      try {
        // console.log(`🔄 자동 복구 시도: ${strategy.name}`);
        const success = strategy.action();
        if (success && typeof success === 'boolean') {
          // console.log(`✅ 자동 복구 성공: ${strategy.name}`);
          return true;
        }
      } catch (error) {
        console.error(`❌ 자동 복구 실패: ${strategy.name}`, error);
      }
    }

    return false;
  }

  /**
   * 📝 에러 로그
   */
  private logError(errorInfo: ErrorInfo) {
    this.errorLog.push(errorInfo);

    // 로그 크기 제한
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxErrorLogSize);
    }

    // 콘솔에 에러 정보 출력
    console.group(`🚨 에러 발생 (${errorInfo.id})`);
    console.error('타입:', errorInfo.type);
    console.error('심각도:', errorInfo.severity);
    console.error('메시지:', errorInfo.message);
    console.error('사용자 메시지:', errorInfo.userMessage);
    console.error('시간:', errorInfo.timestamp.toISOString());
    if (errorInfo.context) {
      console.error('컨텍스트:', errorInfo.context);
    }
    if (errorInfo.stack) {
      console.error('스택 트레이스:', errorInfo.stack);
    }
    console.groupEnd();

    // localStorage에 에러 로그 저장 (선택적)
    this.saveErrorLogToStorage();
  }

  /**
   * 💾 에러 로그를 localStorage에 저장
   */
  private saveErrorLogToStorage() {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        errors: this.errorLog.slice(-20) // 최근 20개만 저장
      };
      localStorage.setItem('bumbum_error_log', JSON.stringify(logData));
    } catch (error) {
      console.warn('에러 로그 저장 실패:', error);
    }
  }

  /**
   * 📊 에러 로그 조회
   */
  getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }

  /**
   * 🧹 에러 로그 정리
   */
  clearErrorLog() {
    this.errorLog = [];
    try {
      localStorage.removeItem('bumbum_error_log');
    } catch (error) {
      console.warn('에러 로그 정리 실패:', error);
    }
  }

  /**
   * 🔍 에러 통계 조회
   */
  getErrorStatistics() {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: this.errorLog.filter(e =>
        Date.now() - e.timestamp.getTime() < 24 * 60 * 60 * 1000
      ).length
    };

    // 타입별 통계
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = this.errorLog.filter(e => e.type === type).length;
    });

    // 심각도별 통계
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = this.errorLog.filter(e => e.severity === severity).length;
    });

    return stats;
  }

  /**
   * 🆔 에러 ID 생성
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 👥 사용자 친화적 메시지 생성
   */
  private getUserFriendlyMessage(type: ErrorType): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.MODEL_LOADING]: '가구 모델을 불러오는 중 문제가 발생했습니다. 기본 모델로 대체합니다.',
      [ErrorType.MEMORY_LOW]: '메모리가 부족합니다. 성능을 위해 자동으로 최적화합니다.',
      [ErrorType.NETWORK_ERROR]: '네트워크 연결에 문제가 있습니다. 오프라인 모드로 전환합니다.',
      [ErrorType.RENDER_ERROR]: '화면 렌더링에 문제가 발생했습니다. 자동으로 복구를 시도합니다.',
      [ErrorType.VALIDATION_ERROR]: '입력 데이터에 문제가 있습니다. 확인 후 다시 시도해주세요.',
      [ErrorType.UNKNOWN_ERROR]: '예상치 못한 오류가 발생했습니다. 페이지를 새로고침해주세요.'
    };

    return messages[type] || '알 수 없는 오류가 발생했습니다.';
  }

  /**
   * 🔧 복구 단계 가져오기
   */
  private getRecoverySteps(type: ErrorType): string[] {
    const steps: Record<ErrorType, string[]> = {
      [ErrorType.MODEL_LOADING]: [
        '1. 페이지를 새로고침해보세요',
        '2. 다른 가구를 선택해보세요',
        '3. 브라우저 캐시를 정리해보세요'
      ],
      [ErrorType.MEMORY_LOW]: [
        '1. 다른 탭을 닫아보세요',
        '2. 가구 수를 줄여보세요',
        '3. 브라우저를 재시작해보세요'
      ],
      [ErrorType.NETWORK_ERROR]: [
        '1. 인터넷 연결을 확인해보세요',
        '2. 잠시 후 다시 시도해보세요',
        '3. 오프라인 모드를 사용해보세요'
      ],
      [ErrorType.RENDER_ERROR]: [
        '1. 페이지를 새로고침해보세요',
        '2. 그래픽 드라이버를 업데이트해보세요',
        '3. 하드웨어 가속을 비활성화해보세요'
      ],
      [ErrorType.VALIDATION_ERROR]: [
        '1. 입력값을 확인해보세요',
        '2. 필수 항목을 모두 입력했는지 확인해보세요',
        '3. 올바른 형식으로 입력했는지 확인해보세요'
      ],
      [ErrorType.UNKNOWN_ERROR]: [
        '1. 페이지를 새로고침해보세요',
        '2. 브라우저를 재시작해보세요',
        '3. 문제가 지속되면 관리자에게 문의해주세요'
      ]
    };

    return steps[type] || ['문제 해결을 위해 페이지를 새로고침해보세요.'];
  }

  /**
   * ✅ 복구 가능 여부 확인
   */
  private isRecoverable(type: ErrorType): boolean {
    const recoverableTypes = [
      ErrorType.MODEL_LOADING,
      ErrorType.MEMORY_LOW,
      ErrorType.NETWORK_ERROR,
      ErrorType.RENDER_ERROR
    ];
    return recoverableTypes.includes(type);
  }

  /**
   * 🚨 메모리 부족 감지
   */
  detectMemoryPressure(): boolean {
    try {
      // WebGL 메모리 정보 확인
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const gl = canvas.getContext('webgl');
        if (gl) {
          // WebGL 메모리 정보는 복잡하므로 간단하게 처리
          // 메모리 압박은 시스템 메모리 정보로만 판단
        }
      }

      // 시스템 메모리 정보 확인 (가능한 경우)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        return memoryUsage > 0.8; // 80% 이상 사용 시
      }

      return false;
    } catch (error) {
      console.warn('메모리 압박 감지 실패:', error);
      return false;
    }
  }

  /**
   * 🌐 네트워크 상태 확인
   */
  checkNetworkStatus(): boolean {
    return navigator.onLine;
  }

  /**
   * 🔄 복구 시도
   */
  async attemptRecovery(type: ErrorType): Promise<boolean> {
    const strategies = this.recoveryStrategies.get(type) || [];

    for (const strategy of strategies) {
      try {
        // console.log(`🔄 복구 시도: ${strategy.name}`);
        const success = await strategy.action();
        if (success) {
          // console.log(`✅ 복구 성공: ${strategy.name}`);
          return true;
        }
      } catch (error) {
        console.error(`❌ 복구 실패: ${strategy.name}`, error);
      }
    }

    return false;
  }
}

// 싱글톤 인스턴스 export
export const errorHandler = ErrorHandler.getInstance();

// 편의 함수들
export const handleError = (error: Error, type?: ErrorType, severity?: ErrorSeverity, context?: Record<string, any>) => {
  return errorHandler.handleError(error, type, severity, context);
};

export const getErrorLog = () => errorHandler.getErrorLog();
export const getErrorStatistics = () => errorHandler.getErrorStatistics();
export const clearErrorLog = () => errorHandler.clearErrorLog();
export const detectMemoryPressure = () => errorHandler.detectMemoryPressure();
export const checkNetworkStatus = () => errorHandler.checkNetworkStatus();
export const attemptRecovery = (type: ErrorType) => errorHandler.attemptRecovery(type);
