"use client";

import dynamic from "next/dynamic";
import "@jeffgo10/panorama-viewer/styles.css";
import type {
  PanoramaMarker,
  PanoramaViewerHandle,
  PanoramaViewerProps,
} from "@jeffgo10/panorama-viewer";

export type { PanoramaMarker, PanoramaViewerHandle, PanoramaViewerProps };

const Viewer = dynamic(
  () => import("@jeffgo10/panorama-viewer").then((m) => m.PanoramaViewer),
  { ssr: false },
);

/**
 * App-facing wrapper around `@jeffgo10/panorama-viewer`.
 * Keeps Next.js client/dynamic + CSS import in one place.
 */
export function PanoramaViewer({
  fitParent = true,
  className,
  ...props
}: PanoramaViewerProps) {
  return <Viewer fitParent={fitParent} className={className} {...props} />;
}
