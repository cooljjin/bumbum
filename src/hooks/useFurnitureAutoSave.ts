import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';

const AUTO_SAVE_DELAY = 3000;

export const useFurnitureAutoSave = () => {
  const placedItems = useEditorStore(state => state.placedItems);
  const triggerAutoSave = useEditorStore(state => state.triggerAutoSave);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevItemCountRef = useRef<number>(0);

  useEffect(() => {
    if (placedItems.length === 0 && prevItemCountRef.current === 0) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      triggerAutoSave();
      prevItemCountRef.current = placedItems.length;

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AutoSave] Saved ${placedItems.length} items`);
      }
    }, AUTO_SAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [placedItems, triggerAutoSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const items = useEditorStore.getState().placedItems;
      if (items.length > 0) {
        useEditorStore.getState().triggerAutoSave();

        if (process.env.NODE_ENV !== 'production') {
          console.log('[AutoSave] Saved before unmount');
        }
      }
    };
  }, []);
};
