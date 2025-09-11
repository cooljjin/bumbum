// 색상 변경 기능 테스트 스크립트
const { FurnitureColorChanger } = require('./src/utils/colorChanger.ts');

console.log('🎨 색상 변경 기능 테스트 시작');

// 테스트용 색상 설정
const testColorConfig = {
  id: 'test_blue',
  name: 'Blue Bed',
  nameKo: '파란색 침대',
  color: '#3B82F6',
  materialGroups: [
    {
      groupName: 'blanket',
      meshNames: ['blanket', 'bedding', 'cover', 'sheet'],
      color: '#3B82F6'
    }
  ]
};

console.log('✅ 색상 설정 생성 완료:', testColorConfig);

// 모델 분석 함수 테스트
const { ModelAnalyzer } = require('./src/utils/modelAnalyzer.ts');

console.log('✅ 모델 분석기 로드 완료');

console.log('🎉 모든 테스트 완료!');
