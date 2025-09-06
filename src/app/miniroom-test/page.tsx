'use client';

import React from 'react';
import MiniRoom from '@/components/3D/MiniRoom';

export default function MiniRoomTestPage() {
  const [dragCount, setDragCount] = React.useState(0);
  const [lastEvent, setLastEvent] = React.useState('없음');

  // 드래그 이벤트를 감지하기 위한 커스텀 훅
  React.useEffect(() => {
    const handleDrag = (e: any) => {
      setDragCount(prev => prev + 1);
      setLastEvent(`드래그: ${new Date().toLocaleTimeString()}`);
    };

    const handlePinch = (e: any) => {
      setLastEvent(`핀치: ${new Date().toLocaleTimeString()}`);
    };

    const handleWheel = (e: any) => {
      setLastEvent(`휠: ${new Date().toLocaleTimeString()}`);
    };

    // 이벤트 리스너 등록
    document.addEventListener('drag', handleDrag);
    document.addEventListener('pinch', handlePinch);
    document.addEventListener('wheel', handleWheel);

    return () => {
      document.removeEventListener('drag', handleDrag);
      document.removeEventListener('pinch', handlePinch);
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 테스트 정보 표시 */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        zIndex: 1000,
        fontSize: '14px',
        minWidth: '200px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}>드래그 테스트 정보</h3>
        <div>드래그 횟수: <strong>{dragCount}</strong></div>
        <div>마지막 이벤트: <strong>{lastEvent}</strong></div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#ccc' }}>
          • 마우스 드래그로 카메라 이동<br/>
          • 휠로 줌 인/아웃<br/>
          • 터치 디바이스에서 핀치로 줌
        </div>
      </div>

      {/* 미니룸 컴포넌트 */}
      <MiniRoom 
        style={{ width: '100%', height: '100%' }}
        isEditMode={false}
        useExternalControls={false} // 자체 제스처 핸들러 사용
      />
    </div>
  );
}
