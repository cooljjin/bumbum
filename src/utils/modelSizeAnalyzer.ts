import { loadModel } from './modelLoader';
import { sampleFurniture } from '../data/furnitureCatalog';
import * as THREE from 'three';

/**
 * 모든 GLB 모델의 크기를 분석하는 함수
 */
export async function analyzeAllModelSizes(): Promise<void> {
  // console.log('🔍 모든 GLB 모델 크기 분석 시작...\n');
  
  const glbModels = sampleFurniture.filter(item => item.modelPath && item.modelPath.endsWith('.glb'));
  
  // console.log(`📊 총 ${glbModels.length}개의 GLB 모델 발견:`);
  glbModels.forEach((item, index) => {
    // console.log(`   ${index + 1}. ${item.nameKo} (${item.id}) - ${item.modelPath}`);
  });
  // console.log('\n');
  
  for (const furniture of glbModels) {
    try {
      // console.log(`\n🎯 분석 중: ${furniture.nameKo}`);
      // console.log(`   📁 모델 경로: ${furniture.modelPath}`);
      // console.log(`   📏 Footprint: ${furniture.footprint.width}m × ${furniture.footprint.height}m × ${furniture.footprint.depth}m`);
      
      const model = await loadModel(furniture.modelPath!, {
        useCache: false, // 캐시 비활성화로 정확한 분석
        priority: 'high'
      });
      
      // 모델 크기 분석
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      // console.log(`   📐 실제 모델 크기: ${size.x.toFixed(3)}m × ${size.y.toFixed(3)}m × ${size.z.toFixed(3)}m`);
      // console.log(`   🎯 모델 중심점: (${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
      
      // 스케일 비율 계산
      const scaleX = furniture.footprint.width / size.x;
      const scaleY = furniture.footprint.height / size.y;
      const scaleZ = furniture.footprint.depth / size.z;
      
      // console.log(`   🔧 필요한 스케일: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}, Z=${scaleZ.toFixed(3)}`);
      
      // 크기 차이 분석
      const diffX = Math.abs(size.x - furniture.footprint.width);
      const diffY = Math.abs(size.y - furniture.footprint.height);
      const diffZ = Math.abs(size.z - furniture.footprint.depth);
      
      // console.log(`   📊 크기 차이: X=${diffX.toFixed(3)}m, Y=${diffY.toFixed(3)}m, Z=${diffZ.toFixed(3)}m`);
      
      // 매칭 상태 평가
      const tolerance = 0.01; // 1cm 허용 오차
      const isMatched = diffX < tolerance && diffY < tolerance && diffZ < tolerance;
      
      if (isMatched) {
        // console.log(`   ✅ 크기 매칭: 완벽하게 일치`);
      } else {
        // console.log(`   ⚠️ 크기 불일치: 조정 필요`);
        
        // 조정 권장사항
        if (scaleX > 2 || scaleX < 0.5) {
          // console.log(`   💡 X축 스케일이 ${scaleX.toFixed(3)}로 너무 크거나 작습니다. 모델 크기나 footprint를 재검토하세요.`);
        }
        if (scaleY > 2 || scaleY < 0.5) {
          // console.log(`   💡 Y축 스케일이 ${scaleY.toFixed(3)}로 너무 크거나 작습니다. 모델 크기나 footprint를 재검토하세요.`);
        }
        if (scaleZ > 2 || scaleZ < 0.5) {
          // console.log(`   💡 Z축 스케일이 ${scaleZ.toFixed(3)}로 너무 크거나 작습니다. 모델 크기나 footprint를 재검토하세요.`);
        }
      }
      
      // console.log(`   ✅ ${furniture.nameKo} 분석 완료`);
      
    } catch (error) {
      console.error(`   ❌ ${furniture.nameKo} 분석 실패:`, error);
    }
  }
  
  // console.log('\n🎉 모든 모델 크기 분석 완료!');
}

/**
 * 특정 모델의 크기를 분석하는 함수
 */
export async function analyzeModelSize(furnitureId: string): Promise<void> {
  const furniture = sampleFurniture.find(item => item.id === furnitureId);
  
  if (!furniture) {
    console.error(`❌ 가구를 찾을 수 없습니다: ${furnitureId}`);
    return;
  }
  
  if (!furniture.modelPath || !furniture.modelPath.endsWith('.glb')) {
    console.error(`❌ GLB 모델이 아닙니다: ${furnitureId}`);
    return;
  }
  
  // console.log(`🔍 모델 크기 분석: ${furniture.nameKo}`);
  // console.log(`   📁 모델 경로: ${furniture.modelPath}`);
  // console.log(`   📏 Footprint: ${furniture.footprint.width}m × ${furniture.footprint.height}m × ${furniture.footprint.depth}m`);
  
  try {
    const model = await loadModel(furniture.modelPath, {
      useCache: false,
      priority: 'high'
    });
    
    // 모델 크기 분석
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // console.log(`   📐 실제 모델 크기: ${size.x.toFixed(3)}m × ${size.y.toFixed(3)}m × ${size.z.toFixed(3)}m`);
    // console.log(`   🎯 모델 중심점: (${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
    
    // 스케일 비율 계산
    const scaleX = furniture.footprint.width / size.x;
    const scaleY = furniture.footprint.height / size.y;
    const scaleZ = furniture.footprint.depth / size.z;
    
    // console.log(`   🔧 필요한 스케일: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}, Z=${scaleZ.toFixed(3)}`);
    
    // 크기 차이 분석
    const diffX = Math.abs(size.x - furniture.footprint.width);
    const diffY = Math.abs(size.y - furniture.footprint.height);
    const diffZ = Math.abs(size.z - furniture.footprint.depth);
    
    // console.log(`   📊 크기 차이: X=${diffX.toFixed(3)}m, Y=${diffY.toFixed(3)}m, Z=${diffZ.toFixed(3)}m`);
    
    // 매칭 상태 평가
    const tolerance = 0.01; // 1cm 허용 오차
    const isMatched = diffX < tolerance && diffY < tolerance && diffZ < tolerance;
    
    if (isMatched) {
      // console.log(`   ✅ 크기 매칭: 완벽하게 일치`);
    } else {
      // console.log(`   ⚠️ 크기 불일치: 조정 필요`);
    }
    
  } catch (error) {
    console.error(`   ❌ 모델 분석 실패:`, error);
  }
}

// 전역에서 사용할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  (window as any).analyzeAllModelSizes = analyzeAllModelSizes;
  (window as any).analyzeModelSize = analyzeModelSize;
}
