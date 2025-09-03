'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface PerformanceDataPoint {
  timestamp: number;
  fps: number;
  memoryUsage: number;
  frameTime: number;
  renderCalls: number;
  triangles: number;
}

interface PerformanceVisualizationProps {
  data: PerformanceDataPoint[];
  width?: number;
  height?: number;
  showFPS?: boolean;
  showMemory?: boolean;
  showFrameTime?: boolean;
  showRenderStats?: boolean;
  timeRange?: number; // milliseconds
  autoScale?: boolean;
  theme?: 'dark' | 'light';
}

export const PerformanceVisualization: React.FC<PerformanceVisualizationProps> = ({
  data,
  width = 400,
  height = 200,
  showFPS = true,
  showMemory = true,
  showFrameTime = true,
  showRenderStats = false,
  timeRange = 60000, // 1분
  autoScale = true,
  theme = 'dark'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<PerformanceDataPoint | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'fps' | 'memory' | 'frameTime' | 'triangles'>('fps');

  // 색상 테마
  const colors = theme === 'dark' ? {
    background: '#1a1a1a',
    grid: '#333333',
    text: '#ffffff',
    fps: '#10b981',
    memory: '#3b82f6',
    frameTime: '#f59e0b',
    triangles: '#ef4444',
    hover: '#ffffff'
  } : {
    background: '#ffffff',
    grid: '#e5e5e5',
    text: '#000000',
    fps: '#059669',
    memory: '#2563eb',
    frameTime: '#d97706',
    triangles: '#dc2626',
    hover: '#000000'
  };

  // 데이터 필터링 (시간 범위 내)
  const filteredData = data.filter(point => 
    Date.now() - point.timestamp <= timeRange
  ).sort((a, b) => a.timestamp - b.timestamp);

  // 차트 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || filteredData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = width;
    canvas.height = height;

    // 배경 그리기
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // 그리드 그리기
    drawGrid(ctx, width, height);

    // 데이터 시각화
    if (showFPS) drawMetricLine(ctx, filteredData, 'fps', colors.fps, width, height);
    if (showMemory) drawMetricLine(ctx, filteredData, 'memoryUsage', colors.memory, width, height);
    if (showFrameTime) drawMetricLine(ctx, filteredData, 'frameTime', colors.frameTime, width, height);
    if (showRenderStats) drawMetricLine(ctx, filteredData, 'triangles', colors.triangles, width, height);

    // 범례 그리기
    drawLegend(ctx, width, height);

    // 호버 포인트 그리기
    if (hoveredPoint) {
      drawHoverPoint(ctx, hoveredPoint, width, height);
    }

  }, [filteredData, width, height, showFPS, showMemory, showFrameTime, showRenderStats, hoveredPoint, colors]);

  // 그리드 그리기
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;

    // 수직 그리드 (시간)
    const timeSteps = 6;
    for (let i = 0; i <= timeSteps; i++) {
      const x = (width / timeSteps) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 수평 그리드 (값)
    const valueSteps = 5;
    for (let i = 0; i <= valueSteps; i++) {
      const y = (height / valueSteps) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // 메트릭 라인 그리기
  const drawMetricLine = (
    ctx: CanvasRenderingContext2D,
    data: PerformanceDataPoint[],
    metric: keyof PerformanceDataPoint,
    color: string,
    width: number,
    height: number
  ) => {
    if (data.length < 2) return;

    const values = data.map(point => point[metric] as number);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const normalizedValue = (point[metric] as number - minValue) / valueRange;
      const y = height - (normalizedValue * height);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // 데이터 포인트 그리기
    ctx.fillStyle = color;
    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const normalizedValue = (point[metric] as number - minValue) / valueRange;
      const y = height - (normalizedValue * height);

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // 범례 그리기
  const drawLegend = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const legendItems = [];
    if (showFPS) legendItems.push({ label: 'FPS', color: colors.fps });
    if (showMemory) legendItems.push({ label: 'Memory (MB)', color: colors.memory });
    if (showFrameTime) legendItems.push({ label: 'Frame Time (ms)', color: colors.frameTime });
    if (showRenderStats) legendItems.push({ label: 'Triangles', color: colors.triangles });

    ctx.font = '12px monospace';
    ctx.fillStyle = colors.text;

    legendItems.forEach((item, index) => {
      const x = 10;
      const y = 20 + (index * 20);

      // 색상 표시
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y - 8, 12, 3);

      // 라벨
      ctx.fillStyle = colors.text;
      ctx.fillText(item.label, x + 16, y);
    });
  };

  // 호버 포인트 그리기
  const drawHoverPoint = (
    ctx: CanvasRenderingContext2D,
    point: PerformanceDataPoint,
    width: number,
    height: number
  ) => {
    const index = filteredData.findIndex(p => p.timestamp === point.timestamp);
    if (index === -1) return;

    const x = (index / (filteredData.length - 1)) * width;
    
    // 수직선
    ctx.strokeStyle = colors.hover;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 툴팁
    const tooltipWidth = 200;
    const tooltipHeight = 80;
    const tooltipX = Math.min(x - tooltipWidth / 2, width - tooltipWidth);
    const tooltipY = 10;

    // 툴팁 배경
    ctx.fillStyle = colors.background;
    ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

    // 툴팁 테두리
    ctx.strokeStyle = colors.hover;
    ctx.lineWidth = 1;
    ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

    // 툴팁 텍스트
    ctx.font = '10px monospace';
    ctx.fillStyle = colors.text;
    ctx.fillText(`Time: ${new Date(point.timestamp).toLocaleTimeString()}`, tooltipX + 5, tooltipY + 15);
    ctx.fillText(`FPS: ${point.fps}`, tooltipX + 5, tooltipY + 30);
    ctx.fillText(`Memory: ${point.memoryUsage}MB`, tooltipX + 5, tooltipY + 45);
    ctx.fillText(`Frame Time: ${point.frameTime}ms`, tooltipX + 5, tooltipY + 60);
  };

  // 마우스 이벤트 처리
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || filteredData.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const index = Math.round((x / width) * (filteredData.length - 1));
    
    if (index >= 0 && index < filteredData.length) {
      setHoveredPoint(filteredData[index]);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // 통계 계산
  const getStats = () => {
    if (filteredData.length === 0) return null;

    const fpsValues = filteredData.map(d => d.fps);
    const memoryValues = filteredData.map(d => d.memoryUsage);
    const frameTimeValues = filteredData.map(d => d.frameTime);

    return {
      fps: {
        min: Math.min(...fpsValues),
        max: Math.max(...fpsValues),
        avg: Math.round(fpsValues.reduce((sum, val) => sum + val, 0) / fpsValues.length)
      },
      memory: {
        min: Math.min(...memoryValues),
        max: Math.max(...memoryValues),
        avg: Math.round(memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length)
      },
      frameTime: {
        min: Math.min(...frameTimeValues),
        max: Math.max(...frameTimeValues),
        avg: Math.round(frameTimeValues.reduce((sum, val) => sum + val, 0) / frameTimeValues.length)
      }
    };
  };

  const stats = getStats();

  return (
    <div style={{ 
      backgroundColor: colors.background,
      borderRadius: '8px',
      padding: '16px',
      border: `1px solid ${colors.grid}`
    }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ 
          color: colors.text, 
          margin: 0, 
          fontSize: '16px',
          fontFamily: 'monospace'
        }}>
          성능 모니터링
        </h3>
        
        {/* 메트릭 선택 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['fps', 'memory', 'frameTime', 'triangles'].map(metric => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric as any)}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                backgroundColor: selectedMetric === metric ? colors.fps : 'transparent',
                color: selectedMetric === metric ? colors.background : colors.text,
                border: `1px solid ${colors.grid}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              {metric.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 통계 정보 */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '8px',
          marginBottom: '16px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div style={{ color: colors.fps }}>
            <div>FPS: {stats.fps.avg} (min: {stats.fps.min}, max: {stats.fps.max})</div>
          </div>
          <div style={{ color: colors.memory }}>
            <div>Memory: {stats.memory.avg}MB (min: {stats.memory.min}, max: {stats.memory.max})</div>
          </div>
          <div style={{ color: colors.frameTime }}>
            <div>Frame Time: {stats.frameTime.avg}ms (min: {stats.frameTime.min}, max: {stats.frameTime.max})</div>
          </div>
        </div>
      )}

      {/* 차트 */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: 'crosshair',
            border: `1px solid ${colors.grid}`,
            borderRadius: '4px'
          }}
        />
        
        {/* Y축 라벨 */}
        <div style={{
          position: 'absolute',
          left: '-30px',
          top: '0',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: colors.text,
          fontFamily: 'monospace'
        }}>
          {[100, 75, 50, 25, 0].map(value => (
            <div key={value}>{value}</div>
          ))}
        </div>

        {/* X축 라벨 */}
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '0',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: colors.text,
          fontFamily: 'monospace'
        }}>
          {filteredData.length > 0 && (
            <>
              <div>{new Date(filteredData[0].timestamp).toLocaleTimeString()}</div>
              <div>{new Date(filteredData[filteredData.length - 1].timestamp).toLocaleTimeString()}</div>
            </>
          )}
        </div>
      </div>

      {/* 데이터 포인트 수 */}
      <div style={{
        marginTop: '8px',
        fontSize: '10px',
        color: colors.text,
        fontFamily: 'monospace',
        textAlign: 'center'
      }}>
        {filteredData.length}개 데이터 포인트 ({timeRange / 1000}초 범위)
      </div>
    </div>
  );
};

export default PerformanceVisualization;
