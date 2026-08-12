import type { ActivityItem } from "@/lib/analytics/mock-dashboard";

function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function activityCopy(item: ActivityItem): string {
  if (item.kind === "scene_changed") {
    const scene = item.detail ? ` → ${item.detail}` : "";
    return `Scene changed on /t/${item.slug}${scene}`;
  }
  return `Viewer opened /t/${item.slug}`;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section
      className="border border-border bg-surface p-4"
      aria-labelledby="recent-activity-heading"
    >
      <h2
        id="recent-activity-heading"
        className="text-sm font-medium text-foreground"
      >
        Recent activity
      </h2>
      <p className="mt-0.5 text-xs text-muted">Sample events from public viewers</p>

      <ul className="mt-4 divide-y divide-border">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
          >
            <div className="min-w-0">
              <p className="text-sm text-foreground">{activityCopy(item)}</p>
              <p className="text-xs text-muted">{item.tourTitle}</p>
            </div>
            <time
              dateTime={item.at}
              className="shrink-0 text-xs tabular-nums text-muted"
            >
              {formatActivityTime(item.at)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
