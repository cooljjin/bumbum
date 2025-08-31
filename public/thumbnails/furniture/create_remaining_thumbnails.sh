#!/bin/bash

# 나머지 누락된 썸네일 파일들을 생성하는 스크립트

# bedside-table-001.svg
cat > bedside-table-001.svg << 'SVG_EOF'
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="35" y="50" width="30" height="25" fill="#8B4513"/>
  <rect x="30" y="40" width="40" height="15" fill="#D2691E"/>
  <circle cx="45" cy="55" r="3" fill="#654321"/>
  <circle cx="55" cy="55" r="3" fill="#654321"/>
  <text x="50" y="90" text-anchor="middle" fill="#666" font-size="8">Bedside Table</text>
</svg>
SVG_EOF

# simple-table-001.svg
cat > simple-table-001.svg << 'SVG_EOF'
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="45" y="60" width="10" height="15" fill="#666"/>
  <rect x="25" y="50" width="50" height="10" fill="#8B4513"/>
  <text x="50" y="90" text-anchor="middle" fill="#666" font-size="8">Simple Table</text>
</svg>
SVG_EOF

# wall-art-001.svg
cat > wall-art-001.svg << 'SVG_EOF'
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="60" height="40" fill="#8B4513"/>
  <rect x="25" y="25" width="50" height="30" fill="#F5DEB3"/>
  <circle cx="35" cy="35" r="8" fill="#4169E1"/>
  <circle cx="50" cy="40" r="6" fill="#FF6347"/>
  <text x="50" y="90" text-anchor="middle" fill="#666" font-size="8">Wall Art</text>
</svg>
SVG_EOF

# wardrobe-001.svg
cat > wardrobe-001.svg << 'SVG_EOF'
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="90" fill="#8B4513"/>
  <rect x="5" y="10" width="90" height="75" fill="#D2691E"/>
  <rect x="45" y="10" width="10" height="75" fill="#654321"/>
  <circle cx="30" cy="50" r="3" fill="#000"/>
  <circle cx="70" cy="50" r="3" fill="#000"/>
  <text x="50" y="95" text-anchor="middle" fill="#666" font-size="8">Wardrobe</text>
</svg>
SVG_EOF

echo "나머지 썸네일 파일들이 생성되었습니다."
