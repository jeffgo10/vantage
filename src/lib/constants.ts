export const FREE_TIER = {
  maxActiveTours: 2,
  maxScenesPerTour: 8,
  watermark: true,
  archiveAfterDays: 45,
} as const;

/** Phase 1 upload limits (compression deferred — store originals on R2). */
export const PANORAMA_UPLOAD = {
  maxBytes: 40 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export const PRO_TIER = {
  maxActiveTours: null as number | null,
  maxScenesPerTour: null as number | null,
  watermark: false,
  priceMonthlyUsd: 10,
} as const;

export const TEAM_TIER = {
  ...PRO_TIER,
  includedSeats: 5,
  priceMonthlyUsd: 45,
} as const;

/** Empty-state panorama in the tour editor before any scene is uploaded. */
export const EDITOR_PLACEHOLDER_PANORAMA = "/tour-editor-placeholder.png";

/**
 * CSS scale for center-cropping equirectangular panoramas into tour-list thumbnails.
 * ~2.5× zooms past the full 2:1 strip into a usable room preview.
 */
export const TOUR_THUMBNAIL_CROP_SCALE = 2.5;
