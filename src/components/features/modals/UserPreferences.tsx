'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSave, FiFolder, FiTrash2, FiDownload, FiUpload, FiSettings } from 'react-icons/fi';
import { useEditorStore } from '../../../store/editorStore';
import { storageManager } from '../../../utils/storageManager';
import { PlacedItem } from '../../../types/editor';

interface UserPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

interface SavedDesign {
  id: string;
  name: string;
  timestamp: number;
  itemCount: number;
  description?: string;
  thumbnail?: string;
  isFavorite?: boolean;
}

export const UserPreferences: React.FC<UserPreferencesProps> = ({
  isOpen,
  onClose,
  isMobile = false
}) => {
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'settings'>('save');
  const [savedDesigns] = useState<SavedDesign[]>([]);
  const [designName, setDesignName] = useState('');
  const [designDescription, setDesignDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Zustand store에서 현재 상태 가져오기
  const placedItems = useEditorStore(state => state.placedItems);
  const { clearAllItems, addItem } = useEditorStore();

  // 저장된 디자인 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadSavedDesigns();
    }
  }, [isOpen]);

  const loadSavedDesigns = async () => {
    try {
      // const layouts = await storageManager.getAllLayouts();
        } catch (error) {
      console.error('저장된 디자인 로드 실패:', error);
    }
  };

  // 현재 디자인 저장
  const handleSaveDesign = async () => {
    if (!designName.trim()) {
      alert('디자인 이름을 입력해주세요.');
      return;
    }

    if (placedItems.length === 0) {
      alert('저장할 가구가 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const designId = `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await storageManager.saveLayout(
        designId,
        
        placedItems,
        designDescription.trim() || undefined
      );

      alert('디자인 저장이 완료되었습니다!');
      setDesignName('');
      setDesignDescription('');
      await loadSavedDesigns();
      setActiveTab('load');
        } catch (error) {
      console.error('디자인 저장 실패:', error);
      alert('디자인 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 디자인 불러오기
  const handleLoadDesign = async (designId: string) => {
    setIsLoading(true);
    try {
      const layout = await storageManager.loadLayout(designId);
      if (layout && Array.isArray(layout)) {
        // 현재 디자인을 모두 지우고 불러온 디자인으로 교체
        clearAllItems();

        // 불러온 아이템들을 추가
        layout.forEach((item: PlacedItem) => {
          addItem(item);
        });

        alert(`디자인이 불러와졌습니다!`);
        onClose();
      }
        } catch (error) {
      console.error('디자인 불러오기 실패:', error);
      alert('디자인 불러오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 디자인 삭제
  const handleDeleteDesign = async (designId: string, designName: string) => {
    if (!confirm(`"${designName}" 디자인을 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await storageManager.deleteLayout(designId);
      await loadSavedDesigns();
      alert('디자인이 삭제되었습니다.');
        } catch (error) {
      console.error('디자인 삭제 실패:', error);
      alert('디자인 삭제에 실패했습니다.');
    }
  };

  // 디자인 내보내기 (JSON 파일)
  const handleExportDesign = async (designId: string, designName: string) => {
    try {
      const layout = await storageManager.loadLayout(designId);
      if (layout) {
        const dataStr = JSON.stringify(layout, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${designName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
        } catch (error) {
      console.error('디자인 내보내기 실패:', error);
      alert('디자인 내보내기에 실패했습니다.');
    }
  };

  // 디자인 가져오기 (JSON 파일)
  const handleImportDesign = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const layout = JSON.parse(content);

        // 유효성 검사
        if (!layout.metadata || !layout.data || !layout.data.items) {
          throw new Error('유효하지 않은 디자인 파일입니다.');
        }

        const designId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newLayout = {
          ...layout,
          metadata: {
            ...layout.metadata,
            id: designId,
            name: `${layout.metadata.name} (가져옴)`,
            timestamp: Date.now()
          }
        };

        await storageManager.saveLayout(
          designId,
          newLayout.metadata.name,
          newLayout.data.items,
          newLayout.metadata.description
        );

        await loadSavedDesigns();
        alert('디자인이 성공적으로 가져와졌습니다!');
          } catch (error) {
        console.error('디자인 가져오기 실패:', error);
        alert('디자인 파일을 불러오는데 실패했습니다.');
      }
    };

    reader.readAsText(file);
    // 같은 파일을 다시 선택할 수 있도록 초기화
    event.target.value = '';
  };

  // 날짜 포맷팅
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${
          isMobile ? 'p-2' : 'p-4'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${
            isMobile ? 'w-full max-h-[90vh]' : 'w-full max-w-2xl max-h-[80vh]'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FiSettings size={24} />
                사용자 환경 설정
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'save', label: '저장', icon: FiSave },
              { id: 'load', label: '불러오기', icon: FiFolder },
              { id: 'settings', label: '설정', icon: FiSettings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          {/* 탭 컨텐츠 */}
          <div className="p-6 overflow-y-auto max-h-96">
            {activeTab === 'save' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    디자인 이름 *
                  </label>
                  <input
                    type="text"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="예: 나의 아늑한 거실"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명 (선택사항)
                  </label>
                  <textarea
                    value={designDescription}
                    onChange={(e) => setDesignDescription(e.target.value)}
                    placeholder="이 디자인에 대한 간단한 설명을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    maxLength={200}
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">현재 디자인 정보</h4>
                  <p className="text-sm text-gray-600">
                    • 가구 개수: {placedItems.length}개<br/>
                    • 저장 시각: {formatDate(Date.now())}
                  </p>
                </div>

                <motion.button
                  onClick={handleSaveDesign}
                  disabled={isLoading || !designName.trim()}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isLoading || !designName.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  whileTap={{ scale: isLoading || !designName.trim() ? 1 : 0.95 }}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <FiSave size={18} />
                      디자인 저장하기
                    </>
                  )}
                </motion.button>
              </div>
            )}

            {activeTab === 'load' && (
              <div className="space-y-4">
                {/* 가져오기 버튼 */}
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportDesign}
                      className="hidden"
                    />
                    <motion.div
                      className="w-full py-3 px-4 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-green-600 transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiUpload size={18} />
                      디자인 가져오기
                    </motion.div>
                  </label>
                </div>

                {/* 저장된 디자인 목록 */}
                {savedDesigns.length === 0 ? (
                  <div className="text-center py-12">
                    <FiFolder size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">저장된 디자인이 없습니다</h3>
                    <p className="text-gray-500">먼저 디자인을 저장해보세요</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedDesigns.map((design) => (
                      <motion.div
                        key={design.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{design.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(design.timestamp)} • {design.itemCount}개 가구
                            </p>
                            {design.description && (
                              <p className="text-sm text-gray-600 mt-2">{design.description}</p>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            <motion.button
                              onClick={() => handleLoadDesign(design.id)}
                              disabled={isLoading}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              whileTap={{ scale: 0.95 }}
                              title="불러오기"
                            >
                              <FiFolder size={18} />
                            </motion.button>

                            <motion.button
                              onClick={() => handleExportDesign(design.id, design.name)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              whileTap={{ scale: 0.95 }}
                              title="내보내기"
                            >
                              <FiDownload size={18} />
                            </motion.button>

                            <motion.button
                              onClick={() => handleDeleteDesign(design.id, design.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              whileTap={{ scale: 0.95 }}
                              title="삭제"
                            >
                              <FiTrash2 size={18} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">저장소 설정</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        최대 저장 디자인 수
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="5">5개</option>
                        <option value="10">10개</option>
                        <option value="20">20개</option>
                        <option value="50">50개</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        자동 저장 간격
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="30000">30초</option>
                        <option value="60000">1분</option>
                        <option value="300000">5분</option>
                        <option value="600000">10분</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="w-full py-2 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors">
                    모든 데이터 초기화
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserPreferences;
