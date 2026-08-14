/** Mock view analytics for the agent dashboard until Phase 3 tracking ships. */

export interface DashboardSummary {
  tourViews: number;
  tourViewsDeltaPercent: number;
  uniqueVisitors: number;
  avgSessionLabel: string;
}

export interface DailyViewPoint {
  date: string;
  label: string;
  views: number;
}

export interface TourViewStat {
  tourId: string;
  title: string;
  slug: string;
  views: number;
}

export type ActivityKind = "opened" | "scene_changed";

export interface ActivityItem {
  id: string;
  at: string;
  kind: ActivityKind;
  tourTitle: string;
  slug: string;
  detail?: string;
}

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  tourViews: 1284,
  tourViewsDeltaPercent: 12,
  uniqueVisitors: 612,
  avgSessionLabel: "2m 18s",
};

/** 14-day sample series (oldest → newest). */
export const MOCK_DAILY_VIEWS: DailyViewPoint[] = [
  { date: "2026-07-30", label: "Jul 30", views: 62 },
  { date: "2026-07-31", label: "Jul 31", views: 71 },
  { date: "2026-08-01", label: "Aug 1", views: 58 },
  { date: "2026-08-02", label: "Aug 2", views: 84 },
  { date: "2026-08-03", label: "Aug 3", views: 96 },
  { date: "2026-08-04", label: "Aug 4", views: 110 },
  { date: "2026-08-05", label: "Aug 5", views: 88 },
  { date: "2026-08-06", label: "Aug 6", views: 74 },
  { date: "2026-08-07", label: "Aug 7", views: 91 },
  { date: "2026-08-08", label: "Aug 8", views: 103 },
  { date: "2026-08-09", label: "Aug 9", views: 119 },
  { date: "2026-08-10", label: "Aug 10", views: 132 },
  { date: "2026-08-11", label: "Aug 11", views: 98 },
  { date: "2026-08-12", label: "Aug 12", views: 98 },
];

export const MOCK_VIEWS_BY_TOUR: TourViewStat[] = [
  {
    tourId: "mock-1",
    title: "Oak Street Open House",
    slug: "oak-street-open-house",
    views: 412,
  },
  {
    tourId: "mock-2",
    title: "Harbor View Condo",
    slug: "harbor-view-condo",
    views: 298,
  },
  {
    tourId: "mock-3",
    title: "Maple Lane Listing",
    slug: "maple-lane-listing",
    views: 241,
  },
  {
    tourId: "mock-4",
    title: "Downtown Loft Preview",
    slug: "downtown-loft-preview",
    views: 187,
  },
  {
    tourId: "mock-5",
    title: "Riverside Cottage",
    slug: "riverside-cottage",
    views: 146,
  },
];

export const MOCK_RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "a1",
    at: "2026-08-12T06:42:00.000Z",
    kind: "opened",
    tourTitle: "Oak Street Open House",
    slug: "oak-street-open-house",
  },
  {
    id: "a2",
    at: "2026-08-12T06:18:00.000Z",
    kind: "scene_changed",
    tourTitle: "Harbor View Condo",
    slug: "harbor-view-condo",
    detail: "Kitchen",
  },
  {
    id: "a3",
    at: "2026-08-12T05:55:00.000Z",
    kind: "opened",
    tourTitle: "Maple Lane Listing",
    slug: "maple-lane-listing",
  },
  {
    id: "a4",
    at: "2026-08-12T04:12:00.000Z",
    kind: "scene_changed",
    tourTitle: "Oak Street Open House",
    slug: "oak-street-open-house",
    detail: "Backyard",
  },
  {
    id: "a5",
    at: "2026-08-11T22:40:00.000Z",
    kind: "opened",
    tourTitle: "Downtown Loft Preview",
    slug: "downtown-loft-preview",
  },
  {
    id: "a6",
    at: "2026-08-11T20:05:00.000Z",
    kind: "opened",
    tourTitle: "Riverside Cottage",
    slug: "riverside-cottage",
  },
];

/** Prefer real tour titles when the agent has tours; keep mock view counts. */
export function viewsByTourForOwned(
  ownedTitles: { id: string; title: string; slug: string }[],
): TourViewStat[] {
  if (ownedTitles.length === 0) {
    return MOCK_VIEWS_BY_TOUR;
  }

  return ownedTitles.slice(0, 5).map((tour, index) => ({
    tourId: tour.id,
    title: tour.title,
    slug: tour.slug,
    views: MOCK_VIEWS_BY_TOUR[index]?.views ?? 80 - index * 12,
  }));
}
