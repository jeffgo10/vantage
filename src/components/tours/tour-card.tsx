import Link from "next/link";
import { TOUR_THUMBNAIL_CROP_SCALE } from "@/lib/constants";
import type { TourListItem } from "@/types";

export function TourCard({ tour }: { tour: TourListItem }) {
  return (
    <Link
      href={`/tours/${tour.id}/edit`}
      className="flex min-h-44 flex-col overflow-hidden rounded-xl border border-border bg-surface text-left transition-colors hover:border-accent"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
        {tour.thumbnailUrl ? (
          // Same-origin R2 proxy; avoid next/image optimizer on Workers API routes.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tour.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover object-center"
            style={{ transform: `scale(${TOUR_THUMBNAIL_CROP_SCALE})` }}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted">
            No preview yet
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm font-medium text-foreground">{tour.title}</p>
        {tour.address ? <p className="mt-1 text-sm text-muted">{tour.address}</p> : null}
        <p className="mt-auto pt-4 text-xs font-medium uppercase tracking-wide text-muted">
          {tour.status}
        </p>
      </div>
    </Link>
  );
}

export function EmptyTourCard() {
  return (
    <div className="flex min-h-44 flex-col items-start justify-center rounded-xl border border-dashed border-border-strong bg-surface p-5 text-left">
      <p className="text-sm font-medium text-foreground">No tours yet</p>
      <p className="mt-1 text-sm text-muted">
        Create a tour, upload panoramas, and place navigation hotspots.
      </p>
      <Link href="/tours/new" className="mt-4 text-sm font-medium text-accent hover:underline">
        Create your first tour →
      </Link>
    </div>
  );
}
