# 🧭 Prompt: Fix Hook Order in `Canvas3D.tsx` (Agent A/B Parallel Safe)

## 🎯 Goal
Refactor `Canvas3D` so that all React Hooks maintain a consistent order across renders.
Split logic/UI responsibilities for Agent A and B to prevent hook-order collisions.

---

## ⚠️ Background
React warning:
```
React has detected a change in the order of Hooks called by Canvas3D.
```
This occurs because a `useMemo` was conditionally executed (around line 304 in `Canvas3D.tsx`).

---

## 🧠 Tasks — Agent A (Logic / Hooks)
1. Move **all hook calls** (`useState`, `useEffect`, `useMemo`, `useCallback`) to the top level.
2. Remove any conditional hook usage — hooks must always execute in the same order.
3. Refactor this pattern:
   ```tsx
   if (effectiveModelUrl) {
     const assetContextValue = useMemo(() => {...}, [effectiveModelUrl]);
   }
   ```
   → into:
   ```tsx
   const assetContextValue = useMemo(() => {
     if (!effectiveModelUrl)
       return { modelUrl: null, modelSource: 'none' };
     if (explicitModelUrl && effectiveModelUrl === explicitModelUrl)
       return { modelUrl: effectiveModelUrl, modelSource: 'prop-url' };
     return { modelUrl: effectiveModelUrl, modelSource: 'resolved-url' };
   }, [effectiveModelUrl, explicitModelUrl]);
   ```
4. Follow the **stable hook order**:
   - `useState`
   - `useRef`
   - `useMemo`
   - `useEffect`
   - `useCallback`
   - `context` setup
5. Ensure **all hooks run before any early return** (like `if (!ready) return null;`).
6. Provide computed values or context via `useCanvas3DAssets` for Agent B to consume.
7. Avoid any hook depending on props that may appear/disappear mid-render.
8. Confirm **no hooks inside conditionals or loops**.

### ✅ Deliverable
Produce `Canvas3D_HooksA.tsx`:
- Hook order fixed and consistent
- Conditional hook calls eliminated
- Context stable and reusable for Agent B

---

## 🎨 Tasks — Agent B (UI / Render)
1. **Do not modify** hook declarations or their order.
2. Manage only JSX structure and UI rendering logic.
3. Use context or props provided by Agent A.
4. Handle fallback UI (spinner, error, etc.) **after** all hooks.
5. Avoid early returns before hooks; use conditional rendering instead.

### ✅ Deliverable
Produce `Canvas3D_HooksB.tsx`:
- Uses context/state from Agent A
- Maintains lighting, layout, and rendering fidelity
- Keeps hook order untouched

---

## 🤝 Merge Rules
- Final file: `Canvas3D_merged.tsx`
- Hooks from Agent A must remain above render logic from Agent B.
- Run `npm run lint` with `react-hooks/rules-of-hooks: error` to validate.
- Verify no warnings like “React has detected a change in the order of Hooks.”

---

## ✅ Acceptance Criteria
- No conditional hook calls.
- No React hook order warnings.
- Canvas3D renders correctly with blob-safe loading.
- Agents A and B can work concurrently without merge conflicts.
- Final merged version passes ESLint and React Hook Rules.
