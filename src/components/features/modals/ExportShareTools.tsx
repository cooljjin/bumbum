'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDownload,
  FiShare2,
  FiImage,
  FiFileText,
  FiCopy,
  
  
  FiLink
} from 'react-icons/fi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useEditorStore } from '../../../store/editorStore';

interface ExportShareToolsProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  isMobile?: boolean;
}

type ExportFormat = 'png' | 'jpg' | 'pdf' | 'json';

export const ExportShareTools: React.FC<ExportShareToolsProps> = ({
  isOpen,
  onClose,
  canvasRef,
  isMobile = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [showShareOptions, setShowShareOptions] = useState(false);

  const placedItems = useEditorStore(state => state.placedItems);

  // 3D 캔버스 스크린샷 캡처
  const captureScreenshot = async (
    format: 'png' | 'jpg' = 'png',
    quality: number = 0.95
  ): Promise<string> => {
    if (!canvasRef?.current) {
      throw new Error('3D 캔버스를 찾을 수 없습니다.');
    }

    setExportProgress(20);

    const canvas = canvasRef.current;
    const screenshotCanvas = await html2canvas(canvas, {
      useCORS: true,
      allowTaint: false,
      width: canvas.width,
      height: canvas.height,
      background: '#f8fafc'
    });

    setExportProgress(60);

    return screenshotCanvas.toDataURL(`image/${format}`, quality);
  };

  // PDF 생성
  const generatePDF = async (imageData: string): Promise<Blob> => {
    setExportProgress(80);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // PDF에 이미지 추가
    const imgWidth = 297; // A4 가로 (mm)
    const imgHeight = 210; // A4 세로 (mm)
    const aspectRatio = 297 / 210;

    let finalWidth = imgWidth;
    let finalHeight = imgHeight;

    // 이미지 비율에 맞게 조정
    if (aspectRatio > 1) {
      finalHeight = imgWidth / aspectRatio;
    } else {
      finalWidth = imgHeight * aspectRatio;
    }

    const x = (297 - finalWidth) / 2;
    const y = (210 - finalHeight) / 2;

    pdf.addImage(imageData, 'JPEG', x, y, finalWidth, finalHeight);

    // 디자인 정보 추가
    pdf.setFontSize(12);
    pdf.text('가구 배치 디자인', 20, 20);
    pdf.text(`총 가구 수: ${placedItems.length}개`, 20, 35);

    // 가구 목록 추가
    placedItems.forEach((item, index) => {
      const yPos = 50 + (index * 10);
      if (yPos < 180) { // 페이지 범위 내에서만
        pdf.text(`${item.name} (${item.footprint.width}×${item.footprint.depth}m)`, 20, yPos);
      }
    });

    setExportProgress(100);
    return pdf.output('blob');
  };

  // 디자인 데이터를 JSON으로 내보내기
  const exportDesignData = (): string => {
    const designData = {
      metadata: {
        exportDate: new Date().toISOString(),
        itemCount: placedItems.length,
        version: '2.1.0'
      },
      items: placedItems,
      settings: {
        gridEnabled: true,
        snapToGrid: true
      }
    };

    return JSON.stringify(designData, null, 2);
  };

  // 파일 다운로드 헬퍼
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 내보내기 핸들러
  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      switch (format) {
        case 'png':
        case 'jpg':
          setExportProgress(10);
          const imageData = await captureScreenshot(format, 0.95);
          const imageBlob = await fetch(imageData).then(res => res.blob());
          downloadFile(imageBlob, `room-design.${format}`);
          break;

        case 'pdf':
          const pdfImageData = await captureScreenshot('jpg', 0.95);
          const pdfBlob = await generatePDF(pdfImageData);
          downloadFile(pdfBlob, 'room-design.pdf');
          break;

        case 'json':
          const jsonData = exportDesignData();
          const jsonBlob = new Blob([jsonData], { type: 'application/json' });
          downloadFile(jsonBlob, 'room-design.json');
          break;
      }

      // 성공 메시지
      alert(`${format.toUpperCase()} 파일이 성공적으로 내보내졌습니다!`);

    } catch (error) {
      console.error('내보내기 실패:', error);
      alert('내보내기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // 공유 URL 생성
  const generateShareUrl = async () => {
    try {
      const designData = exportDesignData();
      const compressedData = btoa(encodeURIComponent(designData));

      // 실제로는 서버에 업로드하고 공유 URL을 받아와야 함
      // 여기서는 임시로 로컬 스토리지에 저장
      const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(`shared_design_${shareId}`, compressedData);

      const url = `${window.location.origin}/shared/${shareId}`;
      setShareUrl(url);
      setShowShareOptions(true);

      // 클립보드에 복사
      await navigator.clipboard.writeText(url);
      alert('공유 링크가 클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('공유 URL 생성 실패:', error);
      alert('공유 링크 생성에 실패했습니다.');
    }
  };

  // 소셜 공유
  const shareToSocial = (platform: string) => {
    if (!shareUrl) return;

    const text = encodeURIComponent('내 가구 배치 디자인을 확인해보세요!');
    const url = encodeURIComponent(shareUrl);

    let shareLink = '';

    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'kakao':
        // 카카오톡 공유 (웹 공유 API 사용)
        if (navigator.share) {
          navigator.share({
            title: '가구 배치 디자인',
            text: '내 가구 배치 디자인을 확인해보세요!',
            url: shareUrl
          });
        } else {
          shareLink = `https://story.kakao.com/s/share?url=${url}`;
        }
        break;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" data-testid="export-modal">
        <motion.div
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${
            isMobile ? 'w-full max-h-[90vh]' : 'w-full max-w-lg max-h-[80vh]'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2" data-testid="export-title">
                <FiDownload size={24} />
                내보내기 및 공유
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="내보내기 창 닫기"
                data-testid="export-close"
              >
                ✕
              </button>
            </div>
            <p className="text-green-100 mt-2 text-sm">
              디자인을 이미지, PDF, 또는 공유 링크로 내보내세요
            </p>
          </div>

          {/* 내보내기 옵션들 */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* 이미지 내보내기 */}
              <motion.button
                onClick={() => handleExport('png')}
                disabled={isExporting}
                className="flex flex-col items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-colors disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
                data-testid="export-image"
              >
                <FiImage size={32} className="text-blue-600" />
                <span className="font-medium text-blue-800">이미지</span>
                <span className="text-xs text-blue-600">PNG/JPG</span>
              </motion.button>

              {/* PDF 내보내기 */}
              <motion.button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="flex flex-col items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl border-2 border-red-200 hover:border-red-300 transition-colors disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
                data-testid="export-pdf"
              >
                <FiFileText size={32} className="text-red-600" />
                <span className="font-medium text-red-800">PDF</span>
                <span className="text-xs text-red-600">보고서</span>
              </motion.button>

              {/* JSON 내보내기 */}
              <motion.button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="flex flex-col items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
                data-testid="export-json"
              >
                <FiDownload size={32} className="text-purple-600" />
                <span className="font-medium text-purple-800">데이터</span>
                <span className="text-xs text-purple-600">JSON</span>
              </motion.button>

              {/* 공유 */}
              <motion.button
                onClick={generateShareUrl}
                disabled={isExporting}
                className="flex flex-col items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl border-2 border-green-200 hover:border-green-300 transition-colors disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
                data-testid="export-share"
              >
                <FiShare2 size={32} className="text-green-600" />
                <span className="font-medium text-green-800">공유</span>
                <span className="text-xs text-green-600">링크</span>
              </motion.button>
            </div>

            {/* 진행 상태 표시 */}
            {isExporting && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">내보내기 진행 중...</span>
                  <span className="text-sm text-gray-500">{exportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${exportProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* 공유 옵션들 */}
            <AnimatePresence>
              {showShareOptions && shareUrl && (
                <motion.div
                  className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <FiLink size={16} />
                    공유 링크
                  </h3>

                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                      data-testid="share-url-input"
                    />
                    <motion.button
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      whileTap={{ scale: 0.95 }}
                      data-testid="share-copy"
                    >
                      <FiCopy size={16} />
                    </motion.button>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => shareToSocial('kakao')}
                      className="flex-1 py-2 px-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                      whileTap={{ scale: 0.95 }}
                      data-testid="share-kakao"
                    >
                      카카오톡
                    </motion.button>
                    <motion.button
                      onClick={() => shareToSocial('facebook')}
                      className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      whileTap={{ scale: 0.95 }}
                      data-testid="share-facebook"
                    >
                      페이스북
                    </motion.button>
                    <motion.button
                      onClick={() => shareToSocial('twitter')}
                      className="flex-1 py-2 px-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium"
                      whileTap={{ scale: 0.95 }}
                      data-testid="share-twitter"
                    >
                      트위터
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 디자인 정보 */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200" data-testid="export-info">
              <h3 className="font-medium text-gray-800 mb-2" data-testid="export-info-title">현재 디자인 정보</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• 가구 개수: {placedItems.length}개</p>
                <p>• 내보내기 형식: PNG, JPG, PDF, JSON</p>
                <p>• 공유: 링크 생성 및 소셜 미디어</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExportShareTools;
