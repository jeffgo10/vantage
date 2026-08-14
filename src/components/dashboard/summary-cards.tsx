import type { DashboardSummary } from "@/lib/analytics/mock-dashboard";

export function SummaryCards({
  summary,
  activeTours,
  maxActiveTours,
}: {
  summary: DashboardSummary;
  activeTours: number;
  maxActiveTours: number;
}) {
  const delta =
    summary.tourViewsDeltaPercent >= 0
      ? `+${summary.tourViewsDeltaPercent}%`
      : `${summary.tourViewsDeltaPercent}%`;

  const cards = [
    {
      label: "Tour views",
      value: summary.tourViews.toLocaleString(),
      hint: `${delta} vs prior 14d`,
    },
    {
      label: "Unique visitors",
      value: summary.uniqueVisitors.toLocaleString(),
      hint: "Last 14 days",
    },
    {
      label: "Avg. session",
      value: summary.avgSessionLabel,
      hint: "Across all tours",
    },
    {
      label: "Active tours",
      value: String(activeTours),
      hint: `${activeTours}/${maxActiveTours} free-tier slots`,
    },
  ];

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <li
          key={card.label}
          className="border border-border bg-surface px-4 py-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {card.value}
          </p>
          <p className="mt-1 text-xs text-muted">{card.hint}</p>
        </li>
      ))}
    </ul>
  );
}
