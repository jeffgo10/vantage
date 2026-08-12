import type { TourViewStat } from "@/lib/analytics/mock-dashboard";

export function ViewsByTour({ stats }: { stats: TourViewStat[] }) {
  const maxViews = Math.max(...stats.map((s) => s.views), 1);

  return (
    <section
      className="border border-border bg-surface p-4"
      aria-labelledby="views-by-tour-heading"
    >
      <h2
        id="views-by-tour-heading"
        className="text-sm font-medium text-foreground"
      >
        Views by tour
      </h2>
      <p className="mt-0.5 text-xs text-muted">Top tours · last 14 days</p>

      <ul className="mt-4 space-y-3">
        {stats.map((stat) => {
          const widthPercent = Math.max(4, (stat.views / maxViews) * 100);
          return (
            <li key={stat.tourId}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-foreground">
                  {stat.title}
                </span>
                <span className="shrink-0 tabular-nums text-muted">
                  {stat.views.toLocaleString()}
                </span>
              </div>
              <div
                className="mt-1.5 h-2 w-full bg-accent-muted"
                role="presentation"
              >
                <div
                  className="h-full bg-accent"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
