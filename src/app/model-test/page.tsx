'use client';

import React, { useEffect } from 'react';
import { analyzeAllModelSizes } from '../../utils/modelSizeAnalyzer';

export default function ModelTestPage() {
  useEffect(() => {
    // 페이지 로드 시 모든 모델 크기 분석
    console.log('🔍 모델 크기 분석 페이지 로드됨');
    console.log('💡 브라우저 콘솔에서 다음 명령어를 사용하세요:');
    console.log('   - analyzeAllModelSizes(): 모든 모델 크기 분석');
    console.log('   - analyzeModelSize("sofa-001"): 특정 모델 크기 분석');
    
    // 자동으로 모든 모델 분석 실행
    analyzeAllModelSizes().catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🔍 모델 크기 분석기
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            📊 분석 결과
          </h2>
          <p className="text-gray-600 mb-4">
            브라우저 개발자 도구의 콘솔을 열어서 상세한 분석 결과를 확인하세요.
          </p>
          
          <div className="bg-gray-50 rounded p-4 mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">사용 가능한 명령어:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><code className="bg-gray-200 px-2 py-1 rounded">analyzeAllModelSizes()</code> - 모든 모델 크기 분석</li>
              <li><code className="bg-gray-200 px-2 py-1 rounded">analyzeModelSize("sofa-001")</code> - 특정 모델 분석</li>
              <li><code className="bg-gray-200 px-2 py-1 rounded">analyzeModelSize("coffee-table-001")</code> - 커피 테이블 분석</li>
              <li><code className="bg-gray-200 px-2 py-1 rounded">analyzeModelSize("weirdtable")</code> - 위어드 테이블 분석</li>
              <li><code className="bg-gray-200 px-2 py-1 rounded">analyzeModelSize("testtable")</code> - 테스트 테이블 분석</li>
              <li><code className="bg-gray-200 px-2 py-1 rounded">analyzeModelSize("clock")</code> - 벽시계 분석</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 분석 정보:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 각 모델의 실제 크기와 footprint 크기를 비교</li>
              <li>• 필요한 스케일 비율 계산</li>
              <li>• 크기 차이 및 매칭 상태 평가</li>
              <li>• 조정 권장사항 제공</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            📋 GLB 모델 목록
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <h3 className="font-semibold text-gray-700">소파 (sofa-001)</h3>
              <p className="text-sm text-gray-600">Footprint: 2.2m × 0.9m × 0.8m</p>
              <p className="text-xs text-gray-500">모델: _testbed.glb</p>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold text-gray-700">커피 테이블 (coffee-table-001)</h3>
              <p className="text-sm text-gray-600">Footprint: 1.2m × 0.6m × 0.45m</p>
              <p className="text-xs text-gray-500">모델: testtable.glb</p>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold text-gray-700">위어드 테이블 (weirdtable)</h3>
              <p className="text-sm text-gray-600">Footprint: 1.6m × 1.2m × 0.8m</p>
              <p className="text-xs text-gray-500">모델: weirdtable.glb</p>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold text-gray-700">테스트 테이블 (testtable)</h3>
              <p className="text-sm text-gray-600">Footprint: 1.2m × 0.8m × 0.75m</p>
              <p className="text-xs text-gray-500">모델: testtable.glb</p>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold text-gray-700">벽시계 (clock)</h3>
              <p className="text-sm text-gray-600">Footprint: 0.4m × 0.1m × 0.4m</p>
              <p className="text-xs text-gray-500">모델: clock.glb</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
