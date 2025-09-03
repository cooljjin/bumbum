import { logger, createLogger, LogLevel, configureLogger } from '../logger';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Mock performance.memory
const mockPerformance = {
  memory: {
    usedJSHeapSize: 1024 * 1024, // 1MB
    totalJSHeapSize: 2 * 1024 * 1024, // 2MB
    jsHeapSizeLimit: 4 * 1024 * 1024 // 4MB
  }
};

describe('Logger System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    global.console = mockConsole as any;
    
    // Mock performance.memory
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true
    });
    
    // Reset logger configuration
    configureLogger({
      level: LogLevel.DEBUG,
      enableConsole: true
    });
  });

  describe('Basic Logging', () => {
    it('should log debug messages when level is DEBUG', () => {
      logger.debug('test-category', 'Debug message', { data: 'test' });
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Debug message',
        { data: 'test' }
      );
    });

    it('should log info messages when level is INFO', () => {
      logger.info('test-category', 'Info message', { data: 'test' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Info message',
        { data: 'test' }
      );
    });

    it('should log warn messages when level is WARN', () => {
      logger.warn('test-category', 'Warning message', { data: 'test' });
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        'Warning message',
        { data: 'test' }
      );
    });

    it('should log error messages when level is ERROR', () => {
      logger.error('test-category', 'Error message', { data: 'test' });
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Error message',
        { data: 'test' }
      );
    });
  });

  describe('Log Level Filtering', () => {
    it('should not log debug messages when level is INFO', () => {
      configureLogger({ level: LogLevel.INFO });
      
      logger.debug('test-category', 'Debug message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should not log info messages when level is WARN', () => {
      configureLogger({ level: LogLevel.WARN });
      
      logger.info('test-category', 'Info message');
      
      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it('should not log warn messages when level is ERROR', () => {
      configureLogger({ level: LogLevel.ERROR });
      
      logger.warn('test-category', 'Warning message');
      
      expect(mockConsole.warn).not.toHaveBeenCalled();
    });

    it('should log error messages when level is ERROR', () => {
      configureLogger({ level: LogLevel.ERROR });
      
      logger.error('test-category', 'Error message');
      
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Category Logger', () => {
    it('should create category-specific logger', () => {
      const categoryLogger = createLogger('test-category');
      
      categoryLogger.info('Test message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Test message',
        ''
      );
    });

    it('should maintain category in all log methods', () => {
      const categoryLogger = createLogger('test-category');
      
      categoryLogger.debug('Debug message');
      categoryLogger.info('Info message');
      categoryLogger.warn('Warning message');
      categoryLogger.error('Error message');
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[test-category]'),
        'Debug message',
        ''
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[test-category]'),
        'Info message',
        ''
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[test-category]'),
        'Warning message',
        ''
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[test-category]'),
        'Error message',
        ''
      );
    });
  });

  describe('Configuration', () => {
    it('should allow console logging to be disabled', () => {
      configureLogger({ enableConsole: false });
      
      logger.info('test-category', 'Test message');
      
      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it('should allow log level to be changed', () => {
      configureLogger({ level: LogLevel.WARN });
      
      logger.info('test-category', 'Info message');
      logger.warn('test-category', 'Warning message');
      
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
    });
  });

  describe('Timestamp and Formatting', () => {
    it('should include timestamp in log messages', () => {
      const beforeLog = Date.now();
      logger.info('test-category', 'Test message');
      const afterLog = Date.now();
      
      const logCall = mockConsole.info.mock.calls[0][0];
      const timestamp = new Date(logCall.match(/\[(.*?)\]/)[1]);
      const timestampMs = timestamp.getTime();
      
      expect(timestampMs).toBeGreaterThanOrEqual(beforeLog);
      expect(timestampMs).toBeLessThanOrEqual(afterLog);
    });

    it('should format log messages correctly', () => {
      logger.info('test-category', 'Test message', { data: 'test' });
      
      const logCall = mockConsole.info.mock.calls[0];
      expect(logCall[0]).toMatch(/^\[.*?\] \[INFO\] \[test-category\]$/);
      expect(logCall[1]).toBe('Test message');
      expect(logCall[2]).toEqual({ data: 'test' });
    });
  });
});
