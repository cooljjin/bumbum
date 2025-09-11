import * as THREE from 'three';
import CameraControls from 'camera-controls';

/**
 * 카메라 회전 상태를 초기화하여 불필요한 회전을 방지합니다.
 * @param camera - Three.js 카메라 객체
 * @param controls - CameraControls 인스턴스
 */
export function resetCameraRotation(camera: THREE.Camera, controls: CameraControls) {
  // 카메라의 현재 위치와 목표 위치를 가져옵니다
  const currentPosition = camera.position.clone();
  const currentTarget = new THREE.Vector3();
  controls.getTarget(currentTarget);
  
  // 카메라를 목표 지점을 바라보도록 회전을 초기화합니다
  camera.lookAt(currentTarget);
  
  // CameraControls의 내부 상태를 업데이트합니다
  controls.setLookAt(
    currentPosition.x, currentPosition.y, currentPosition.z,
    currentTarget.x, currentTarget.y, currentTarget.z,
    false // 즉시 적용 (부드러운 전환 없음)
  );
}

/**
 * 각도를 -π ~ π 범위로 정규화합니다.
 * @param angle - 정규화할 각도 (라디안)
 * @returns 정규화된 각도
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * 두 각도 사이의 최단 경로 각도를 계산합니다.
 * @param from - 시작 각도 (라디안)
 * @param to - 목표 각도 (라디안)
 * @returns 최단 경로 각도 (라디안)
 */
export function getShortestRotation(from: number, to: number): number {
  const normalizedFrom = normalizeAngle(from);
  const normalizedTo = normalizeAngle(to);
  
  let diff = normalizedTo - normalizedFrom;
  
  // 최단 경로 선택
  if (diff > Math.PI) {
    diff -= 2 * Math.PI;
  } else if (diff < -Math.PI) {
    diff += 2 * Math.PI;
  }
  
  return diff;
}

/**
 * 카메라를 목표 위치로 최단 경로로 이동시킵니다.
 * @param camera - Three.js 카메라 객체
 * @param controls - CameraControls 인스턴스
 * @param targetPosition - 목표 위치
 * @param targetLookAt - 목표 시점
 * @param smooth - 부드러운 전환 여부
 */
export function moveCameraToTarget(
  camera: THREE.Camera,
  controls: CameraControls,
  targetPosition: [number, number, number],
  targetLookAt: [number, number, number],
  smooth: boolean = true
) {
  // 1. 현재 카메라 회전 상태를 초기화
  resetCameraRotation(camera, controls);
  
  // 2. 목표 위치로 이동 (최단 경로)
  controls.setLookAt(
    targetPosition[0], targetPosition[1], targetPosition[2],
    targetLookAt[0], targetLookAt[1], targetLookAt[2],
    smooth
  );
}

/**
 * CameraControls의 내부 회전 상태를 완전히 리셋합니다.
 * @param controls - CameraControls 인스턴스
 */
export function resetCameraControlsRotation(controls: CameraControls) {
  try {
    // 1. 현재 카메라 위치와 목표 위치 저장
    const camera = controls.camera;
    const currentPosition = camera.position.clone();
    const currentTarget = new THREE.Vector3();
    controls.getTarget(currentTarget);
    
    // 2. 카메라를 목표를 바라보도록 회전 초기화
    camera.lookAt(currentTarget);
    
    // 3. CameraControls의 내부 상태를 직접 리셋
    const controlsAny = controls as any;
    
    // azimuthAngle 리셋
    if ('azimuthAngle' in controlsAny) {
      controlsAny.azimuthAngle = 0;
    }
    
    // polarAngle 리셋
    if ('polarAngle' in controlsAny) {
      controlsAny.polarAngle = Math.PI / 2; // 기본값 (수직 중앙)
    }
    
    // spherical 좌표계 리셋
    if ('spherical' in controlsAny && controlsAny.spherical) {
      controlsAny.spherical.theta = 0; // azimuth
      controlsAny.spherical.phi = Math.PI / 2; // polar
    }
    
    // 내부 상태 변수들 리셋
    if ('_azimuthAngle' in controlsAny) {
      controlsAny._azimuthAngle = 0;
    }
    if ('_polarAngle' in controlsAny) {
      controlsAny._polarAngle = Math.PI / 2;
    }
    
    // 4. CameraControls를 현재 상태로 업데이트 (즉시 적용)
    controls.setLookAt(
      currentPosition.x, currentPosition.y, currentPosition.z,
      currentTarget.x, currentTarget.y, currentTarget.z,
      false // 즉시 적용
    );
    
    // console.log('🔄 카메라 회전 상태 완전 초기화 완료');
  } catch (error) {
    console.warn('CameraControls 회전 상태 리셋 실패:', error);
  }
}

/**
 * 더 강력한 카메라 회전 상태 초기화 (대안 방법)
 * @param controls - CameraControls 인스턴스
 */
export function forceResetCameraRotation(controls: CameraControls) {
  try {
    // 현재 상태 저장
    const camera = controls.camera;
    const currentPosition = camera.position.clone();
    const currentTarget = new THREE.Vector3();
    controls.getTarget(currentTarget);
    
    // 카메라 회전을 완전히 리셋
    camera.rotation.set(0, 0, 0);
    camera.lookAt(currentTarget);
    
    // CameraControls 내부 상태 강제 리셋
    const controlsAny = controls as any;
    
    // 모든 회전 관련 속성 리셋
    const resetProps = [
      'azimuthAngle', '_azimuthAngle', 'polarAngle', '_polarAngle',
      'spherical', '_spherical', 'sphericalDelta', '_sphericalDelta'
    ];
    
    resetProps.forEach(prop => {
      if (prop in controlsAny) {
        if (prop === 'spherical' || prop === '_spherical') {
          if (controlsAny[prop]) {
            controlsAny[prop].theta = 0;
            controlsAny[prop].phi = Math.PI / 2;
          }
        } else if (prop.includes('azimuth')) {
          controlsAny[prop] = 0;
        } else if (prop.includes('polar')) {
          controlsAny[prop] = Math.PI / 2;
        }
      }
    });
    
    // CameraControls 업데이트
    controls.setLookAt(
      currentPosition.x, currentPosition.y, currentPosition.z,
      currentTarget.x, currentTarget.y, currentTarget.z,
      false
    );
    
    // console.log('🔄 카메라 회전 상태 강제 초기화 완료');
  } catch (error) {
    console.warn('카메라 회전 상태 강제 초기화 실패:', error);
  }
}
