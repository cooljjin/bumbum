'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiArrowLeft, FiX, FiCheck } from 'react-icons/fi';

interface OnboardingStep {
  title: string;
  description: string;
  content: React.ReactNode;
  icon?: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: '환영합니다! 🎉',
    description: 'bumbum 3D 가구 라이브러리 및 룸 에디터에 오신 것을 환영합니다.',
    icon: '👋',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          bumbum은 3D 공간에서 가구를 자유롭게 배치하고 편집할 수 있는 인터랙티브 룸 에디터입니다.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>간단한 튜토리얼</strong>을 통해 주요 기능을 배워보세요!
          </p>
        </div>
      </div>
    )
  },
  {
    title: '편집 모드 시작하기',
    description: '편집 모드를 활성화하여 가구를 배치하고 수정할 수 있습니다.',
    icon: '✏️',
    content: (
      <div className="space-y-4">
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              ✏️
            </div>
            <span className="font-semibold text-gray-800">편집 모드 버튼</span>
          </div>
          <p className="text-sm text-gray-600">
            헤더의 "편집 모드 시작" 버튼을 클릭하면 가구 배치와 편집이 가능합니다.
          </p>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>편집 모드에서는 가구 카탈로그, 템플릿, 방 크기 조절 도구에 접근할 수 있습니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>실행취소/다시실행 기능도 사용할 수 있습니다.</span>
          </li>
        </ul>
      </div>
    )
  },
  {
    title: '가구 배치하기',
    description: '가구 카탈로그에서 원하는 가구를 선택하여 3D 룸에 배치할 수 있습니다.',
    icon: '🪑',
    content: (
      <div className="space-y-4">
        <div className="bg-white border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl">
              🪑
            </div>
            <span className="font-semibold text-gray-800">가구 카탈로그</span>
          </div>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-green-600">1.</span>
              <span>편집 툴바에서 "🪑 가구" 버튼을 클릭합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-green-600">2.</span>
              <span>카탈로그에서 원하는 가구를 선택합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-green-600">3.</span>
              <span>3D 룸의 원하는 위치를 클릭하여 배치하거나 "중앙에 배치" 버튼을 클릭합니다.</span>
            </li>
          </ol>
        </div>
        <p className="text-xs text-gray-500">
          💡 팁: 가구를 선택한 후 드래그하여 위치를 변경할 수 있습니다.
        </p>
      </div>
    )
  },
  {
    title: '가구 편집하기',
    description: '배치한 가구를 선택하여 이동, 회전, 크기 조절이 가능합니다.',
    icon: '🎨',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-purple-50 p-3 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">이동</h4>
            <p className="text-sm text-gray-600">가구를 클릭하고 드래그하여 원하는 위치로 이동</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">회전</h4>
            <p className="text-sm text-gray-600">가구를 선택 후 회전 핸들을 드래그</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">색상 변경</h4>
            <p className="text-sm text-gray-600">색상 패널에서 원하는 색상 선택</p>
          </div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ 일부 가구는 색상 변경이 지원되지 않을 수 있습니다.
          </p>
        </div>
      </div>
    )
  },
  {
    title: '시작할 준비가 되었습니다!',
    description: '이제 나만의 3D 공간을 디자인해보세요.',
    icon: '🚀',
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">추가 기능</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>시점 고정</strong>: 카메라 회전을 고정하여 안정적인 시점 유지</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>설정</strong>: 성능 옵션, 그리드 표시 등 세부 설정 조정</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>디자인 저장</strong>: 작업한 디자인을 저장하고 불러오기</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>내보내기</strong>: 디자인을 이미지나 JSON 파일로 내보내기</span>
            </li>
          </ul>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            언제든지 설정에서 이 가이드를 다시 볼 수 있습니다.
          </p>
        </div>
      </div>
    )
  }
];

export function OnboardingModal({
  isOpen,
  onClose,
  isMobile = false,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onComplete
}: OnboardingModalProps) {
  const totalSteps = onboardingSteps.length;
  const step = onboardingSteps[currentStep] || onboardingSteps[0];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 마지막 단계에서만 backdrop 클릭 허용
    if (isLastStep) {
      onSkip();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
              isMobile ? 'w-[90vw] max-w-md' : 'w-full max-w-2xl'
            } mx-4 bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{step.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-blue-100 text-sm mt-1">{step.description}</p>
                  </div>
                </div>
                <button
                  onClick={onSkip}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="건너뛰기"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              {/* Progress Indicator */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-100">
                    {currentStep + 1} / {totalSteps}
                  </span>
                  <span className="text-xs text-blue-100">
                    {Math.round(((currentStep + 1) / totalSteps) * 100)}% 완료
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className={`p-6 ${isMobile ? 'min-h-[300px]' : 'min-h-[350px]'}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {step.content}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                {/* 이전 버튼 */}
                <button
                  onClick={onPrev}
                  disabled={isFirstStep}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isFirstStep
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="이전"
                >
                  <FiArrowLeft />
                  이전
                </button>

                {/* 건너뛰기 버튼 (마지막 단계 아닐 때만) */}
                {!isLastStep && (
                  <button
                    onClick={onSkip}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                  >
                    건너뛰기
                  </button>
                )}

                {/* 다음/완료 버튼 */}
                <button
                  onClick={handleNext}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                    isLastStep
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  aria-label={isLastStep ? '완료' : '다음'}
                >
                  {isLastStep ? (
                    <>
                      시작하기
                      <FiCheck />
                    </>
                  ) : (
                    <>
                      다음
                      <FiArrowRight />
                    </>
                  )}
                </button>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'w-8 bg-blue-500'
                        : index < currentStep
                        ? 'w-2 bg-blue-300'
                        : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default OnboardingModal;

