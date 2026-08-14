"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import {
  deviceOrientationPermissionRequired,
  PanoramaViewer,
  type PanoramaViewerHandle,
} from "@/components/viewer/panorama-viewer";
import { hotspotToMarker } from "@/lib/hotspots/markers";
import type { TourPayload } from "@/types";

type PublicTourViewerProps = {
  tour: TourPayload;
};

/** Pannellum remounts asynchronously; poll until the new viewer can take gyro. */
const ORIENTATION_RESUME_MAX_ATTEMPTS = 40;
const ORIENTATION_RESUME_INTERVAL_MS = 50;

function subscribeNoop() {
  return () => {};
}

function resumeOrientationWhenViewerReady(
  viewerRef: RefObject<PanoramaViewerHandle | null>,
  onGaveUp: () => void,
): () => void {
  let cancelled = false;
  let attempts = 0;
  /** True once the previous scene's viewer has torn down (or was not ready). */
  let seenGap = false;

  const tryStart = () => {
    if (cancelled) return;
    const handle = viewerRef.current;
    const available = Boolean(handle?.isOrientationAvailable());
    const active = Boolean(handle?.isOrientationActive());

    if (!available || !active) {
      seenGap = true;
    }

    if (seenGap && available && !active) {
      handle?.startOrientation();
    }

    if (seenGap && handle?.isOrientationActive()) {
      return;
    }

    attempts += 1;
    if (attempts < ORIENTATION_RESUME_MAX_ATTEMPTS) {
      window.setTimeout(tryStart, ORIENTATION_RESUME_INTERVAL_MS);
      return;
    }
    onGaveUp();
  };

  tryStart();
  return () => {
    cancelled = true;
  };
}

export function PublicTourViewer({ tour }: PublicTourViewerProps) {
  const viewerRef = useRef<PanoramaViewerHandle>(null);
  const [sceneId, setSceneId] = useState(tour.scenes[0]?.id ?? null);
  const [orientationActive, setOrientationActive] = useState(false);
  const previousSceneIdRef = useRef(sceneId);
  const permissionRequired = useSyncExternalStore(
    subscribeNoop,
    deviceOrientationPermissionRequired,
    () => false,
  );

  useEffect(() => {
    const sceneChanged = previousSceneIdRef.current !== sceneId;
    previousSceneIdRef.current = sceneId;
    if (!orientationActive || !sceneChanged) return;
    return resumeOrientationWhenViewerReady(viewerRef, () => {
      setOrientationActive(false);
    });
  }, [sceneId, orientationActive]);

  const scene = tour.scenes.find((s) => s.id === sceneId) ?? tour.scenes[0] ?? null;

  if (!scene) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-foreground">
        <p className="text-sm">This tour has no scenes yet.</p>
      </div>
    );
  }

  const markers = scene.hotspots.map(hotspotToMarker);
  const needsMotionGesture = permissionRequired && !orientationActive;

  function selectScene(nextSceneId: string) {
    if (nextSceneId === sceneId) return;
    setSceneId(nextSceneId);
  }

  return (
    <div className="relative isolate h-dvh w-full overflow-hidden bg-black">
      <PanoramaViewer
        ref={viewerRef}
        imageUrl={scene.image_url}
        markers={markers}
        orientationControl
        orientationOnByDefault={!permissionRequired || orientationActive}
        onOrientationChange={setOrientationActive}
        onMarkerClick={(marker) => {
          const hotspot = scene.hotspots.find((h) => h.id === marker.id);
          if (hotspot?.type === "navigation" && hotspot.target_scene_id) {
            selectScene(hotspot.target_scene_id);
          }
        }}
        className="absolute inset-0 h-full w-full"
      />

      {needsMotionGesture ? (
        <button
          type="button"
          onClick={() => {
            viewerRef.current?.startOrientation();
          }}
          className="absolute right-3 top-3 z-30 rounded-md bg-surface/95 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-surface-elevated"
        >
          Enable motion
        </button>
      ) : null}

      <Link
        href="/"
        className="absolute bottom-3 right-3 z-20 rounded bg-black/45 px-2.5 py-1 text-xs font-medium text-white/90 hover:bg-black/60 hover:text-white"
      >
        Made with RoamVantage
      </Link>

      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-4 pb-12 pt-16">
        <div className="mx-auto flex max-w-4xl items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/70">{scene.title}</p>
            <h1 className="text-lg font-semibold text-white">{tour.title}</h1>
          </div>
          {tour.contact_email ? (
            <a
              href={`mailto:${tour.contact_email}`}
              className="shrink-0 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            >
              Get in touch
            </a>
          ) : null}
        </div>

        {tour.scenes.length > 1 ? (
          <div className="mx-auto mt-3 flex max-w-4xl gap-2 overflow-x-auto pb-1">
            {tour.scenes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectScene(s.id)}
                className={`shrink-0 rounded border px-3 py-1.5 text-xs font-medium ${
                  s.id === scene.id
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-white/30 bg-black/30 text-white"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
