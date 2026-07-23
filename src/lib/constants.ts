export const FREE_TIER = {
  maxActiveProperties: 2,
  maxScenesPerProperty: 8,
  watermark: true,
  archiveAfterDays: 45,
} as const;

export const PRO_TIER = {
  maxActiveProperties: null as number | null,
  maxScenesPerProperty: null as number | null,
  watermark: false,
  priceMonthlyUsd: 10,
} as const;

export const TEAM_TIER = {
  ...PRO_TIER,
  includedSeats: 5,
  priceMonthlyUsd: 45,
} as const;
