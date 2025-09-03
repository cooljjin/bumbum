import { Vector3, Quaternion } from 'three';

export type AxisString = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';

export function axisToVector(axis: AxisString | undefined): Vector3 {
  switch (axis) {
    case '+x': return new Vector3(1, 0, 0);
    case '-x': return new Vector3(-1, 0, 0);
    case '+y': return new Vector3(0, 1, 0);
    case '-y': return new Vector3(0, -1, 0);
    case '+z': return new Vector3(0, 0, 1);
    case '-z': return new Vector3(0, 0, -1);
    default: return new Vector3(0, 0, 1); // 기본 정면 +Z
  }
}

// 가장 가까운 벽과 실내를 향하는 벽 법선 반환
export function nearestWallNormal(boundaries: { minX: number; maxX: number; minZ: number; maxZ: number; }, p: Vector3): Vector3 {
  const dxMin = Math.abs(p.x - boundaries.minX);
  const dxMax = Math.abs(p.x - boundaries.maxX);
  const dzMin = Math.abs(p.z - boundaries.minZ);
  const dzMax = Math.abs(p.z - boundaries.maxZ);
  const minXDist = Math.min(dxMin, dxMax);
  const minZDist = Math.min(dzMin, dzMax);

  if (minXDist <= minZDist) {
    // 서쪽 벽(minX) → 실내 방향 +X, 동쪽 벽(maxX) → 실내 방향 -X
    return dxMin < dxMax ? new Vector3(1, 0, 0) : new Vector3(-1, 0, 0);
  }
  // 북쪽 벽(minZ) → 실내 방향 +Z, 남쪽 벽(maxZ) → 실내 방향 -Z
  return dzMin < dzMax ? new Vector3(0, 0, 1) : new Vector3(0, 0, -1);
}

// frontAxis를 실내 방향(-N)으로, upAxis를 월드 Up(0,1,0)에 맞추는 회전 쿼터니언 계산
export function computeFacingQuaternion(frontAxis: AxisString | undefined, upAxis: AxisString | undefined, wallNormal: Vector3): Quaternion {
  const front = axisToVector(frontAxis).clone().normalize();
  const up = axisToVector(upAxis ?? '+y').clone().normalize();
  const target = wallNormal.clone().negate(); // 실내를 바라보도록 -N

  const q1 = new Quaternion().setFromUnitVectors(front, target);

  // 롤 보정: up을 월드 업과 가깝게 정렬하되, 벽 법선에 수직인 평면에서만 조정
  const upAfter = up.clone().applyQuaternion(q1);
  const planeNormal = wallNormal.clone().normalize();
  const upAfterProj = upAfter.clone().projectOnPlane(planeNormal).normalize();
  const worldUpProj = new Vector3(0, 1, 0).projectOnPlane(planeNormal).normalize();

  // 영벡터 방지
  if (upAfterProj.lengthSq() < 1e-6 || worldUpProj.lengthSq() < 1e-6) {
    return q1;
  }

  const q2 = new Quaternion().setFromUnitVectors(upAfterProj, worldUpProj);
  return q2.multiply(q1);
}

