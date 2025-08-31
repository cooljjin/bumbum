import React from 'react';
import { EditableRoomFurniture } from './EditableRoomFurniture';
import { PlacedItem } from '../types/editor';

interface RoomFurnitureProps {
  receiveShadow?: boolean;
  isEditMode: boolean;
  selectedItemId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PlacedItem>) => void;
  onDelete: (id: string) => void;
}

// 기존 가구들을 편집 가능하게 만드는 컴포넌트들
export const CoffeeTable: React.FC<RoomFurnitureProps> = ({
  receiveShadow = false,
  isEditMode,
  selectedItemId,
  onSelect,
  onUpdate,
  onDelete
}) => {
  const item: PlacedItem = {
    id: 'coffee_table',
    name: 'coffee_table',
    modelPath: '',
    position: { x: -5.25, y: 0.375, z: -2.25 } as any,
    rotation: { x: 0, y: 0, z: 0 } as any,
    scale: { x: 1, y: 1, z: 1 } as any,
    footprint: { width: 1.8, height: 0.075, depth: 1.2 },
    metadata: { category: 'table' }
  };

  const isSelected = selectedItemId === item.id;

  if (isEditMode) {
    return (
      <EditableRoomFurniture
        item={item}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onUpdate={(updates) => onUpdate(item.id, updates)}
        onDelete={() => onDelete(item.id)}
      >
        {/* 커피 테이블 상판 */}
        <mesh
          position={[0, 0, 0]}
          castShadow={receiveShadow || false}
          receiveShadow={receiveShadow || false}
        >
          <cylinderGeometry args={[0.9, 0.9, 0.075]} />
          <meshStandardMaterial
            color="#FFEB3B"
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>

        {/* 커피 테이블 다리들 */}
        {[
          [-0.6, -0.1875, -0.6],
          [0.6, -0.1875, -0.6],
          [-0.6, -0.1875, 0.6],
          [0.6, -0.1875, 0.6]
        ].map((pos, i) => (
          <mesh
            key={i}
            position={pos as [number, number, number]}
            castShadow={receiveShadow}
            receiveShadow={receiveShadow}
          >
            <cylinderGeometry args={[0.06, 0.06, 0.375]} />
            <meshStandardMaterial
              color="#4CAF50"
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>
        ))}

        {/* 커피 테이블 위 컵들 */}
        {[
          [-0.225, 0.075, 0],
          [0.225, 0.075, 0]
        ].map((pos, i) => (
          <mesh
            key={i}
            position={pos as [number, number, number]}
            castShadow={receiveShadow}
            receiveShadow={receiveShadow}
          >
            <cylinderGeometry args={[0.1125, 0.1125, 0.225]} />
            <meshStandardMaterial
              color="#4CAF50"
              roughness={0.7}
              metalness={0.1}
            />
          </mesh>
        ))}
      </EditableRoomFurniture>
    );
  }

  // 편집 모드가 아닐 때는 기존 방식으로 렌더링
  return (
    <group position={[item.position.x, item.position.y, item.position.z]}>
      {/* 커피 테이블 상판 */}
      <mesh
        position={[0, 0, 0]}
        castShadow={receiveShadow}
        receiveShadow={receiveShadow}
      >
        <cylinderGeometry args={[0.9, 0.9, 0.075]} />
        <meshStandardMaterial
          color="#FFEB3B"
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* 커피 테이블 다리들 */}
      {[
        [-0.6, -0.1875, -0.6],
        [0.6, -0.1875, -0.6],
        [-0.6, -0.1875, 0.6],
        [0.6, -0.1875, 0.6]
      ].map((pos, i) => (
        <mesh
          key={i}
          position={pos as [number, number, number]}
          castShadow={receiveShadow || false}
          receiveShadow={receiveShadow || false}
        >
          <cylinderGeometry args={[0.06, 0.06, 0.375]} />
          <meshStandardMaterial
            color="#4CAF50"
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* 커피 테이블 위 컵들 */}
      {[
        [-0.225, 0.075, 0],
        [0.225, 0.075, 0]
      ].map((pos, i) => (
        <mesh
          key={i}
          position={pos as [number, number, number]}
          castShadow={receiveShadow}
          receiveShadow={receiveShadow}
        >
          <cylinderGeometry args={[0.1125, 0.1125, 0.225]} />
          <meshStandardMaterial
            color="#4CAF50"
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

export const MainTable: React.FC<RoomFurnitureProps> = ({
  receiveShadow,
  isEditMode,
  selectedItemId,
  onSelect,
  onUpdate,
  onDelete
}) => {
  const item: PlacedItem = {
    id: 'main_table',
    name: 'main_table',
    modelPath: '',
    position: { x: 0, y: 0.375, z: -2.25 } as any,
    rotation: { x: 0, y: 0, z: 0 } as any,
    scale: { x: 1, y: 1, z: 1 } as any,
    footprint: { width: 2.25, height: 0.075, depth: 1.5 },
    metadata: { category: 'table' }
  };

  const isSelected = selectedItemId === item.id;

  if (isEditMode) {
    return (
      <EditableRoomFurniture
        item={item}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onUpdate={(updates) => onUpdate(item.id, updates)}
        onDelete={() => onDelete(item.id)}
      >
        {/* 테이블 상판 */}
        <mesh
          position={[0, 0, 0]}
          castShadow={receiveShadow}
          receiveShadow={receiveShadow}
        >
          <boxGeometry args={[2.25, 0.075, 1.5]} />
          <meshStandardMaterial
            color="#8B4513"
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* 테이블 다리들 */}
        {[
          [-0.9, -0.1875, -0.15],
          [0.9, -0.1875, -0.15],
          [-0.9, -0.1875, 0.15],
          [0.9, -0.1875, 0.15]
        ].map((pos, i) => (
          <mesh
            key={i}
            position={pos as [number, number, number]}
            castShadow={receiveShadow}
            receiveShadow={receiveShadow}
          >
            <cylinderGeometry args={[0.0375, 0.0375, 0.375]} />
            <meshStandardMaterial
              color="#654321"
              roughness={0.9}
              metalness={0.05}
            />
          </mesh>
        ))}
      </EditableRoomFurniture>
    );
  }

  return (
    <group position={[item.position.x, item.position.y, item.position.z]}>
      {/* 테이블 상판 */}
      <mesh
        position={[0, 0, 0]}
        castShadow={receiveShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[2.25, 0.075, 1.5]} />
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* 테이블 다리들 */}
      {[
        [-0.9, -0.1875, -0.15],
        [0.9, -0.1875, -0.15],
        [-0.9, -0.1875, 0.15],
        [0.9, -0.1875, 0.15]
      ].map((pos, i) => (
        <mesh
          key={i}
          position={pos as [number, number, number]}
          castShadow={receiveShadow}
          receiveShadow={receiveShadow}
        >
          <cylinderGeometry args={[0.0375, 0.0375, 0.375]} />
          <meshStandardMaterial
            color="#654321"
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
};

export const Chair: React.FC<RoomFurnitureProps> = ({
  receiveShadow,
  isEditMode,
  selectedItemId,
  onSelect,
  onUpdate,
  onDelete
}) => {
  const item: PlacedItem = {
    id: 'chair',
    name: 'chair',
    modelPath: '',
    position: { x: 0, y: 0.225, z: -3.75 } as any,
    rotation: { x: 0, y: 0, z: 0 } as any,
    scale: { x: 1, y: 1, z: 1 } as any,
    footprint: { width: 0.6, height: 0.45, depth: 0.6 },
    metadata: { category: 'chair' }
  };

  const isSelected = selectedItemId === item.id;

  if (isEditMode) {
    return (
      <EditableRoomFurniture
        item={item}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onUpdate={(updates) => onUpdate(item.id, updates)}
        onDelete={() => onDelete(item.id)}
      >
        {/* 의자 좌석 */}
        <mesh
          position={[0, 0, 0]}
          castShadow={receiveShadow}
          receiveShadow={receiveShadow}
        >
          <boxGeometry args={[0.6, 0.45, 0.6]} />
          <meshStandardMaterial
            color="#4A4A4A"
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>

        {/* 의자 다리들 */}
        {[
          [-0.225, -0.3375, -0.225],
          [0.225, -0.3375, -0.225],
          [-0.225, -0.3375, 0.225],
          [0.225, -0.3375, 0.225]
        ].map((pos, i) => (
          <mesh
            key={i}
            position={pos as [number, number, number]}
            castShadow={receiveShadow}
            receiveShadow={receiveShadow}
          >
            <cylinderGeometry args={[0.0225, 0.0225, 0.225]} />
            <meshStandardMaterial
              color="#2A2A2A"
              roughness={0.9}
              metalness={0.1}
            />
          </mesh>
        ))}
      </EditableRoomFurniture>
    );
  }

  return (
    <group position={[item.position.x, item.position.y, item.position.z]}>
      {/* 의자 좌석 */}
      <mesh
        position={[0, 0, 0]}
        castShadow={receiveShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[0.6, 0.45, 0.6]} />
        <meshStandardMaterial
          color="#4A4A4A"
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* 의자 다리들 */}
      {[
        [-0.225, -0.3375, -0.225],
        [0.225, -0.3375, -0.225],
        [-0.225, -0.3375, 0.225],
        [0.225, -0.3375, 0.225]
      ].map((pos, i) => (
        <mesh
          key={i}
          position={pos as [number, number, number]}
          castShadow={receiveShadow}
          receiveShadow={receiveShadow}
        >
          <cylinderGeometry args={[0.0225, 0.0225, 0.225]} />
          <meshStandardMaterial
            color="#2A2A2A"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

export const Bed: React.FC<RoomFurnitureProps> = ({
  receiveShadow,
  isEditMode,
  selectedItemId,
  onSelect,
  onUpdate,
  onDelete
}) => {
  const item: PlacedItem = {
    id: 'bed',
    name: 'bed',
    modelPath: '',
    position: { x: -5.25, y: 0.225, z: -5.25 } as any,
    rotation: { x: 0, y: 0, z: 0 } as any,
    scale: { x: 1, y: 1, z: 1 } as any,
    footprint: { width: 2.25, height: 0.45, depth: 3 },
    metadata: { category: 'bed' }
  };

  const isSelected = selectedItemId === item.id;

  if (isEditMode) {
    return (
      <EditableRoomFurniture
        item={item}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onUpdate={(updates) => onUpdate(item.id, updates)}
        onDelete={() => onDelete(item.id)}
      >
        {/* 침대 프레임 */}
        <mesh
          position={[0, 0, 0]}
          castShadow={receiveShadow}
          receiveShadow={receiveShadow}
        >
          <boxGeometry args={[2.25, 0.45, 3]} />
          <meshStandardMaterial
            color="#8B4513"
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* 침대 다리들 */}
        {[
          [-0.9, -0.225, -1.125],
          [0.9, -0.225, -1.125],
          [-0.9, -0.225, 1.125],
          [0.9, -0.225, 1.125]
        ].map((pos, i) => (
          <mesh
            key={i}
            position={pos as [number, number, number]}
            castShadow={receiveShadow}
            receiveShadow={receiveShadow}
          >
            <cylinderGeometry args={[0.06, 0.06, 0.45]} />
            <meshStandardMaterial
              color="#654321"
              roughness={0.9}
              metalness={0.05}
            />
          </mesh>
        ))}

        {/* 침대 매트리스 */}
        <mesh
          position={[0, 0.225, 0]}
          castShadow={receiveShadow}
          receiveShadow={receiveShadow}
        >
          <boxGeometry args={[2.1, 0.15, 2.85]} />
          <meshStandardMaterial
            color="#F5DEB3"
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>

        {/* 침대 베개 */}
        <mesh
          position={[0, 0.375, -1.125]}
          castShadow={receiveShadow}
          receiveShadow={receiveShadow}
        >
          <boxGeometry args={[1.125, 0.225, 0.6]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.3}
            metalness={0.02}
          />
        </mesh>
      </EditableRoomFurniture>
    );
  }

  return (
    <group position={[item.position.x, item.position.y, item.position.z]}>
      {/* 침대 프레임 */}
      <mesh
        position={[0, 0, 0]}
        castShadow={receiveShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[2.25, 0.45, 3]} />
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* 침대 다리들 */}
      {[
        [-0.9, -0.225, -1.125],
        [0.9, -0.225, -1.125],
        [-0.9, -0.225, 1.125],
        [0.9, -0.225, 1.125]
      ].map((pos, i) => (
        <mesh
          key={i}
          position={pos as [number, number, number]}
          castShadow={receiveShadow}
          receiveShadow={receiveShadow}
        >
          <cylinderGeometry args={[0.06, 0.06, 0.45]} />
          <meshStandardMaterial
            color="#654321"
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
      ))}

      {/* 침대 매트리스 */}
      <mesh
        position={[0, 0.225, 0]}
        castShadow={receiveShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[2.1, 0.15, 2.85]} />
        <meshStandardMaterial
          color="#F5DEB3"
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>

      {/* 침대 베개 */}
      <mesh
        position={[0, 0.375, -1.125]}
        castShadow={receiveShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[1.125, 0.225, 0.6]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.3}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
};

export default {
  CoffeeTable,
  MainTable,
  Chair,
  Bed
};
