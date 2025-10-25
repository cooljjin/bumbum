'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/store/editorStore';
import { saveCustomFurniture, getCustomFurnitureById } from '@/utils/customLibrary';
import { createPlacedItemFromFurniture } from '@/data/furnitureCatalog';
import DevNavbar from '@/components/dev/DevNavbar';
import type { FurnitureCategory } from '@/types/furniture';
import { blobManager } from '@/utils/blobManager';

function useObjectUrl(file: File | null) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!file) { setUrl(null); return; }
    // ✅ BlobManager 사용
    const u = blobManager.createUrl(file, {
      type: 'other'
    });
    setUrl(u);
    return () => blobManager.revokeUrl(u);
  }, [file]);
  return url;
}

export default function AssetUploaderPage() {
  const router = useRouter();
  const addItem = useEditorStore(s => s.addItem);

  // 개발자 전용 게이트
  const devEnabled = true; // 임시로 항상 활성화 (process.env['NEXT_PUBLIC_DEV_TOOLS'] === '1' || process.env['NEXT_PUBLIC_DEV_TOOLS'] === 'true')

  const [name, setName] = React.useState('');
  const [glbFile, setGlbFile] = React.useState<File | null>(null);
  const [thumbFile, setThumbFile] = React.useState<File | null>(null);
  const glbUrl = useObjectUrl(glbFile);
  const thumbUrl = useObjectUrl(thumbFile);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isWall, setIsWall] = React.useState(false);
  const [isDoor, setIsDoor] = React.useState(false);
  const [wallHeightInput, setWallHeightInput] = React.useState<string>('1.4');
  const [category, setCategory] = React.useState<FurnitureCategory>('decorative');
  const [tagsInput, setTagsInput] = React.useState('');
  const [footWInput, setFootWInput] = React.useState<string>('1.0');
  const [footDInput, setFootDInput] = React.useState<string>('1.0');
  const [footHInput, setFootHInput] = React.useState<string>('1.0');

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    for (const f of files) {
      if (f.name.toLowerCase().endsWith('.glb')) setGlbFile(f);
      if (/\.(png|jpg|jpeg|webp|svg)$/i.test(f.name)) setThumbFile(f);
    }
  };

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>, type: 'glb' | 'thumb') => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    if (type === 'glb' && !f.name.toLowerCase().endsWith('.glb')) {
      setError('GLB 파일만 업로드할 수 있습니다.');
      return;
    }
    if (type === 'glb') setGlbFile(f);
    if (type === 'thumb') setThumbFile(f);
  };

  const handleSave = async () => {
    setError(null);
    if (!devEnabled) { setError('권한이 없습니다'); return; }
    if (!name.trim()) { setError('가구 이름을 입력하세요'); return; }
    if (!glbUrl) { setError('GLB 파일을 선택하세요'); return; }

    try {
      setSaving(true);
      // 안전 파싱 (빈 값/NaN 방지)
      const w = parseFloat(footWInput);
      const d = parseFloat(footDInput);
      const h = parseFloat(footHInput);
      const width = Number.isFinite(w) && w > 0 ? w : 1;
      const depth = Number.isFinite(d) && d > 0 ? d : 1;
      const height = Number.isFinite(h) && h > 0 ? h : 1;
      const wh = parseFloat(wallHeightInput);
      const wallH = Number.isFinite(wh) && wh >= 0 ? wh : 1.4;

      const id = await saveCustomFurniture({
        name: name.trim(),
        modelBlob: glbFile!,
        thumbnailBlob: thumbFile || null,
        footprint: { width, depth, height },
        wallMounted: isWall || isDoor,
        ...(isWall || isDoor ? { wallHeight: isDoor ? 0 : wallH } : {}),
        isDoor,
        category,
        tags: tagsInput.split(',').map(s=>s.trim()).filter(Boolean)
      });

      const customItem = await getCustomFurnitureById(id);
      if (customItem) {
        const placed = createPlacedItemFromFurniture(customItem);
        addItem(placed);
      }

      // 미니룸으로 이동하여 즉시 확인 + 카탈로그에도 노출됨
      router.push('/miniroom-test');
    } catch (e: any) {
      setError(e?.message || '저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  if (!devEnabled) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold mb-2">개발자 전용</h1>
        <p className="text-gray-600">접근 권한이 없습니다. 환경변수 NEXT_PUBLIC_DEV_TOOLS=1 설정 후 사용하세요.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <DevNavbar active="uploader" />
      <div className="p-6 md:p-8 bg-gradient-to-b from-white to-rose-50/50 rounded-3xl shadow-sm">
      <h1 className="text-2xl font-semibold mb-4 text-rose-700">가구 에셋 추가</h1>
      <p className="text-gray-600 mb-6">GLB와 썸네일을 드래그 앤 드롭하거나 파일 선택으로 업로드하고, 이름을 입력한 뒤 저장하면 미니룸에 배치됩니다.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={onDrop}
        className="border-2 border-dashed border-rose-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 mb-6 bg-white/80 hover:border-rose-300 transition shadow-sm"
      >
        <div className="text-gray-700">여기로 파일을 드래그 앤 드롭</div>
        <div className="text-sm text-gray-500">GLB(필수), PNG/JPG/WebP/SVG(선택)</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">GLB 파일</label>
          <input type="file" accept=".glb" onChange={(e) => onFilePick(e, 'glb')} />
          {glbFile && <div className="text-sm text-gray-600">선택됨: {glbFile.name}</div>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">썸네일 (선택)</label>
          <input type="file" accept="image/*" onChange={(e) => onFilePick(e, 'thumb')} />
          {thumbUrl && (
            <img src={thumbUrl} alt="thumbnail" className="w-32 h-32 object-cover rounded-xl border border-gray-200 shadow-sm" />
          )}
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <label className="block text-sm font-medium text-gray-700">가구 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: Wooden Chair"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-700 mb-1">카테고리</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition" value={category} onChange={e=>setCategory(e.target.value as FurnitureCategory)}>
            {['living','bedroom','kitchen','bathroom','office','outdoor','decorative','storage','floor','wall'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">태그 (쉼표 구분)</label>
          <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition" value={tagsInput} onChange={e=>setTagsInput(e.target.value)} placeholder="예: modern, wood, white" />
        </div>
      </div>

      {/* Footprint 입력 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-700 mb-1">너비 W (m)</label>
          <input type="number" step={0.01} min={0.01} value={footWInput} onChange={(e)=>setFootWInput(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">깊이 D (m)</label>
          <input type="number" step={0.01} min={0.01} value={footDInput} onChange={(e)=>setFootDInput(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">높이 H (m)</label>
          <input type="number" step={0.01} min={0.01} value={footHInput} onChange={(e)=>setFootHInput(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition" />
        </div>
      </div>

      {/* 벽 부착 옵션 */}
      <div className="mb-6 space-y-3">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isWall} onChange={(e)=>setIsWall(e.target.checked)} />
          <span className="text-gray-700">벽에 붙이는 객체로 등록</span>
        </label>
        <label className="block mt-1 inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={isDoor}
            onChange={(e)=>{
              const v = e.target.checked;
              setIsDoor(v);
              if (v) { setIsWall(true); setWallHeightInput('0'); }
            }}
          />
          <span className="text-gray-700">문(바닥에 닿는 벽 부착)</span>
        </label>
        {isWall && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">기본 높이 (m)</label>
              <input
                type="number"
                step={0.01}
                min={0}
                value={wallHeightInput}
                onChange={(e)=>setWallHeightInput(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition"
                disabled={isDoor}
              />
              <p className="text-xs text-gray-500 mt-1">문: 0 (자동), 액자/시계: 예) 1.4</p>
            </div>
          </div>
        )}
      </div>

      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-4">{error}</div>}

      <button
        onClick={handleSave}
        disabled={saving || !glbUrl || !name.trim()}
        className="px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
      >{saving ? '저장 중...' : '저장하고 미니룸에서 확인'}</button>
      </div>
    </div>
  );
}
