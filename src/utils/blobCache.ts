const blobCache = new Map<string, Blob>();

export function storeBlob(url: string | null | undefined, blob: Blob | null | undefined): void {
  if (typeof url !== 'string' || !url.startsWith('blob:') || !blob) {
    return;
  }
  blobCache.set(url, blob);
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[BlobCache] Stored blob for URL:', url);
  }
}

export function getBlob(url: string | null | undefined): Blob | undefined {
  if (typeof url !== 'string') {
    return undefined;
  }
  return blobCache.get(url);
}

export function hasBlob(url: string | null | undefined): boolean {
  if (typeof url !== 'string') {
    return false;
  }
  return blobCache.has(url);
}

export function releaseBlob(url: string | null | undefined): void {
  if (typeof url !== 'string') {
    return;
  }
  if (!blobCache.delete(url)) {
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[BlobCache] Released blob for URL:', url);
  }
}

export function clearBlobCache(): void {
  blobCache.clear();
}
