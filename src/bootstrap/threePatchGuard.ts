/* eslint-disable @typescript-eslint/no-explicit-any */
const GLOBAL_FLAG = Symbol.for('__three_fileloader_patch_applied__');

export function isThreePatchApplied(): boolean {
  const g = globalThis as any;
  return Boolean(g[GLOBAL_FLAG]);
}

export function setThreePatchApplied(): void {
  const g = globalThis as any;
  g[GLOBAL_FLAG] = true;
}

export function ensureThreePatched(patch: () => void): void {
  if (isThreePatchApplied()) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[ThreePatchGuard] FileLoaderPatch already applied (idempotent).');
    }
    return;
  }

  patch();
  setThreePatchApplied();

  if (process.env.NODE_ENV !== 'production') {
    console.info('[ThreePatchGuard] ✅ FileLoaderPatch applied at bootstrap time.');
  }
}
