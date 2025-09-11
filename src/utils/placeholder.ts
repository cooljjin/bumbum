/**
 * Determines whether to bypass GLTF loading and use simple placeholder geometry.
 * Enabled by default in non-production, or when NEXT_PUBLIC_PLACEHOLDER_MODELS=1.
 */
export function shouldUsePlaceholderModels(): boolean {
  // Prefer explicit env flag if provided
  const explicit = process.env['NEXT_PUBLIC_PLACEHOLDER_MODELS'];
  if (explicit === '1' || explicit === 'true') return true;
  if (explicit === '0' || explicit === 'false') return false;

  // Default behavior:
  // - In tests, use placeholders to avoid GLTF loading
  // - In development, try real models by default (changed from placeholders)
  // - In production, try real models
  const nodeEnv = process.env.NODE_ENV;
  console.log('🔍 shouldUsePlaceholderModels - NODE_ENV:', nodeEnv);
  
  if (nodeEnv === 'test') return true;
  if (nodeEnv === 'development') return false; // 실제 모델 로드
  
  // NODE_ENV가 undefined인 경우 (Next.js dev 모드) 실제 모델 로드
  if (!nodeEnv) return false;
  
  return false;
}
