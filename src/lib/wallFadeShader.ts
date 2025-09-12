import * as THREE from 'three';
import { WallSide } from '@/utils/roomBoundary';

type Side = WallSide; // 'minX' | 'maxX' | 'minZ' | 'maxZ'

const sideUniforms: Partial<Record<Side, THREE.Uniform>> = {};

export function getSideUniform(side: Side): THREE.Uniform {
  if (!sideUniforms[side]) {
    sideUniforms[side] = new THREE.Uniform(1.0);
  }
  return sideUniforms[side] as THREE.Uniform;
}

function ensurePatchedMaterial(mat: THREE.Material, side: Side) {
  const m = mat as any;
  if (!m || m.userData?._fadePatched) return;

  m.transparent = true;
  // 아주 작게 alphaTest를 켜면 경계가 깔끔해질 수 있음 (필요 시 조정)
  if (m.alphaTest == null) m.alphaTest = 0.0;

  const uniform = getSideUniform(side);
  const prevOnBeforeCompile = m.onBeforeCompile?.bind(m);
  m.onBeforeCompile = (shader: THREE.Shader) => {
    // 이전 커스텀 onBeforeCompile 호출
    if (prevOnBeforeCompile) prevOnBeforeCompile(shader);
    // 유니폼 주입
    shader.uniforms.uWallFade = uniform;
    // fragment 셰이더에 선언 및 곱셈 주입
    shader.fragmentShader = shader.fragmentShader
      .replace('void main()', 'uniform float uWallFade;\nvoid main()')
      .replace(
        '#include <dithering_fragment>',
        'diffuseColor.a *= uWallFade;\n#include <dithering_fragment>'
      );
  };
  m.userData = m.userData || {};
  m.userData._fadePatched = true;
  m.needsUpdate = true;
}

export function patchObjectWithWallFade(object: THREE.Object3D | null | undefined, side: Side) {
  if (!object) return;
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    const material = mesh?.material as any;
    if (!material) return;
    if (Array.isArray(material)) {
      material.forEach((mat) => ensurePatchedMaterial(mat, side));
    } else {
      ensurePatchedMaterial(material, side);
    }
  });
}

export function setWallFadeValue(side: Side, value: number) {
  const u = getSideUniform(side);
  u.value = Math.max(0, Math.min(1, value));
}

export function applyFadeFlagsToObject(object: THREE.Object3D | null | undefined, fade: number) {
  if (!object) return;
  const fullyOpaque = fade > 0.98;
  const fullyHidden = fade < 0.02;
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    const material = mesh?.material as any;
    if (!material) return;
    const mats: THREE.Material[] = Array.isArray(material) ? material : [material];
    mats.forEach((mat) => {
      const mm = mat as any;
      if (fullyHidden) {
        mm.transparent = true; mm.opacity = 0; mm.depthWrite = false;
      } else if (fullyOpaque) {
        mm.transparent = false; mm.opacity = 1; mm.depthWrite = true;
      } else {
        mm.transparent = true; mm.opacity = fade; mm.depthWrite = false;
      }
      mm.depthTest = true;
      mm.needsUpdate = true;
    });
    // 그룹 최상단의 visible은 상위에서 판단하는 것이 안전하지만, 개별 mesh에도 동일 적용 가능
    if ((child as any).isMesh) {
      mesh.visible = !fullyHidden;
    }
  });
  // 상위 object의 표시 여부도 조절(완전 숨김이면 꺼줌)
  (object as any).visible = !fullyHidden;
}

