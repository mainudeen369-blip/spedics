/** Media limits tuned for Vercel serverless uploads (max 4.5MB body) + a light public site. */

export const MAX_IMAGE_MB = 2;
export const MAX_VIDEO_MB = 4;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

/** Soft total for gallery cards — more items slows the homepage. */
export const MAX_GALLERY_ITEMS = 40;
/** Suggested count for a snappy site. */
export const RECOMMENDED_GALLERY_ITEMS = 24;

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

export const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime'
]);

export const MEDIA_HINTS = {
  title: 'Keep media light',
  body:
    `Heavy photos/videos slow the website. Prefer compressed images (JPEG/WebP). Limits: images ≤ ${MAX_IMAGE_MB} MB, videos ≤ ${MAX_VIDEO_MB} MB, gallery ≤ ${MAX_GALLERY_ITEMS} items (best under ${RECOMMENDED_GALLERY_ITEMS}). Vercel server uploads max out near 4.5 MB.`,
  accept: 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime'
};

export function mediaKindFromType(type: string): 'image' | 'video' | 'other' {
  if (ALLOWED_IMAGE_TYPES.has(type) || type.startsWith('image/')) return 'image';
  if (ALLOWED_VIDEO_TYPES.has(type) || type.startsWith('video/')) return 'video';
  return 'other';
}

export function validateMediaFile(file: { size: number; type: string; name?: string }) {
  const kind = mediaKindFromType(file.type || '');
  if (kind === 'other') {
    return {
      ok: false as const,
      error: `Unsupported type${file.type ? `: ${file.type}` : ''}. Use JPEG/PNG/WebP/GIF or MP4/WebM.`
    };
  }
  // Reject SVG (not in allowed set) and other heavy/risky types
  if (file.type === 'image/svg+xml') {
    return { ok: false as const, error: 'SVG uploads are not allowed. Use JPEG, PNG, or WebP.' };
  }
  const max = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  const maxMb = kind === 'video' ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  if (file.size > max) {
    return {
      ok: false as const,
      error: `${kind === 'video' ? 'Video' : 'Image'} too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Max ${maxMb} MB — compress before uploading so the site stays fast.`
    };
  }
  return { ok: true as const, kind };
}

export const mediaLimitsPublic = {
  maxImageMb: MAX_IMAGE_MB,
  maxVideoMb: MAX_VIDEO_MB,
  maxGalleryItems: MAX_GALLERY_ITEMS,
  recommendedGalleryItems: RECOMMENDED_GALLERY_ITEMS,
  hints: MEDIA_HINTS
};
