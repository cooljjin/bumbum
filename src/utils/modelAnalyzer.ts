import * as THREE from 'three';

export class ModelAnalyzer {
  static analyzeModel(model: THREE.Group): void {
    console.log('=== 모델 구조 분석 ===');
    console.log(`모델 이름: ${model.name}`);
    console.log(`자식 요소 수: ${model.children.length}`);
    
    let meshCount = 0;
    let materialCount = 0;
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshCount++;
        console.log(`\n메시 #${meshCount}:`);
        console.log(`  이름: "${child.name}"`);
        console.log(`  위치: (${child.position.x.toFixed(3)}, ${child.position.y.toFixed(3)}, ${child.position.z.toFixed(3)})`);
        console.log(`  크기: (${child.scale.x.toFixed(3)}, ${child.scale.y.toFixed(3)}, ${child.scale.z.toFixed(3)})`);
        
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material, index) => {
            materialCount++;
            console.log(`  재질 ${index + 1}:`);
            console.log(`    이름: "${material.name}"`);
            console.log(`    타입: ${material.type}`);
            console.log(`    색상: #${material.color.getHexString()}`);
            console.log(`    메탈릭: ${material.metalness || 'N/A'}`);
            console.log(`    거칠기: ${material.roughness || 'N/A'}`);
          });
        }
        console.log('  ---');
      }
    });
    
    console.log(`\n총 메시 수: ${meshCount}`);
    console.log(`총 재질 수: ${materialCount}`);
  }

  static findMeshesByKeyword(model: THREE.Group, keyword: string): THREE.Mesh[] {
    const foundMeshes: THREE.Mesh[] = [];
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        const materialName = child.material ? 
          (Array.isArray(child.material) ? child.material[0].name : child.material.name) : '';
        
        if (name.includes(keyword.toLowerCase()) || 
            materialName.toLowerCase().includes(keyword.toLowerCase())) {
          foundMeshes.push(child);
        }
      }
    });
    
    return foundMeshes;
  }

  static getModelInfo(model: THREE.Group): {
    meshCount: number;
    materialCount: number;
    meshes: Array<{
      name: string;
      position: THREE.Vector3;
      materialNames: string[];
    }>;
  } {
    const meshes: Array<{
      name: string;
      position: THREE.Vector3;
      materialNames: string[];
    }> = [];
    
    let meshCount = 0;
    let materialCount = 0;
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshCount++;
        const materialNames: string[] = [];
        
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(material => {
            materialCount++;
            materialNames.push(material.name || 'unnamed');
          });
        }
        
        meshes.push({
          name: child.name,
          position: child.position.clone(),
          materialNames
        });
      }
    });
    
    return {
      meshCount,
      materialCount,
      meshes
    };
  }
}
