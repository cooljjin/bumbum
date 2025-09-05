// 가구 배치 테스트 스크립트
// 브라우저 콘솔에서 실행하여 벽 충돌 감지 테스트

console.log('🧪 가구 벽 충돌 감지 테스트 시작');

// 방 경계 설정
const ROOM_DIMENSIONS = {
  width: 15,
  depth: 15,
  height: 7.5,
  wallThickness: 0.1,
  margin: 0.5
};

// 방 경계 계산
function getRoomBoundaries() {
  const halfWidth = ROOM_DIMENSIONS.width / 2;
  const halfDepth = ROOM_DIMENSIONS.depth / 2;
  
  return {
    minX: -halfWidth + ROOM_DIMENSIONS.margin,
    maxX: halfWidth - ROOM_DIMENSIONS.margin,
    minZ: -halfDepth + ROOM_DIMENSIONS.margin,
    maxZ: halfDepth - ROOM_DIMENSIONS.margin,
    minY: 0,
    maxY: ROOM_DIMENSIONS.height - ROOM_DIMENSIONS.margin
  };
}

// 가구 경계 계산
function getFurnitureBounds(item, safetyMargin = 0.1) {
  const halfWidth = (item.footprint.width * item.scale.x) / 2;
  const halfDepth = (item.footprint.depth * item.scale.z) / 2;
  const height = item.footprint.height * item.scale.y;
  
  return {
    minX: item.position.x - halfWidth - safetyMargin,
    maxX: item.position.x + halfWidth + safetyMargin,
    minZ: item.position.z - halfDepth - safetyMargin,
    maxZ: item.position.z + halfDepth + safetyMargin,
    minY: item.position.y,
    maxY: item.position.y + height + safetyMargin
  };
}

// 벽 충돌 감지
function isFurnitureInRoom(item) {
  const boundaries = getRoomBoundaries();
  const furnitureBounds = getFurnitureBounds(item);
  
  console.log(`🔍 벽 충돌 검사: ${item.name}`, {
    가구위치: `(${item.position.x.toFixed(2)}, ${item.position.y.toFixed(2)}, ${item.position.z.toFixed(2)})`,
    가구크기: `${item.footprint.width}x${item.footprint.height}x${item.footprint.depth}`,
    가구경계: `X:${furnitureBounds.minX.toFixed(2)}~${furnitureBounds.maxX.toFixed(2)}, Z:${furnitureBounds.minZ.toFixed(2)}~${furnitureBounds.maxZ.toFixed(2)}`,
    방경계: `X:${boundaries.minX.toFixed(2)}~${boundaries.maxX.toFixed(2)}, Z:${boundaries.minZ.toFixed(2)}~${boundaries.maxZ.toFixed(2)}`
  });
  
  // X축 검증
  if (furnitureBounds.minX < boundaries.minX || furnitureBounds.maxX > boundaries.maxX) {
    console.log(`❌ X축 벽 충돌: 가구(${furnitureBounds.minX.toFixed(2)}~${furnitureBounds.maxX.toFixed(2)}) vs 방(${boundaries.minX.toFixed(2)}~${boundaries.maxX.toFixed(2)})`);
    return false;
  }
  
  // Z축 검증
  if (furnitureBounds.minZ < boundaries.minZ || furnitureBounds.maxZ > boundaries.maxZ) {
    console.log(`❌ Z축 벽 충돌: 가구(${furnitureBounds.minZ.toFixed(2)}~${furnitureBounds.maxZ.toFixed(2)}) vs 방(${boundaries.minZ.toFixed(2)}~${boundaries.maxZ.toFixed(2)})`);
    return false;
  }
  
  // Y축 검증
  if (furnitureBounds.minY < boundaries.minY || furnitureBounds.maxY > boundaries.maxY) {
    console.log(`❌ Y축 벽 충돌: 가구(${furnitureBounds.minY.toFixed(2)}~${furnitureBounds.maxY.toFixed(2)}) vs 방(${boundaries.minY.toFixed(2)}~${boundaries.maxY.toFixed(2)})`);
    return false;
  }
  
  console.log(`✅ 벽 충돌 없음: ${item.name}`);
  return true;
}

// 가구를 방 안으로 제한
function constrainFurnitureToRoom(item) {
  const boundaries = getRoomBoundaries();
  const furnitureBounds = getFurnitureBounds(item);
  
  const halfWidth = (item.footprint.width * item.scale.x) / 2;
  const halfDepth = (item.footprint.depth * item.scale.z) / 2;
  const height = item.footprint.height * item.scale.y;
  
  let newX = item.position.x;
  let newZ = item.position.z;
  let newY = item.position.y;
  
  // X축 제한
  if (furnitureBounds.minX < boundaries.minX) {
    newX = boundaries.minX + halfWidth;
  } else if (furnitureBounds.maxX > boundaries.maxX) {
    newX = boundaries.maxX - halfWidth;
  }
  
  // Z축 제한
  if (furnitureBounds.minZ < boundaries.minZ) {
    newZ = boundaries.minZ + halfDepth;
  } else if (furnitureBounds.maxZ > boundaries.maxZ) {
    newZ = boundaries.maxZ - halfDepth;
  }
  
  // Y축 제한
  if (furnitureBounds.minY < boundaries.minY) {
    newY = boundaries.minY;
  } else if (furnitureBounds.maxY > boundaries.maxY) {
    newY = boundaries.maxY - height;
  }
  
  console.log(`🔧 가구 위치 제한: ${item.name} - 원래: (${item.position.x.toFixed(2)}, ${item.position.y.toFixed(2)}, ${item.position.z.toFixed(2)}) -> 새 위치: (${newX.toFixed(2)}, ${newY.toFixed(2)}, ${newZ.toFixed(2)})`);
  
  return {
    ...item,
    position: { x: newX, y: newY, z: newZ }
  };
}

// 테스트 실행
function runTests() {
  console.log('📊 방 경계:', getRoomBoundaries());
  
  // 테스트 가구들
  const testFurniture = [
    {
      name: '소파',
      footprint: { width: 2.2, depth: 0.9, height: 0.8 },
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 }
    },
    {
      name: '소파 (벽 근처)',
      footprint: { width: 2.2, depth: 0.9, height: 0.8 },
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 6.5, y: 0, z: 0 }
    },
    {
      name: '소파 (벽 밖)',
      footprint: { width: 2.2, depth: 0.9, height: 0.8 },
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 8, y: 0, z: 0 }
    }
  ];
  
  testFurniture.forEach(furniture => {
    console.log(`\n🧪 테스트: ${furniture.name}`);
    const isInRoom = isFurnitureInRoom(furniture);
    if (!isInRoom) {
      const constrained = constrainFurnitureToRoom(furniture);
      console.log(`✅ 제한된 위치: (${constrained.position.x.toFixed(2)}, ${constrained.position.y.toFixed(2)}, ${constrained.position.z.toFixed(2)})`);
    }
  });
}

// 테스트 실행
runTests();

console.log('\n🎯 테스트 완료! 브라우저에서 가구를 드래그해보세요.');
