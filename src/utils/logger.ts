// 로깅 레벨 정의
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// 로깅 환경 설정
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
}

// 카테고리별 로거 인터페이스
export interface CategoryLogger {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
}

// 로거 클래스
class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: this.getDefaultLogLevel(),
      enableConsole: true,
      ...config
    };
  }

  // 기본 로그 레벨 결정 (환경별)
  private getDefaultLogLevel(): LogLevel {
    if (typeof window === 'undefined') {
      // 서버 사이드
      return process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.INFO;
    }

    // 클라이언트 사이드
    if (process.env.NODE_ENV === 'production') {
      return LogLevel.ERROR; // 프로덕션에서는 에러만
    }

    // 개발 환경
    if (process.env.NODE_ENV === 'development') {
      return LogLevel.DEBUG; // 개발에서는 모든 로그
    }

    return LogLevel.INFO; // 기본값
  }

  // 로그 레벨 설정
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  // 로그 레벨 가져오기
  getLevel(): LogLevel {
    return this.config.level;
  }

  // 콘솔 로깅 활성화/비활성화
  setConsoleEnabled(enabled: boolean): void {
    this.config.enableConsole = enabled;
  }

  // 로그 출력
  private outputLog(level: LogLevel, category: string, message: string, data?: any): void {
    // 로그 레벨 체크
    if (level < this.config.level) {
      return;
    }

    // 콘솔 출력
    if (this.config.enableConsole) {
      const timestamp = new Date().toISOString();
      const levelStr = LogLevel[level];
      const prefix = `[${timestamp}] [${levelStr}] [${category}]`;

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(prefix, message, data || '');
          break;
        case LogLevel.INFO:
          console.info(prefix, message, data || '');
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, data || '');
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, data || '');
          break;
      }
    }
  }

  // 로그 메서드들
  debug(category: string, message: string, data?: any): void {
    this.outputLog(LogLevel.DEBUG, category, message, data);
  }

  info(category: string, message: string, data?: any): void {
    this.outputLog(LogLevel.INFO, category, message, data);
  }

  warn(category: string, message: string, data?: any): void {
    this.outputLog(LogLevel.WARN, category, message, data);
  }

  error(category: string, message: string, data?: any): void {
    this.outputLog(LogLevel.ERROR, category, message, data);
  }

  // 카테고리별 로거 생성
  createLogger(category: string): CategoryLogger {
    return {
      debug: (message: string, data?: any) => this.debug(category, message, data),
      info: (message: string, data?: any) => this.info(category, message, data),
      warn: (message: string, data?: any) => this.warn(category, message, data),
      error: (message: string, data?: any) => this.error(category, message, data)
    };
  }
}

// 기본 로거 인스턴스
export const logger = new Logger();

// 카테고리별 로거 팩토리
export const createLogger = (category: string): CategoryLogger => logger.createLogger(category);

// 편의 함수들
export const logDebug = (category: string, message: string, data?: any) => logger.debug(category, message, data);
export const logInfo = (category: string, message: string, data?: any) => logger.info(category, message, data);
export const logWarn = (category: string, message: string, data?: any) => logger.warn(category, message, data);
export const logError = (category: string, message: string, data?: any) => logger.error(category, message, data);

// 환경별 로거 설정
export const configureLogger = (config: Partial<LoggerConfig>) => {
  if (config.level !== undefined) logger.setLevel(config.level);
  if (config.enableConsole !== undefined) logger.setConsoleEnabled(config.enableConsole);
};

// 개발 환경에서 로거 설정
if (process.env.NODE_ENV === 'development') {
  configureLogger({
    level: LogLevel.DEBUG,
    enableConsole: true
  });
}

// 프로덕션 환경에서 로거 설정
if (process.env.NODE_ENV === 'production') {
  configureLogger({
    level: LogLevel.ERROR,
    enableConsole: false
  });
}

export default logger;
