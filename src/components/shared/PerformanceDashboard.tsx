'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCalls: number;
  triangles: number;
  points: number;
  lines: number;
  timestamp: number;
}

interface PerformanceHistory {
  fps: number[];
  memoryUsage: number[];
  frameTime: number[];
  timestamps: number[];
}

interface OptimizationSuggestion {
  id: string;
  type: 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  action?: string;
  impact: 'low' | 'medium' | 'high';
  autoFixable?: boolean;
  fixFunction?: () => void;
}

interface PerformanceDashboardProps {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
  showHistory?: boolean;
  onOptimizationSuggestion?: (suggestion: OptimizationSuggestion) => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  enabled = true,
  position = 'top-right',
  compact = false,
  showHistory = true,
  onOptimizationSuggestion
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderCalls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
    timestamp: Date.now()
  });

  const [history, setHistory] = useState<PerformanceHistory>({
    fps: [],
    memoryUsage: [],
    frameTime: [],
    timestamps: []
  });

  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const historyRef = useRef<PerformanceHistory>(history);
  const maxHistorySize = 100; // 100개 데이터 포인트 유지

  // 성능 메트릭 업데이트
  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      const memoryInfo = (performance as any).memory;
      const currentMemory = memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0;
      
      // 간단한 FPS 계산 (실제로는 더 정교한 계산이 필요)
      const now = performance.now();
      const fps = Math.round(1000 / (now - (metrics.timestamp || now)));
      
      const newMetrics: PerformanceMetrics = {
        fps: Math.min(fps, 120), // 최대 120fps로 제한
        frameTime: Math.round(now - (metrics.timestamp || now)),
        memoryUsage: currentMemory,
        renderCalls: 0, // 실제 렌더링 통계는 Three.js에서 가져와야 함
        triangles: 0,
        points: 0,
        lines: 0,
        timestamp: now
      };

      setMetrics(newMetrics);

      // 히스토리 업데이트
      const newHistory = {
        fps: [...historyRef.current.fps, newMetrics.fps].slice(-maxHistorySize),
        memoryUsage: [...historyRef.current.memoryUsage, newMetrics.memoryUsage].slice(-maxHistorySize),
        frameTime: [...historyRef.current.frameTime, newMetrics.frameTime].slice(-maxHistorySize),
        timestamps: [...historyRef.current.timestamps, now].slice(-maxHistorySize)
      };

      historyRef.current = newHistory;
      setHistory(newHistory);

      // 성능 최적화 제안 생성
      generateOptimizationSuggestions(newMetrics, newHistory);
    };

    const interval = setInterval(updateMetrics, 1000); // 1초마다 업데이트
    return () => clearInterval(interval);
  }, [enabled, metrics.timestamp]);

  // 성능 최적화 제안 생성
  const generateOptimizationSuggestions = (
    currentMetrics: PerformanceMetrics,
    currentHistory: PerformanceHistory
  ) => {
    const newSuggestions: OptimizationSuggestion[] = [];

    // FPS 기반 제안
    if (currentMetrics.fps < 30) {
      newSuggestions.push({
        id: 'low-fps',
        type: 'critical',
        title: '낮은 FPS 감지',
        description: `현재 FPS가 ${currentMetrics.fps}로 성능이 저하되고 있습니다.`,
        action: '렌더링 품질을 낮추거나 불필요한 객체를 제거하세요.',
        impact: 'high'
      });
    } else if (currentMetrics.fps < 50) {
      newSuggestions.push({
        id: 'medium-fps',
        type: 'warning',
        title: 'FPS 개선 필요',
        description: `현재 FPS가 ${currentMetrics.fps}입니다.`,
        action: '일부 효과를 비활성화하거나 LOD를 조정하세요.',
        impact: 'medium'
      });
    }

    // 메모리 사용량 기반 제안
    if (currentMetrics.memoryUsage > 150) {
      newSuggestions.push({
        id: 'high-memory',
        type: 'critical',
        title: '높은 메모리 사용량',
        description: `메모리 사용량이 ${currentMetrics.memoryUsage}MB입니다.`,
        action: '사용하지 않는 텍스처나 모델을 정리하세요.',
        impact: 'high'
      });
    } else if (currentMetrics.memoryUsage > 100) {
      newSuggestions.push({
        id: 'medium-memory',
        type: 'warning',
        title: '메모리 사용량 주의',
        description: `메모리 사용량이 ${currentMetrics.memoryUsage}MB입니다.`,
        action: '메모리 사용량을 모니터링하세요.',
        impact: 'medium'
      });
    }

    // 프레임 타임 기반 제안
    if (currentMetrics.frameTime > 33) { // 30fps 미만
      newSuggestions.push({
        id: 'high-frame-time',
        type: 'warning',
        title: '높은 프레임 타임',
        description: `프레임 타임이 ${currentMetrics.frameTime}ms입니다.`,
        action: '렌더링 최적화를 고려하세요.',
        impact: 'medium'
      });
    }

    // 메모리 누수 감지 (메모리 사용량이 지속적으로 증가하는 경우)
    if (currentHistory.memoryUsage.length >= 10) {
      const recentMemory = currentHistory.memoryUsage.slice(-10);
      const isIncreasing = recentMemory.every((val, i) => i === 0 || val >= recentMemory[i - 1]);
      const increaseRate = recentMemory[recentMemory.length - 1] - recentMemory[0];
      
      if (isIncreasing && increaseRate > 10) {
        newSuggestions.push({
          id: 'memory-leak',
          type: 'critical',
          title: '메모리 누수 의심',
          description: `메모리 사용량이 지속적으로 증가하고 있습니다.`,
          action: '메모리 누수를 확인하고 정리하세요.',
          impact: 'high'
        });
      }
    }

    setSuggestions(newSuggestions);
    
    // 부모 컴포넌트에 제안 전달
    if (onOptimizationSuggestion && newSuggestions.length > 0) {
      newSuggestions.forEach(suggestion => {
        onOptimizationSuggestion(suggestion);
      });
    }
  };

  // 성능 상태에 따른 색상 결정
  const getPerformanceColor = (fps: number) => {
    if (fps >= 50) return '#10b981'; // green
    if (fps >= 30) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  // 성능 상태에 따른 아이콘
  const getPerformanceIcon = (fps: number) => {
    if (fps >= 50) return '🟢';
    if (fps >= 30) return '🟡';
    return '🔴';
  };

  // 위치에 따른 스타일
  const getPositionStyle = () => {
    const baseStyle = {
      position: 'fixed' as const,
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '8px',
      padding: '8px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyle, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyle, top: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyle, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyle, bottom: '20px', left: '20px' };
      default:
        return { ...baseStyle, top: '20px', right: '20px' };
    }
  };

  if (!enabled || !isVisible) return null;

  return (
    <div style={getPositionStyle()}>
      {/* 컴팩트 모드 */}
      {compact ? (
        <div 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{getPerformanceIcon(metrics.fps)}</span>
          <span style={{ color: getPerformanceColor(metrics.fps) }}>
            {metrics.fps} FPS
          </span>
          {suggestions.length > 0 && (
            <span style={{ color: '#ef4444' }}>⚠️</span>
          )}
        </div>
      ) : (
        /* 확장 모드 */
        <div>
          {/* 헤더 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            paddingBottom: '4px'
          }}>
            <span style={{ fontWeight: 'bold' }}>성능 모니터</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* 기본 메트릭 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
            <div>
              <span style={{ color: getPerformanceColor(metrics.fps) }}>
                {getPerformanceIcon(metrics.fps)} {metrics.fps} FPS
              </span>
            </div>
            <div>
              <span style={{ color: '#60a5fa' }}>
                💾 {metrics.memoryUsage}MB
              </span>
            </div>
            <div>
              <span style={{ color: '#a78bfa' }}>
                ⏱️ {metrics.frameTime}ms
              </span>
            </div>
            <div>
              <span style={{ color: '#fbbf24' }}>
                🔺 {metrics.triangles}
              </span>
            </div>
          </div>

          {/* 확장된 정보 */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                {/* 히스토리 차트 (간단한 텍스트 기반) */}
                {showHistory && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '10px', marginBottom: '4px' }}>FPS 히스토리:</div>
                    <div style={{ 
                      display: 'flex', 
                      gap: '1px', 
                      height: '20px',
                      alignItems: 'end'
                    }}>
                      {history.fps.slice(-20).map((fps, index) => (
                        <div
                          key={index}
                          style={{
                            width: '3px',
                            height: `${Math.max(2, (fps / 60) * 20)}px`,
                            backgroundColor: getPerformanceColor(fps),
                            borderRadius: '1px'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 최적화 제안 */}
                {suggestions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10px', marginBottom: '4px' }}>최적화 제안:</div>
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        style={{
                          fontSize: '10px',
                          padding: '4px',
                          marginBottom: '2px',
                          backgroundColor: suggestion.type === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 
                                         suggestion.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 
                                         'rgba(59, 130, 246, 0.2)',
                          borderRadius: '4px',
                          border: `1px solid ${suggestion.type === 'critical' ? '#ef4444' : 
                                          suggestion.type === 'warning' ? '#f59e0b' : '#3b82f6'}`
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{suggestion.title}</div>
                        <div>{suggestion.description}</div>
                        {suggestion.action && (
                          <div style={{ fontSize: '9px', opacity: 0.8 }}>{suggestion.action}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
