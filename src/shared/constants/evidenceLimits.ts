/** Max size after compression / at drain time. */
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024
export const VIDEO_MAX_DURATION_SEC = 60

/** Raw capture limits before compression (camera files are often larger). */
export const PHOTO_PRE_COMPRESS_MAX_BYTES = 50 * 1024 * 1024
export const VIDEO_PRE_COMPRESS_MAX_BYTES = 200 * 1024 * 1024

/** Compress video when above this size (below VIDEO_MAX_BYTES but still large for Dexie). */
export const VIDEO_COMPRESS_THRESHOLD_BYTES = 20 * 1024 * 1024
