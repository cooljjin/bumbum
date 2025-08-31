#!/bin/bash

# 누락된 썸네일 파일들을 생성하는 스크립트

# sofa-luxury-001.svg
cat > sofa-luxury-001.svg << 'SVG_EOF'
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="60" fill="#8B4513"/>
  <rect x="10" y="20" width="80" height="30" fill="#D2691E"/>
  <text x="50" y="90" text-anchor="middle" fill="#666" font-size="8">Luxury Sofa</text>
</svg>
SVG_EOF

# wall-tv-mount.svg
cat > wall-tv-mount.svg << 'SVG_EOF'
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="10" fill="#666"/>
  <rect x="30" y="10" width="40" height="60" fill="#333"/>
  <rect x="35" y="15" width="30" height="40" fill="#000"/>
  <text x="50" y="90" text-anchor="middle" fill="#666" font-size="8">TV Mount</text>
</svg>
SVG_EOF

# simple-chair-001.svg
cat > simple-chair-001.svg << 'SVG_EOF'
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="40" y="50" width="20" height="30" fill="#8B4513"/>
  <rect x="35" y="30" width="30" height="25" fill="#D2691E"/>
  <rect x="30" y="45" width="40" height="5" fill="#654321"/>
  <text x="50" y="90" text-anchor="middle" fill="#666" font-size="8">Chair</text>
</svg>
SVG_EOF

# table-lamp-001.svg
cat > table-lamp-001.svg << 'SVG_EOF'
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="47" y="60" width="6" height="20" fill="#666"/>
  <ellipse cx="50" cy="55" rx="8" ry="5" fill="#8B4513"/>
  <ellipse cx="50" cy="45" rx="12" ry="8" fill="#FFFACD"/>
  <text x="50" y="90" text-anchor="middle" fill="#666" font-size="8">Table Lamp</text>
</svg>
SVG_EOF

echo "썸네일 파일들이 생성되었습니다."
