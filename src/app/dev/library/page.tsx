'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { saveCustomFurniture, getCustomFurnitureItems, deleteCustomFurniture, updateCustomFurnitureMeta, updateCustomFurnitureModel, updateCustomFurnitureThumbnail } from '@/utils/customLibrary';
import type { FurnitureItem, FurnitureCategory } from '@/types/furniture';
import { sampleFurniture } from '@/data/furnitureCatalog';
import { applyOverridesToItems, setOverride, clearOverride, getOverride } from '@/utils/furnitureOverrides';
import { setBuiltInModelOverride, setBuiltInThumbnailOverride, clearBuiltInModelOverride, clearBuiltInThumbnailOverride, getBuiltInOverrideUrls } from '@/utils/assetOverrides';
import DevNavbar from '@/components/dev/DevNavbar';

function useObjectUrl(file: File | null) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!file) { setUrl(null); return; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

export default function LibraryManagerPage() {
  const [items, setItems] = React.useState<FurnitureItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [customIds, setCustomIds] = React.useState<Set<string>>(new Set());
  const [assetOverrides, setAssetOverrides] = React.useState<Record<string, { modelUrl?: string; thumbUrl?: string }>>({});
  const [cacheBust, setCacheBust] = React.useState<number>(Date.now());

  // Edit form state
  const selected = items.find(i => i.id === selectedId) || null;
  const [editName, setEditName] = React.useState('');
  const [editW, setEditW] = React.useState('1');
  const [editD, setEditD] = React.useState('1');
  const [editH, setEditH] = React.useState('1');
  const [editCategory, setEditCategory] = React.useState<FurnitureCategory>('decorative');
  const [editTags, setEditTags] = React.useState('');

  // Add form state
  const [newName, setNewName] = React.useState('');
  const [newCategory, setNewCategory] = React.useState<FurnitureCategory>('decorative');
  const [newTags, setNewTags] = React.useState('');
  const [glbFile, setGlbFile] = React.useState<File | null>(null);
  const [thumbFile, setThumbFile] = React.useState<File | null>(null);
  const glbUrl = useObjectUrl(glbFile);
  const thumbUrl = useObjectUrl(thumbFile);
  const [saving, setSaving] = React.useState(false);

  // Edit asset replace state (custom items only)
  const [editModelFile, setEditModelFile] = React.useState<File | null>(null);
  const [editThumbFile, setEditThumbFile] = React.useState<File | null>(null);
  const editThumbUrl = useObjectUrl(editThumbFile);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      const customs = await getCustomFurnitureItems();
      setCustomIds(new Set(customs.map(c => c.id)));
      // Combine built-ins + customs
      const baseCombined = [...sampleFurniture, ...customs];
      // Load binary asset overrides for built-ins
      const urls = await getBuiltInOverrideUrls(baseCombined.map(i => i.id));
      setAssetOverrides(urls);
      // Apply metadata overrides (name/size/category/tags/hidden)
      const combined = applyOverridesToItems(baseCombined);
      setItems(combined);
      setCacheBust(Date.now());
      // Keep selection if still exists
      if (selectedId && !combined.find(i => i.id === selectedId)) setSelectedId(null);
    } catch (e: any) {
      setError(e?.message || '목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  React.useEffect(() => { refresh(); }, [refresh]);

  React.useEffect(() => {
    if (!selected) return;
    setEditName(selected.name);
    setEditW(String(selected.footprint.width));
    setEditD(String(selected.footprint.depth));
    setEditH(String(selected.footprint.height));
    setEditCategory(selected.category as FurnitureCategory);
    setEditTags((selected.metadata?.tags || []).join(', '));
    setEditModelFile(null);
    setEditThumbFile(null);
  }, [selectedId]);

  const handleSaveEdit = async () => {
    if (!selected) return;
    try {
      const w = Math.max(0.01, parseFloat(editW));
      const d = Math.max(0.01, parseFloat(editD));
      const h = Math.max(0.01, parseFloat(editH));
      const newName = editName.trim() || selected.name;
      // Determine custom vs built-in by presence in custom list
      const isCustom = customIds.has(selected.id);
      if (isCustom) {
        await updateCustomFurnitureMeta(selected.id, {
          name: newName,
          footprint: { width: w, depth: d, height: h },
          category: editCategory,
          tags: editTags.split(',').map(s=>s.trim()).filter(Boolean)
        });
      } else {
        setOverride(selected.id, {
          name: newName,
          footprint: { width: w, depth: d, height: h },
          category: editCategory,
          tags: editTags.split(',').map(s=>s.trim()).filter(Boolean)
        });
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message || '수정에 실패했습니다');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const isCustom = customIds.has(id);
      if (isCustom) {
        await deleteCustomFurniture(id);
      } else {
        // Built-in: hide via override
        setOverride(id, { hidden: true });
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message || '삭제에 실패했습니다');
    }
  };

  const handleCreate = async () => {
    setError(null);
    if (!glbUrl) { setError('GLB 파일을 선택하세요'); return; }
    if (!newName.trim()) { setError('이름을 입력하세요'); return; }
    try {
      setSaving(true);
      const w = Math.max(0.01, parseFloat(editW || '1'));
      const d = Math.max(0.01, parseFloat(editD || '1'));
      const h = Math.max(0.01, parseFloat(editH || '1'));
      await saveCustomFurniture({
        name: newName.trim(),
        modelBlob: glbFile!,
        thumbnailBlob: thumbFile || undefined,
        footprint: { width: w, depth: d, height: h },
        wallMounted: false,
        category: newCategory,
        tags: newTags.split(',').map(s=>s.trim()).filter(Boolean)
      });
      // reset
      setNewName(''); setGlbFile(null); setThumbFile(null);
      await refresh();
    } catch (e: any) {
      setError(e?.message || '추가에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <DevNavbar active="library" />
      <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">가구 라이브러리 관리</h1>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 목록 */}
        <div className="md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">내 커스텀 가구</h2>
            <button onClick={refresh} className="text-sm text-blue-600">새로고침</button>
          </div>
          {loading ? (
            <div className="text-gray-500 text-sm">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="text-gray-500 text-sm">등록된 커스텀 가구가 없습니다.</div>
          ) : (
            <ul className="space-y-2 max-h-[60vh] overflow-auto pr-1">
              {items.map(it => (
                <li key={it.id} className={`flex items-center gap-3 p-2 rounded border ${selectedId===it.id?'border-blue-500 bg-blue-50':'border-gray-200'}`}>
                  {(() => {
                    const src = assetOverrides[it.id]?.thumbUrl || it.thumbnailPath || '';
                    const withBuster = (u: string) => u.startsWith('blob:') ? u : `${u}${u.includes('?') ? '&' : '?' }v=${cacheBust}`;
                    return src ? (
                      <img src={withBuster(src)} alt={it.name} className="w-14 h-14 object-cover rounded" />
                    ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded" />
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {it.name}
                      <span className="ml-2 text-xs text-gray-500">
                        {getOverride(it.id)?.hidden ? '(숨김)' : ''}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{it.footprint.width}×{it.footprint.depth}×{it.footprint.height} m</div>
                  </div>
                  <button className="text-sm text-blue-600" onClick={()=>setSelectedId(it.id)}>편집</button>
                  <button className="text-sm text-red-600" onClick={()=>handleDelete(it.id)}>삭제</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 편집 */}
        <div className="md:col-span-1">
          <h2 className="font-medium mb-2">선택 항목 편집</h2>
          {!selected ? (
            <div className="text-gray-500 text-sm">좌측 목록에서 항목을 선택하세요.</div>
          ) : (
            <div className="space-y-3">
              {/* Custom-only asset replacement */}
              {customIds.has(selected.id) ? (
                <div className="p-3 border rounded">
                  <div className="font-medium text-sm mb-2">파일 교체 (커스텀 항목)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">GLB 모델 교체</label>
                      <input type="file" accept=".glb" onChange={e=>setEditModelFile(e.target.files?.[0] || null)} />
                      <button
                        className="mt-2 text-sm px-3 py-1.5 rounded bg-gray-800 text-white disabled:opacity-50"
                        disabled={!editModelFile}
                        onClick={async ()=>{ if (!selected || !editModelFile) return; await updateCustomFurnitureModel(selected.id, editModelFile); setEditModelFile(null); await refresh(); }}
                      >모델 교체</button>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">썸네일 교체</label>
                      <input type="file" accept="image/*" onChange={e=>setEditThumbFile(e.target.files?.[0] || null)} />
                      {editThumbUrl && <img src={editThumbUrl} alt="preview" className="w-20 h-20 object-cover rounded border mt-2" />}
                      <button
                        className="mt-2 text-sm px-3 py-1.5 rounded bg-gray-800 text-white disabled:opacity-50"
                        disabled={!editThumbFile}
                        onClick={async ()=>{ if (!selected || !editThumbFile) return; await updateCustomFurnitureThumbnail(selected.id, editThumbFile); setEditThumbFile(null); await refresh(); }}
                      >썸네일 교체</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 border rounded">
                  <div className="font-medium text-sm mb-2">파일 교체 (내장 가구 - 로컬 오버라이드)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">GLB 모델 교체</label>
                      <input type="file" accept=".glb" onChange={e=>setEditModelFile(e.target.files?.[0] || null)} />
                      <div className="flex gap-2 mt-2">
                        <button
                          className="text-sm px-3 py-1.5 rounded bg-gray-800 text-white disabled:opacity-50"
                          disabled={!editModelFile}
                          onClick={async ()=>{ if (!selected || !editModelFile) return; await setBuiltInModelOverride(selected.id, editModelFile); setEditModelFile(null); await refresh(); }}
                        >모델 교체</button>
                        <button
                          className="text-sm px-3 py-1.5 rounded border"
                          onClick={async ()=>{ if (!selected) return; await clearBuiltInModelOverride(selected.id); await refresh(); }}
                        >모델 초기화</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">썸네일 교체</label>
                      <input type="file" accept="image/*" onChange={e=>setEditThumbFile(e.target.files?.[0] || null)} />
                      {editThumbUrl && <img src={editThumbUrl} alt="preview" className="w-20 h-20 object-cover rounded border mt-2" />}
                      <div className="flex gap-2 mt-2">
                        <button
                          className="text-sm px-3 py-1.5 rounded bg-gray-800 text-white disabled:opacity-50"
                          disabled={!editThumbFile}
                          onClick={async ()=>{ if (!selected || !editThumbFile) return; await setBuiltInThumbnailOverride(selected.id, editThumbFile); setEditThumbFile(null); await refresh(); }}
                        >썸네일 교체</button>
                        <button
                          className="text-sm px-3 py-1.5 rounded border"
                          onClick={async ()=>{ if (!selected) return; await clearBuiltInThumbnailOverride(selected.id); await refresh(); }}
                        >썸네일 초기화</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-700 mb-1">이름</label>
                <input className="w-full border rounded px-3 py-2" value={editName} onChange={e=>setEditName(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">W</label>
                  <input type="number" step={0.01} min={0.01} className="w-full border rounded px-2 py-1" value={editW} onChange={e=>setEditW(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">D</label>
                  <input type="number" step={0.01} min={0.01} className="w-full border rounded px-2 py-1" value={editD} onChange={e=>setEditD(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">H</label>
                  <input type="number" step={0.01} min={0.01} className="w-full border rounded px-2 py-1" value={editH} onChange={e=>setEditH(e.target.value)} />
                </div>
              </div>
              {/* 숨김/복원 토글 (내장 가구용) */}
              <div className="flex items-center gap-3">
                <button
                  className="text-sm px-3 py-1.5 rounded border"
                  onClick={async ()=>{
                    const customs = await getCustomFurnitureItems();
                    const isCustom = customs.some(c => c.id === selected.id);
                    if (isCustom) return; // custom은 삭제 버튼 사용
                    const hidden = !!getOverride(selected.id)?.hidden;
                    setOverride(selected.id, { hidden: !hidden });
                    await refresh();
                  }}
                >
                  {getOverride(selected.id)?.hidden ? '보이기' : '숨기기'}
                </button>
                {getOverride(selected.id) && (
                  <button
                    className="text-sm px-3 py-1.5 rounded border"
                    onClick={async ()=>{ clearOverride(selected!.id); await refresh(); }}
                  >
                    변경 초기화
                  </button>
                )}
              </div>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleSaveEdit}>변경사항 저장</button>
            </div>
          )}
        </div>

        {/* 추가 */}
        <div className="md:col-span-1">
          <h2 className="font-medium mb-2">새 가구 추가</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">이름</label>
              <input className="w-full border rounded px-3 py-2" value={newName} onChange={e=>setNewName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">카테고리</label>
              <select className="w-full border rounded px-2 py-1" value={newCategory} onChange={e=>setNewCategory(e.target.value as FurnitureCategory)}>
                {['living','bedroom','kitchen','bathroom','office','outdoor','decorative','storage','floor','wall'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">태그 (쉼표 구분)</label>
              <input className="w-full border rounded px-3 py-2" value={newTags} onChange={e=>setNewTags(e.target.value)} placeholder="예: modern, wood, white" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">GLB 파일</label>
              <input type="file" accept=".glb" onChange={e=>setGlbFile(e.target.files?.[0] || null)} />
              {glbFile && <div className="text-xs text-gray-500 mt-1">{glbFile.name}</div>}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">썸네일(선택)</label>
              <input type="file" accept="image/*" onChange={e=>setThumbFile(e.target.files?.[0] || null)} />
              {thumbUrl && <img src={thumbUrl} alt="thumb" className="w-20 h-20 object-cover rounded border mt-1" />}
            </div>
              <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">W</label>
                <input type="number" step={0.01} min={0.01} className="w-full border rounded px-2 py-1" value={editW} onChange={e=>setEditW(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">D</label>
                <input type="number" step={0.01} min={0.01} className="w-full border rounded px-2 py-1" value={editD} onChange={e=>setEditD(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">H</label>
                <input type="number" step={0.01} min={0.01} className="w-full border rounded px-2 py-1" value={editH} onChange={e=>setEditH(e.target.value)} />
              </div>
            </div>
            <button disabled={saving} className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50" onClick={handleCreate}>
              {saving ? '추가 중...' : '가구 추가'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
