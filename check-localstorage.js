// 브라우저 콘솔에서 실행하여 localStorage 확인
console.log('=== localStorage 내용 확인 ===');

// 모든 키 확인
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  
  console.log(`\n[${i}] Key: ${key}`);
  
  // 값이 너무 길면 앞부분만 표시
  if (value && value.length > 200) {
    console.log(`Value (처음 200자): ${value.substring(0, 200)}...`);
    
    // blob URL이 포함되어 있는지 확인
    if (value.includes('blob:')) {
      console.warn('⚠️ blob URL 발견!');
      const blobMatches = value.match(/blob:http[^"'\s]*/g);
      if (blobMatches) {
        console.log('발견된 blob URLs:', blobMatches);
      }
    }
  } else {
    console.log(`Value: ${value}`);
  }
}

console.log('\n=== PlacedItems 상세 확인 ===');
const placedItemsKey = Object.keys(localStorage).find(key => 
  key.includes('placedItems') || key.includes('editor')
);

if (placedItemsKey) {
  console.log('Key:', placedItemsKey);
  try {
    const data = JSON.parse(localStorage.getItem(placedItemsKey) || '{}');
    console.log('Parsed data:', data);
    
    if (data.state?.placedItems) {
      console.log('\n배치된 아이템들:');
      data.state.placedItems.forEach((item, idx) => {
        console.log(`\n[${idx}] ${item.name} (ID: ${item.id})`);
        console.log(`  modelPath: ${item.modelPath}`);
        if (item.modelPath?.startsWith('blob:')) {
          console.error('  ❌ blob URL 발견! 이것이 문제의 원인입니다.');
        }
      });
    }
  } catch (e) {
    console.error('파싱 실패:', e);
  }
}

console.log('\n=== 해결 방법 ===');
console.log('1. localStorage.clear() - 모든 데이터 삭제');
console.log('2. 특정 키만 삭제하려면: localStorage.removeItem("key")');

