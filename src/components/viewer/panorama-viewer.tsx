"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import "@jeffgo10/panorama-viewer/styles.css";
import "./panorama-hotspots.css";
import type {
  PanoramaMarker,
  PanoramaViewerHandle,
  PanoramaViewerProps,
} from "@jeffgo10/panorama-viewer";

export type { PanoramaMarker, PanoramaViewerHandle, PanoramaViewerProps };

export {
  deviceOrientationPermissionRequired,
  isOrientationControlEnabled,
} from "@jeffgo10/panorama-viewer";

const Viewer = dynamic(
  () => import("@jeffgo10/panorama-viewer").then((m) => m.PanoramaViewer),
  { ssr: false },
);

/**
 * App-facing wrapper around `@jeffgo10/panorama-viewer`.
 * Keeps Next.js client/dynamic + CSS import in one place.
 */
export const PanoramaViewer = forwardRef<PanoramaViewerHandle, PanoramaViewerProps>(
  function PanoramaViewer({ fitParent = true, className, ...props }, ref) {
    return <Viewer ref={ref} fitParent={fitParent} className={className} {...props} />;
  },
);
