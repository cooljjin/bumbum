'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { ColorTestComponent } from '../../components/features/furniture/ColorTestComponent';

export default function ColorTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          🎨 가구 색상 변경 테스트
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <Canvas
            camera={{ position: [0, 2, 5], fov: 50 }}
            style={{ width: '100%', height: '400px' }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            
            <ColorTestComponent modelPath="/models/furniture/Cozy_bed_0909043453_texture.glb" />
          </Canvas>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">테스트 결과</h2>
          <div className="space-y-2 text-sm">
            <p>✅ 모델 분석: Cozy bed 모델의 구조를 분석합니다</p>
            <p>✅ 이불 색상 변경: 이불 부분만 색상을 변경합니다</p>
            <p>✅ 실시간 변경: 버튼 클릭으로 즉시 색상이 변경됩니다</p>
            <p>✅ 원본 복원: 원본 색상으로 되돌릴 수 있습니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}
