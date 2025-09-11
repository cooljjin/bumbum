import * as THREE from 'three';

export interface ColorGroup {
  groupName: string;
  meshNames?: string[];
  materialNames?: string[];
  color: string;
}

export interface FurnitureColorConfig {
  id: string;
  name: string;
  nameKo: string;
  color: string;
  materialGroups: ColorGroup[];
}

export class FurnitureColorChanger {
  private static originalColors = new Map<THREE.Material, THREE.Color>();

  static changeFurnitureColor(
    model: THREE.Group, 
    colorConfig: FurnitureColorConfig
  ): void {
    console.log(`🎨 색상 변경 시작: ${colorConfig.nameKo}`);
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name.toLowerCase();
        const materialName = child.material ? 
          (Array.isArray(child.material) ? child.material[0].name : child.material.name) : '';
        
        // 각 색상 그룹에 대해 확인
        for (const group of colorConfig.materialGroups) {
          let shouldChange = false;
          
          // 메시 이름으로 확인
          if (group.meshNames) {
            shouldChange = group.meshNames.some(name => 
              meshName.includes(name.toLowerCase())
            );
          }
          
          // 재질 이름으로 확인
          if (!shouldChange && group.materialNames) {
            shouldChange = group.materialNames.some(name => 
              materialName.toLowerCase().includes(name.toLowerCase())
            );
          }
          
          if (shouldChange) {
            console.log(`  ✅ ${group.groupName} 그룹에 매칭: "${child.name}" (재질: "${materialName}")`);
            this.applyColorToMesh(child, group.color);
            break; // 첫 번째 매칭되는 그룹만 적용
          }
        }
      }
    });
  }

  private static applyColorToMesh(mesh: THREE.Mesh, color: string): void {
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      
      materials.forEach(material => {
        // 원본 색상 저장 (복원용)
        if (!this.originalColors.has(material)) {
          this.originalColors.set(material, material.color.clone());
        }
        
        // 색상 변경
        const hexColor = parseInt(color.replace('#', ''), 16);
        material.color.setHex(hexColor);
        material.needsUpdate = true;
        
        console.log(`    🎨 색상 변경: #${material.color.getHexString()}`);
      });
    }
  }

  static resetToOriginalColors(model: THREE.Group): void {
    console.log('🔄 원본 색상으로 복원');
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach(material => {
          const originalColor = this.originalColors.get(material);
          if (originalColor) {
            material.color.copy(originalColor);
            material.needsUpdate = true;
          }
        });
      }
    });
  }

  static findBlanketMeshes(model: THREE.Group): THREE.Mesh[] {
    const blanketKeywords = ['blanket', 'bedding', 'cover', 'sheet', 'quilt', 'duvet'];
    const foundMeshes: THREE.Mesh[] = [];
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        const materialName = child.material ? 
          (Array.isArray(child.material) ? child.material[0].name : child.material.name) : '';
        
        const isBlanket = blanketKeywords.some(keyword => 
          name.includes(keyword) || materialName.toLowerCase().includes(keyword)
        );
        
        if (isBlanket) {
          foundMeshes.push(child);
          console.log(`🛏️ 이불 메시 발견: "${child.name}" (재질: "${materialName}")`);
        }
      }
    });
    
    return foundMeshes;
  }

  static changeBlanketColor(model: THREE.Group, color: string): void {
    console.log(`🛏️ 이불 색상 변경: ${color}`);
    
    const blanketMeshes = this.findBlanketMeshes(model);
    
    if (blanketMeshes.length === 0) {
      console.warn('⚠️ 이불 메시를 찾을 수 없습니다. 모든 메시를 확인해보겠습니다.');
      this.analyzeAllMeshes(model);
      return;
    }
    
    blanketMeshes.forEach(mesh => {
      this.applyColorToMesh(mesh, color);
    });
  }

  private static analyzeAllMeshes(model: THREE.Group): void {
    console.log('🔍 모든 메시 분석:');
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materialName = child.material ? 
          (Array.isArray(child.material) ? child.material[0].name : child.material.name) : '';
        
        console.log(`  - "${child.name}" (재질: "${materialName}")`);
      }
    });
  }
}
