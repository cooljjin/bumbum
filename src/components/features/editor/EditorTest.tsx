import React from 'react';
import { Vector3, Euler } from 'three';
import { useEditorStore, useEditorMode, useEditorTool, usePlacedItems, useGridSettings } from '../../../store/editorStore';
import { getAllFurnitureItems } from '../../../data/furnitureCatalog';


const EditorTest: React.FC = () => {
  const {
    setMode,
    setTool,
    addItem,
    removeItem,
    selectItem,
    undo,
    redo,
    reset,
    toggleGrid,
    toggleBoundingBoxes,
    setGridSettings
  } = useEditorStore();

  const mode = useEditorMode();
  const tool = useEditorTool();
  const placedItems = usePlacedItems();
  const gridSettings = useGridSettings();

  const handleAddTestItem = () => {
    const allFurniture = getAllFurnitureItems();
    if (allFurniture.length === 0) {
      console.log('가구 카탈로그가 비어있습니다.');
      return;
    }

    // 첫 번째 가구를 테스트 아이템으로 사용
    const furniture = allFurniture[0];
    if (!furniture) {
      console.warn('가구 데이터가 없습니다.');
      return;
    }

    const testItem = {
      id: `test_${furniture.id}_${Date.now()}`, // 고유한 ID 생성
      name: furniture.nameKo || furniture.name,
      modelPath: furniture.modelPath,
      position: new Vector3(Math.random() * 4 - 2, 0, Math.random() * 4 - 2),
      rotation: new Euler(0, 0, 0),
      scale: new Vector3(1, 1, 1),
      footprint: furniture.footprint,
      metadata: { category: furniture.category }
    };
    addItem(testItem);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Editor Store Test</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Current State:</h3>
          <p>Mode: {mode}</p>
          <p>Tool: {tool}</p>
          <p>Placed Items: {placedItems.length}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Mode Controls:</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('view')}
              className={`px-3 py-1 rounded ${mode === 'view' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              View Mode
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 rounded ${mode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Edit Mode
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Tool Controls:</h3>
          <div className="flex gap-2 flex-wrap">
            {['select', 'move', 'rotate', 'delete', 'duplicate'].map((toolName) => (
              <button
                key={toolName}
                onClick={() => setTool(toolName as any)}
                className={`px-3 py-1 rounded ${tool === toolName ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
              >
                {toolName}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Item Controls:</h3>
          <div className="flex gap-2">
            <button
              onClick={handleAddTestItem}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Add Test Item
            </button>
            <button
              onClick={() => {
                if (placedItems.length > 0 && placedItems[0]) {
                  removeItem(placedItems[0].id);
                }
              }}
              className="px-3 py-1 bg-red-500 text-white rounded"
              disabled={placedItems.length === 0}
            >
              Remove First Item
            </button>
            <button
              onClick={() => {
                if (placedItems.length > 0 && placedItems[0]) {
                  selectItem(placedItems[0].id);
                }
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded"
              disabled={placedItems.length === 0}
            >
              Select First Item
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">History Controls:</h3>
          <div className="flex gap-2">
            <button
              onClick={undo}
              className="px-3 py-1 bg-yellow-500 text-white rounded"
            >
              Undo
            </button>
            <button
              onClick={redo}
              className="px-3 py-1 bg-yellow-500 text-white rounded"
            >
              Redo
            </button>
            <button
              onClick={reset}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">UI Controls:</h3>
          <div className="flex gap-2">
            <button
              onClick={toggleGrid}
              className="px-3 py-1 bg-purple-500 text-white rounded"
            >
              Toggle Grid
            </button>
            <button
              onClick={toggleBoundingBoxes}
              className="px-3 py-1 bg-purple-500 text-white rounded"
            >
              Toggle Bounding Boxes
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Grid Settings:</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm">Size:</label>
              <input
                type="range"
                min="5"
                max="20"
                value={gridSettings.size}
                onChange={(e) => setGridSettings({ size: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm w-8">{gridSettings.size}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Divisions:</label>
              <input
                type="range"
                min="5"
                max="20"
                value={gridSettings.divisions}
                onChange={(e) => setGridSettings({ divisions: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm w-8">{gridSettings.divisions}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Color:</label>
              <input
                type="color"
                value={gridSettings.color}
                onChange={(e) => setGridSettings({ color: e.target.value })}
                className="w-8 h-6 rounded border"
              />
            </div>
          </div>
        </div>

        {placedItems.length > 0 && (
          <div>
            <h3 className="font-semibold">Placed Items:</h3>
            <ul className="list-disc list-inside">
              {placedItems.map((item) => (
                <li key={item.id}>
                  {item.name} - ID: {item.id}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold">Furniture Catalog Info:</h3>
          <div className="text-sm space-y-1">
            <p>Total Items: {getAllFurnitureItems().length}</p>
            <p>Categories: {Object.keys(getAllFurnitureItems().reduce((acc, item) => {
              acc[item.category] = true;
              return acc;
            }, {} as Record<string, boolean>)).length}</p>
            <p>Sample Item: {getAllFurnitureItems()[0]?.nameKo || 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorTest;
