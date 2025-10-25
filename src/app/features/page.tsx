'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEdit3, FiMove, FiRotateCw, FiMaximize2, FiTrash2, FiSave, FiDownload, FiGrid, FiHome } from 'react-icons/fi';

interface FeatureSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  details: string[];
  tips?: string[];
}

const featureSections: FeatureSection[] = [
  {
    id: '3d-room',
    title: '3D 룸 에디터',
    icon: <FiHome size={32} />,
    description: '실시간 3D 렌더링으로 가구 배치를 시각화하고 편집할 수 있습니다.',
    details: [
      '실시간 3D 렌더링',
      '자유로운 카메라 조작 (드래그, 줌)',
      '시점 고정 기능',
      '그리드 표시 옵션',
      '벽 투명도 자동 조절'
    ],
    tips: [
      '마우스를 드래그하여 카메라를 회전할 수 있습니다',
      '휠을 사용하여 확대/축소가 가능합니다',
      '시점 고정을 활성화하면 카메라가 고정됩니다'
    ]
  },
  {
    id: 'furniture-placement',
    title: '가구 배치',
    icon: <FiEdit3 size={32} />,
    description: '다양한 가구를 3D 공간에 자유롭게 배치하고 관리할 수 있습니다.',
    details: [
      '12개 이상의 내장 가구',
      '커스텀 가구 업로드 지원 (GLB 형식)',
      '가구 카탈로그 검색 및 필터링',
      '드래그 앤 드롭 배치',
      '충돌 감지 및 자동 위치 조정',
      '벽 부착 가구 지원 (시계, 문 등)'
    ],
    tips: [
      '가구를 클릭하고 드래그하여 위치를 변경할 수 있습니다',
      '벽 부착 가구는 벽면에만 배치됩니다',
      '충돌하는 위치에는 배치할 수 없습니다'
    ]
  },
  {
    id: 'editing-tools',
    title: '편집 도구',
    icon: <FiMove size={32} />,
    description: '강력한 편집 도구로 가구를 세밀하게 조정할 수 있습니다.',
    details: [
      '이동 도구 (G 키)',
      '회전 도구 (R 키)',
      '크기 조절 도구 (S 키)',
      '선택 도구 (Q 키)',
      '실행 취소/다시 실행 (Ctrl+Z/Y)',
      '가구 삭제 (Delete 키)'
    ],
    tips: [
      '키보드 단축키를 사용하면 더 빠르게 편집할 수 있습니다',
      '그리드 스냅 기능으로 정렬을 도와줍니다'
    ]
  },
  {
    id: 'color-customization',
    title: '색상 커스터마이징',
    icon: <FiRotateCw size={32} />,
    description: '가구의 색상을 자유롭게 변경하여 나만의 스타일을 만들 수 있습니다.',
    details: [
      '6가지 프리셋 색상',
      '실시간 색상 미리보기',
      '원본 색상 복원 기능',
      '가구별 색상 저장'
    ],
    tips: [
      '일부 가구는 색상 변경이 지원되지 않을 수 있습니다',
      '색상 패널은 가구 선택 시 자동으로 표시됩니다'
    ]
  },
  {
    id: 'templates',
    title: '룸 템플릿',
    icon: <FiGrid size={32} />,
    description: '미리 디자인된 템플릿을 사용하여 빠르게 룸을 구성할 수 있습니다.',
    details: [
      '거실, 침실, 서재 등 다양한 템플릿',
      '원클릭 적용',
      '템플릿 기반 커스터마이징',
      '나만의 템플릿 저장'
    ],
    tips: [
      '템플릿을 적용하면 기존 가구는 모두 제거됩니다',
      '템플릿 적용 후에도 자유롭게 편집할 수 있습니다'
    ]
  },
  {
    id: 'save-export',
    title: '저장 및 내보내기',
    icon: <FiSave size={32} />,
    description: '디자인을 저장하고 다양한 형식으로 내보낼 수 있습니다.',
    details: [
      '자동 저장 기능',
      '여러 디자인 관리',
      'JSON 파일로 내보내기',
      '이미지(PNG) 내보내기',
      '디자인 불러오기',
      '디자인 삭제'
    ],
    tips: [
      '작업 내용은 자동으로 저장됩니다',
      '내보낸 JSON 파일을 다시 불러올 수 있습니다'
    ]
  },
  {
    id: 'performance',
    title: '성능 최적화',
    icon: <FiMaximize2 size={32} />,
    description: '다양한 디바이스에서 최적의 성능을 제공합니다.',
    details: [
      '적응형 렌더링 품질',
      'Frustum culling',
      '모델 캐싱 시스템',
      '메모리 자동 관리',
      '모바일 최적화'
    ],
    tips: [
      '성능이 낮은 디바이스에서는 자동으로 품질이 조정됩니다',
      '설정에서 수동으로 성능 옵션을 조정할 수 있습니다'
    ]
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <FiArrowLeft size={20} />
              <span className="font-medium">홈으로 돌아가기</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">
              기능 소개
            </h1>
            <div className="w-[120px]" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            bumbum의 강력한 기능들
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            3D 공간에서 가구를 자유롭게 배치하고, 나만의 인테리어를 디자인하세요.
          </p>
        </motion.div>

        {/* Feature Sections */}
        <div className="space-y-12">
          {featureSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-gray-600">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 주요 기능 */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      주요 기능
                    </h4>
                    <ul className="space-y-2">
                      {section.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-blue-500 mt-1">✓</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 팁 */}
                  {section.tips && section.tips.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        사용 팁
                      </h4>
                      <ul className="space-y-2">
                        {section.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-purple-500">💡</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">지금 바로 시작하세요!</h3>
            <p className="text-lg text-blue-100 mb-6">
              모든 기능이 무료로 제공됩니다
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
            >
              <FiEdit3 />
              에디터로 이동
            </Link>
          </div>
        </motion.div>

        {/* Keyboard Shortcuts Reference */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-12 bg-white rounded-2xl shadow-lg p-8"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            키보드 단축키
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">편집 도구</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">선택 도구</span>
                  <kbd className="px-3 py-1 bg-gray-100 rounded font-mono text-sm">Q</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">이동 도구</span>
                  <kbd className="px-3 py-1 bg-gray-100 rounded font-mono text-sm">G</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">회전 도구</span>
                  <kbd className="px-3 py-1 bg-gray-100 rounded font-mono text-sm">R</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">크기 조절 도구</span>
                  <kbd className="px-3 py-1 bg-gray-100 rounded font-mono text-sm">S</kbd>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">작업 관리</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">실행 취소</span>
                  <kbd className="px-3 py-1 bg-gray-100 rounded font-mono text-sm">Ctrl+Z</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">다시 실행</span>
                  <kbd className="px-3 py-1 bg-gray-100 rounded font-mono text-sm">Ctrl+Y</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">선택된 항목 삭제</span>
                  <kbd className="px-3 py-1 bg-gray-100 rounded font-mono text-sm">Delete</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">선택 해제</span>
                  <kbd className="px-3 py-1 bg-gray-100 rounded font-mono text-sm">Escape</kbd>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2025 bumbum. All rights reserved.</p>
            <p className="mt-2">
              문의사항이 있으시면 언제든지 연락주세요.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

