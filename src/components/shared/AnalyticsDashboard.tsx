'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiMousePointer,
  FiClock,
  FiTarget,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import { useEditorStore } from '../../store/editorStore';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

interface UserSession {
  id: string;
  startTime: number;
  endTime?: number;
  actions: UserAction[];
  deviceInfo: {
    userAgent: string;
    screenSize: string;
    touchSupport: boolean;
  };
}

interface UserAction {
  id: string;
  timestamp: number;
  type: 'add_furniture' | 'move_furniture' | 'delete_furniture' | 'edit_mode_toggle' | 'export_design' | 'save_design';
  details: any;
  duration?: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isOpen,
  onClose,
  isMobile = false
}) => {
  const hasLocalStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [analyticsData, setAnalyticsData] = useState<UserSession[]>([]);

  const [isRecording, setIsRecording] = useState(true);

  const placedItems = useEditorStore(state => state.placedItems);


  // 세션 초기화
  useEffect(() => {
    if (isOpen && !currentSession) {
      const newSession: UserSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        actions: [],
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          touchSupport: 'ontouchstart' in window
        }
      };
      setCurrentSession(newSession);
    }
  }, [isOpen, currentSession]);

  // 사용자 행동 추적
  useEffect(() => {
    if (!isRecording || !currentSession) return;

    const trackAction = (type: UserAction['type'], details: any = {}) => {
      const action: UserAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type,
        details
      };

      setCurrentSession(prev => prev ? {
        ...prev,
        actions: [...prev.actions, action]
      } : null);
    };

    // 가구 추가 추적
    const originalAddItem = useEditorStore.getState().addItem;
    useEditorStore.setState({
      addItem: (item) => {
        trackAction('add_furniture', { itemName: item.name, itemId: item.id });
        originalAddItem(item);
      }
    });

    // 가구 삭제 추적
    const originalRemoveItem = useEditorStore.getState().removeItem;
    useEditorStore.setState({
      removeItem: (id) => {
        trackAction('delete_furniture', { itemId: id });
        originalRemoveItem(id);
      }
    });

    // 편집 모드 토글 추적
    const originalSetMode = useEditorStore.getState().setMode;
    useEditorStore.setState({
      setMode: (mode) => {
        trackAction('edit_mode_toggle', { newMode: mode });
        originalSetMode(mode);
      }
    });

    return () => {
      // 정리 작업
    };
  }, [isRecording, currentSession]);

  // 세션 종료 및 저장
  const endSession = () => {
    if (currentSession) {
      const completedSession: UserSession = {
        ...currentSession,
        endTime: Date.now()
      };

      setAnalyticsData(prev => [...prev, completedSession]);
      setCurrentSession(null);

      // 로컬 스토리지에 저장 (SSR 가드)
      if (hasLocalStorage) {
        const existingData = JSON.parse(window.localStorage.getItem('analytics_data') || '[]');
        window.localStorage.setItem('analytics_data', JSON.stringify([...existingData, completedSession]));
      }
    }
  };

  // 분석 데이터 계산
  const analytics = useMemo(() => {
    const persisted = hasLocalStorage
      ? JSON.parse(window.localStorage.getItem('analytics_data') || '[]')
      : [];
    const sessions = analyticsData.length > 0 ? analyticsData : persisted;

    const totalSessions = sessions.length;
    const totalActions = sessions.reduce((sum: number, session: UserSession) => sum + session.actions.length, 0);
    const averageSessionDuration = sessions.length > 0
              ? sessions.reduce((sum: number, session: UserSession) => {
          const duration = session.endTime ? session.endTime - session.startTime : 0;
          return sum + duration;
        }, 0) / sessions.length / 1000 / 60 // 분 단위
      : 0;

    // 행동별 통계
    const actionStats = sessions.reduce((stats: Record<string, number>, session: UserSession) => {
      session.actions.forEach(action => {
        stats[action.type] = (stats[action.type] || 0) + 1;
      });
      return stats;
    }, {} as Record<string, number>);

    // 시간대별 활동
    const hourlyActivity = sessions.reduce((activity: Record<number, number>, session: UserSession) => {
      session.actions.forEach(action => {
        const hour = new Date(action.timestamp).getHours();
        activity[hour] = (activity[hour] || 0) + 1;
      });
      return activity;
    }, {} as Record<number, number>);

    // 디바이스별 통계
    const deviceStats = sessions.reduce((stats: Record<string, number>, session: UserSession) => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(session.deviceInfo.userAgent);
      const deviceType = isMobile ? 'mobile' : 'desktop';
      stats[deviceType] = (stats[deviceType] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    return {
      totalSessions,
      totalActions,
      averageSessionDuration,
      actionStats,
      hourlyActivity,
      deviceStats,
      sessions
    };
  }, [analyticsData]);

  // 데이터 내보내기
  const exportAnalyticsData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      analytics,
      rawSessions: analytics.sessions
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 데이터 초기화
  const clearAnalyticsData = () => {
    if (typeof window !== 'undefined') {
      if (window.confirm('모든 분석 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        if (hasLocalStorage) {
          window.localStorage.removeItem('analytics_data');
        }
        setAnalyticsData([]);
        window.alert('분석 데이터가 초기화되었습니다.');
      }
    } else {
      // SSR 환경에서는 메모리 상태만 초기화
      setAnalyticsData([]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${
            isMobile ? 'w-full max-h-[90vh]' : 'w-full max-w-4xl max-h-[80vh]'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FiBarChart2 size={24} />
                사용 분석 대시보드
              </h2>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`p-2 rounded-full transition-colors ${
                    isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  title={isRecording ? '기록 중지' : '기록 시작'}
                >
                  <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-white'}`} />
                </motion.button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="분석 대시보드 닫기"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="text-purple-100 mt-2 text-sm">
              사용자 행동 패턴을 분석하여 서비스 개선에活用합니다
            </p>
          </div>

          {/* 컨텐츠 */}
          <div className="p-6 overflow-y-auto max-h-96">
            {/* 주요 지표 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                className="bg-blue-50 p-4 rounded-xl border border-blue-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FiUsers className="text-blue-600" size={20} />
                  <span className="text-sm font-medium text-blue-800">총 세션</span>
                </div>
                <span className="text-2xl font-bold text-blue-900">{analytics.totalSessions}</span>
              </motion.div>

              <motion.div
                className="bg-green-50 p-4 rounded-xl border border-green-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FiMousePointer className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-green-800">총 행동</span>
                </div>
                <span className="text-2xl font-bold text-green-900">{analytics.totalActions}</span>
              </motion.div>

              <motion.div
                className="bg-purple-50 p-4 rounded-xl border border-purple-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FiClock className="text-purple-600" size={20} />
                  <span className="text-sm font-medium text-purple-800">평균 시간</span>
                </div>
                <span className="text-2xl font-bold text-purple-900">{analytics.averageSessionDuration.toFixed(1)}분</span>
              </motion.div>

              <motion.div
                className="bg-orange-50 p-4 rounded-xl border border-orange-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FiTarget className="text-orange-600" size={20} />
                  <span className="text-sm font-medium text-orange-800">현재 가구</span>
                </div>
                <span className="text-2xl font-bold text-orange-900">{placedItems.length}개</span>
              </motion.div>
            </div>

            {/* 행동별 통계 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiTrendingUp size={20} />
                행동별 통계
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analytics.actionStats).map(([action, count]) => (
                  <motion.div
                    key={action}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {action.replace('_', ' ')}
                      </span>
                      <span className="text-lg font-bold text-gray-900">{count as number}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <motion.div
                        className="bg-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${((count as number) / Math.max(...Object.values(analytics.actionStats) as number[])) * 100}%`
                        }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 디바이스별 통계 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">디바이스별 사용</h3>
              <div className="flex gap-4">
                {Object.entries(analytics.deviceStats).map(([device, count]) => (
                  <motion.div
                    key={device}
                    className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200 text-center"
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="text-2xl font-bold text-gray-900">{count as number}</span>
                    <p className="text-sm text-gray-600 mt-1 capitalize">{device}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 시간대별 활동 그래프 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">시간대별 활동</h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-end gap-1 h-32">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <motion.div
                      key={hour}
                      className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                      style={{
                        height: `${((analytics.hourlyActivity[hour] || 0) / Math.max(...Object.values(analytics.hourlyActivity) as number[], 1)) * 100}%`
                      }}
                      whileHover={{ scale: 1.05 }}
                      title={`${hour}:00 - ${analytics.hourlyActivity[hour] || 0}회`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>00:00</span>
                  <span>12:00</span>
                  <span>23:00</span>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                onClick={exportAnalyticsData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <FiDownload size={16} />
                데이터 내보내기
              </motion.button>

              <motion.button
                onClick={clearAnalyticsData}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <FiRefreshCw size={16} />
                데이터 초기화
              </motion.button>

              {currentSession && (
                <motion.button
                  onClick={endSession}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  세션 종료
                </motion.button>
              )}
            </div>

            {/* 개인정보 보호 안내 */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">📋 개인정보 보호</h4>
              <p className="text-sm text-yellow-700">
                수집된 데이터는 서비스 개선 목적으로만 사용되며, 개인 식별 정보는 포함되지 않습니다.
                모든 데이터는 브라우저의 로컬 스토리지에 저장됩니다.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AnalyticsDashboard;
