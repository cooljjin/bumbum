import { ensureThreePatched } from './threePatchGuard';
import { patchFileLoader } from '@/utils/patch/FileLoaderPatch';

// Ensure FileLoader patch runs exactly once at bootstrap.
ensureThreePatched(patchFileLoader);

if (process.env.NODE_ENV !== 'production') {
  console.debug('[initThreePatches] 🔎 Sanity check: FileLoader patch is ready.');
}
