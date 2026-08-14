import type { DailyViewPoint } from "@/lib/analytics/mock-dashboard";

const WIDTH = 640;
const HEIGHT = 220;
const PAD_X = 12;
const PAD_Y = 16;

export function ViewsChart({ points }: { points: DailyViewPoint[] }) {
  if (points.length === 0) {
    return null;
  }

  const maxViews = Math.max(...points.map((p) => p.views), 1);
  const innerW = WIDTH - PAD_X * 2;
  const innerH = HEIGHT - PAD_Y * 2;
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points.map((point, index) => {
    const x = PAD_X + index * stepX;
    const y = PAD_Y + innerH - (point.views / maxViews) * innerH;
    return { x, y, ...point };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath = [
    `M ${coords[0].x.toFixed(1)} ${(PAD_Y + innerH).toFixed(1)}`,
    ...coords.map((c) => `L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`),
    `L ${coords[coords.length - 1].x.toFixed(1)} ${(PAD_Y + innerH).toFixed(1)}`,
    "Z",
  ].join(" ");

  const firstLabel = points[0]?.label ?? "";
  const midLabel = points[Math.floor(points.length / 2)]?.label ?? "";
  const lastLabel = points[points.length - 1]?.label ?? "";

  return (
    <section
      className="border border-border bg-surface p-4"
      aria-labelledby="views-over-time-heading"
    >
      <h2
        id="views-over-time-heading"
        className="text-sm font-medium text-foreground"
      >
        Views over time
      </h2>
      <p className="mt-0.5 text-xs text-muted">Daily tour views · last 14 days</p>

      <div className="mt-4">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label="Line chart of daily tour views for the last 14 days"
        >
          <defs>
            <linearGradient id="views-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <line
            x1={PAD_X}
            y1={PAD_Y + innerH}
            x2={WIDTH - PAD_X}
            y2={PAD_Y + innerH}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <path d={areaPath} fill="url(#views-area-fill)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {coords.map((c) => (
            <circle
              key={c.date}
              cx={c.x}
              cy={c.y}
              r="3.5"
              fill="var(--background)"
              stroke="var(--highlight)"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>{firstLabel}</span>
          <span className="hidden sm:inline">{midLabel}</span>
          <span>{lastLabel}</span>
        </div>
      </div>
    </section>
  );
}
