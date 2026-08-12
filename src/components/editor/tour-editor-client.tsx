"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  createTempSceneId,
  makeDraftHotspot,
  revokeBlobUrl,
  sceneSnapshotKey,
  toDraftScenes,
  type DraftScene,
} from "@/components/editor/draft-types";
import { AppHeader } from "@/components/layout/app-header";
import {
  PanoramaViewer,
  type PanoramaMarker,
} from "@/components/viewer/panorama-viewer";
import { AuthError } from "@/components/auth/auth-error";
import {
  EDITOR_PLACEHOLDER_PANORAMA,
  PANORAMA_UPLOAD,
} from "@/lib/constants";
import { hotspotToMarker } from "@/lib/hotspots/markers";
import { createTourRecord } from "@/lib/tours/actions";
import {
  saveTourDraft,
  updateTourStatus,
  type TourDraftSceneInput,
} from "@/lib/scenes/actions";
import type { HotspotType, TourStatus, SceneWithHotspots } from "@/types";

type MoveDirection = -1 | 1;
type PlaceMode = HotspotType | null;

type PendingPlacement = {
  type: HotspotType;
  yaw: number;
  pitch: number;
};

type TourEditorClientProps = {
  /** Null for brand-new tours — tour row is created on first Save. */
  tourId: string | null;
  tourTitle: string;
  tourAddress?: string | null;
  initialSlug: string;
  initialStatus: TourStatus;
  initialScenes: SceneWithHotspots[];
  initialError?: string;
};

export function TourEditorClient({
  tourId: initialTourId,
  tourTitle,
  tourAddress = null,
  initialSlug,
  initialStatus,
  initialScenes,
  initialError,
}: TourEditorClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [tourId, setTourId] = useState<string | null>(initialTourId);
  const [scenes, setScenes] = useState<DraftScene[]>(() => toDraftScenes(initialScenes));
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    initialTourId ? sceneSnapshotKey(toDraftScenes(initialScenes)) : "",
  );
  const [slug, setSlug] = useState(initialSlug);
  const [savedSlug, setSavedSlug] = useState(initialTourId ? initialSlug : "");
  const [status, setPublishStatus] = useState(initialStatus);

  const [selectedId, setSelectedId] = useState<string | null>(initialScenes[0]?.id ?? null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [placeMode, setPlaceMode] = useState<PlaceMode>(null);
  const [pendingPlacement, setPendingPlacement] = useState<PendingPlacement | null>(null);
  const [infoDraft, setInfoDraft] = useState("");
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty =
    tourId === null ||
    sceneSnapshotKey(scenes) !== savedSnapshot ||
    slug.trim() !== savedSlug;
  const isPublished = status === "active";

  useEffect(() => {
    if (!renamingId) return;
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [renamingId]);

  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    return () => {
      for (const scene of scenes) {
        if (scene.pendingFile) revokeBlobUrl(scene.image_url);
      }
    };
    // Only revoke on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional unmount cleanup
  }, []);

  const selected = scenes.find((s) => s.id === selectedId) ?? scenes[0] ?? null;
  const otherScenes = useMemo(
    () => scenes.filter((scene) => scene.id !== selected?.id),
    [scenes, selected?.id],
  );
  const markers = useMemo(
    () => (selected ? selected.hotspots.map(hotspotToMarker) : []),
    [selected],
  );

  function confirmLeave(): boolean {
    if (!isDirty) return true;
    return window.confirm(
      "You have unsaved changes. Leave this page and discard them?",
    );
  }

  function markLocalChange() {
    setError(null);
    setMessage(null);
  }

  function selectScene(sceneId: string) {
    setSelectedId(sceneId);
    setSelectedHotspotId(null);
    setPendingPlacement(null);
    setPlaceMode(null);
  }

  function handleAddSceneClick() {
    markLocalChange();
    fileInputRef.current?.click();
  }

  function beginRename(scene: DraftScene) {
    setRenamingId(scene.id);
    setRenameValue(scene.title);
    markLocalChange();
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue("");
  }

  function commitRename() {
    if (!renamingId) return;
    const title = renameValue.trim();
    if (!title) {
      setError("Scene name is required.");
      return;
    }
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === renamingId ? { ...scene, title } : scene,
      ),
    );
    cancelRename();
    markLocalChange();
    setMessage("Scene renamed (unsaved)");
  }

  function handleMoveScene(sceneId: string, direction: MoveDirection) {
    const index = scenes.findIndex((scene) => scene.id === sceneId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= scenes.length) return;

    const reordered = [...scenes];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);
    setScenes(reordered.map((scene, order) => ({ ...scene, order })));
    markLocalChange();
    setMessage("Scene order updated (unsaved)");
  }

  function handleDeleteScene(scene: DraftScene) {
    const confirmed = window.confirm(
      `Delete “${scene.title}”? Navigation hotspots that linked here will be removed. Save to persist.`,
    );
    if (!confirmed) return;

    if (scene.pendingFile) {
      revokeBlobUrl(scene.image_url);
    }

    const remaining = scenes
      .filter((item) => item.id !== scene.id)
      .map((item, order) => ({
        ...item,
        order,
        hotspots: item.hotspots.filter(
          (hotspot) => hotspot.target_scene_id !== scene.id,
        ),
      }));

    setScenes(remaining);
    if (selectedId === scene.id) {
      setSelectedId(remaining[0]?.id ?? null);
      setSelectedHotspotId(null);
      setPendingPlacement(null);
      setPlaceMode(null);
    }
    if (renamingId === scene.id) cancelRename();
    markLocalChange();
    setMessage(`Deleted “${scene.title}” (unsaved)`);
  }

  function togglePlaceMode(mode: HotspotType) {
    markLocalChange();
    setPendingPlacement(null);
    setInfoDraft("");
    setSelectedHotspotId(null);
    setPlaceMode((current) => (current === mode ? null : mode));
  }

  function handleSphereClick(pos: { yaw: number; pitch: number }) {
    if (!selected || !placeMode || isPending) return;

    if (placeMode === "navigation") {
      if (otherScenes.length === 0) {
        setError("Add another scene before placing a navigation hotspot.");
        setPlaceMode(null);
        return;
      }
      if (otherScenes.length === 1) {
        addHotspotLocally({
          type: "navigation",
          yaw: pos.yaw,
          pitch: pos.pitch,
          targetSceneId: otherScenes[0].id,
        });
        return;
      }
      setPendingPlacement({ type: "navigation", yaw: pos.yaw, pitch: pos.pitch });
      setMessage("Choose a destination scene");
      return;
    }

    setPendingPlacement({ type: "info", yaw: pos.yaw, pitch: pos.pitch });
    setInfoDraft("");
    setMessage("Add text for this info hotspot");
  }

  function addHotspotLocally(input: {
    type: HotspotType;
    yaw: number;
    pitch: number;
    targetSceneId?: string;
    content?: string;
  }) {
    if (!selected) return;
    const hotspot = makeDraftHotspot({
      sceneId: selected.id,
      type: input.type,
      yaw: input.yaw,
      pitch: input.pitch,
      targetSceneId: input.targetSceneId,
      content: input.content,
    });

    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === selected.id
          ? { ...scene, hotspots: [...scene.hotspots, hotspot] }
          : scene,
      ),
    );
    setPendingPlacement(null);
    setPlaceMode(null);
    setInfoDraft("");
    setSelectedHotspotId(hotspot.id);
    markLocalChange();
    setMessage(
      input.type === "navigation"
        ? "Navigation hotspot added (unsaved)"
        : "Info hotspot added (unsaved)",
    );
  }

  function confirmNavigationTarget(targetSceneId: string) {
    if (!pendingPlacement || pendingPlacement.type !== "navigation") return;
    addHotspotLocally({
      type: "navigation",
      yaw: pendingPlacement.yaw,
      pitch: pendingPlacement.pitch,
      targetSceneId,
    });
  }

  function confirmInfoContent() {
    if (!pendingPlacement || pendingPlacement.type !== "info") return;
    const content = infoDraft.trim();
    if (!content) {
      setError("Info hotspot text is required.");
      return;
    }
    addHotspotLocally({
      type: "info",
      yaw: pendingPlacement.yaw,
      pitch: pendingPlacement.pitch,
      content,
    });
  }

  function handleDeleteSelectedHotspot() {
    if (!selected || !selectedHotspotId) return;
    const hotspotId = selectedHotspotId;
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === selected.id
          ? {
              ...scene,
              hotspots: scene.hotspots.filter((hotspot) => hotspot.id !== hotspotId),
            }
          : scene,
      ),
    );
    setSelectedHotspotId(null);
    markLocalChange();
    setMessage("Hotspot removed (unsaved)");
  }

  function handleMarkerMove(
    marker: PanoramaMarker,
    pos: { yaw: number; pitch: number },
  ) {
    if (!selected) return;
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === selected.id
          ? {
              ...scene,
              hotspots: scene.hotspots.map((hotspot) =>
                hotspot.id === marker.id
                  ? {
                      ...hotspot,
                      position_yaw: pos.yaw,
                      position_pitch: pos.pitch,
                    }
                  : hotspot,
              ),
            }
          : scene,
      ),
    );
    setSelectedHotspotId(marker.id);
    markLocalChange();
    setMessage("Hotspot moved (unsaved)");
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (
      !PANORAMA_UPLOAD.allowedMimeTypes.includes(
        file.type as (typeof PANORAMA_UPLOAD.allowedMimeTypes)[number],
      )
    ) {
      setError("Only JPEG, PNG, and WebP panoramas are supported.");
      return;
    }
    if (file.size > PANORAMA_UPLOAD.maxBytes) {
      setError("Panorama exceeds the 40MB upload limit.");
      return;
    }

    const id = createTempSceneId();
    const imageUrl = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^.]+$/, "") || "Untitled scene";
    const next: DraftScene = {
      id,
      tour_id: tourId ?? "",
      title,
      image_url: imageUrl,
      order: scenes.length,
      created_at: new Date().toISOString(),
      hotspots: [],
      pendingFile: file,
    };

    setScenes((prev) => [...prev, next]);
    setSelectedId(id);
    setSelectedHotspotId(null);
    setPendingPlacement(null);
    setPlaceMode(null);
    markLocalChange();
    setMessage("Scene added locally — Save to upload");
  }

  async function uploadPendingFiles(
    draft: DraftScene[],
    uploadTourId: string,
  ): Promise<{ imageUrls?: Map<string, string>; error?: string }> {
    const imageUrls = new Map<string, string>();

    for (const scene of draft) {
      if (!scene.pendingFile) {
        imageUrls.set(scene.id, scene.image_url);
        continue;
      }

      const body = new FormData();
      body.set("tourId", uploadTourId);
      body.set("file", scene.pendingFile);
      body.set("persistScene", "false");
      body.set("title", scene.title);

      const res = await fetch("/api/uploads/panorama", { method: "POST", body });
      const payload = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok || !payload.imageUrl) {
        return {
          error: payload.error ?? "Could not upload panorama. Try again.",
        };
      }
      imageUrls.set(scene.id, payload.imageUrl);
    }

    return { imageUrls };
  }

  function buildSavePayload(
    draft: DraftScene[],
    imageUrls: Map<string, string>,
  ): TourDraftSceneInput[] {
    return draft.map((scene) => ({
      clientId: scene.id,
      title: scene.title,
      imageUrl: imageUrls.get(scene.id) ?? scene.image_url,
      hotspots: scene.hotspots.map((hotspot) => ({
        type: hotspot.type,
        targetClientSceneId: hotspot.target_scene_id,
        yaw: hotspot.position_yaw,
        pitch: hotspot.position_pitch,
        content: hotspot.content,
      })),
    }));
  }

  async function persistDraft(): Promise<{
    scenes?: SceneWithHotspots[];
    slug?: string;
    idMap?: Record<string, string>;
    tourId?: string;
    error?: string;
  }> {
    let activeTourId = tourId;

    if (!activeTourId) {
      const created = await createTourRecord({
        title: tourTitle,
        address: tourAddress,
        slug,
      });
      if (created.error || !created.tour) {
        return { error: created.error ?? "Could not create tour." };
      }
      activeTourId = created.tour.id;
      setTourId(activeTourId);
      setSlug(created.tour.slug);
    }

    const uploaded = await uploadPendingFiles(scenes, activeTourId);
    if (uploaded.error || !uploaded.imageUrls) {
      return { error: uploaded.error ?? "Upload failed.", tourId: activeTourId };
    }

    const result = await saveTourDraft({
      tourId: activeTourId,
      slug,
      scenes: buildSavePayload(scenes, uploaded.imageUrls),
    });

    if (result.error || !result.scenes) {
      return {
        error: result.error ?? "Could not save tour.",
        tourId: activeTourId,
      };
    }

    for (const scene of scenes) {
      if (scene.pendingFile) revokeBlobUrl(scene.image_url);
    }

    return { ...result, tourId: activeTourId };
  }

  function applySavedResult(result: {
    scenes: SceneWithHotspots[];
    slug?: string;
    idMap?: Record<string, string>;
    tourId?: string;
  }) {
    const nextDraft = toDraftScenes(result.scenes);
    setScenes(nextDraft);
    setSavedSnapshot(sceneSnapshotKey(nextDraft));
    if (result.slug) {
      setSlug(result.slug);
      setSavedSlug(result.slug);
    } else {
      setSavedSlug(slug.trim());
    }
    if (result.tourId) {
      setTourId(result.tourId);
    }
    setSelectedHotspotId(null);
    setSelectedId((current) => {
      if (!current) return result.scenes[0]?.id ?? null;
      const mapped = result.idMap?.[current];
      if (mapped) return mapped;
      if (result.scenes.some((scene) => scene.id === current)) return current;
      return result.scenes[0]?.id ?? null;
    });

    if (result.tourId && initialTourId === null) {
      router.replace(`/tours/${result.tourId}/edit`);
    } else {
      router.refresh();
    }
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      setMessage("Saving…");
      const result = await persistDraft();
      if (result.error || !result.scenes) {
        setMessage(null);
        setError(result.error ?? "Could not save tour.");
        if (result.tourId && initialTourId === null) {
          // Tour row may already exist after a partial save — keep editing there.
          router.replace(`/tours/${result.tourId}/edit`);
        }
        return;
      }

      applySavedResult({
        scenes: result.scenes,
        slug: result.slug,
        idMap: result.idMap,
        tourId: result.tourId,
      });
      setMessage("All changes saved");
    });
  }

  function handlePublish() {
    startTransition(async () => {
      setError(null);
      setMessage(isDirty ? "Saving before publish…" : "Publishing…");

      let activeTourId = tourId;

      if (isDirty || !activeTourId) {
        const saved = await persistDraft();
        if (saved.error || !saved.scenes) {
          setMessage(null);
          setError(saved.error ?? "Could not save tour.");
          if (saved.tourId && initialTourId === null) {
            router.replace(`/tours/${saved.tourId}/edit`);
          }
          return;
        }
        applySavedResult({
          scenes: saved.scenes,
          slug: saved.slug,
          idMap: saved.idMap,
          tourId: saved.tourId,
        });
        activeTourId = saved.tourId ?? tourId;
      }

      if (!activeTourId) {
        setMessage(null);
        setError("Save the tour before publishing.");
        return;
      }

      const published = await updateTourStatus(activeTourId, "active");
      if (published.error) {
        setMessage(null);
        setError(published.error);
        return;
      }
      setPublishStatus("active");
      setMessage("Tour published");
      router.refresh();
    });
  }

  function handleUnpublish() {
    startTransition(async () => {
      if (!tourId) {
        setError("Save the tour before unpublishing.");
        return;
      }
      setError(null);
      const result = await updateTourStatus(tourId, "draft");
      if (result.error) {
        setError(result.error);
        return;
      }
      setPublishStatus("draft");
      setMessage("Tour unpublished");
      router.refresh();
    });
  }

  const canPlaceHotspots = Boolean(selected);
  const placementHint =
    placeMode === "navigation"
      ? "Click the panorama to place a navigation hotspot"
      : placeMode === "info"
        ? "Click the panorama to place an info hotspot"
        : null;

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader
        title={tourTitle}
        leaveGuard={confirmLeave}
        actions={
          <>
            {isDirty ? (
              <span className="hidden text-sm text-amber-300 sm:inline">Unsaved changes</span>
            ) : isPublished ? null : (
              <span className="hidden text-sm text-muted sm:inline">Draft</span>
            )}
            {isPublished ? (
              <Link
                href={`/t/${savedSlug}`}
                onClick={(event) => {
                  if (!confirmLeave()) event.preventDefault();
                }}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground/85 hover:bg-surface-elevated"
              >
                View public link
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !isDirty}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-elevated disabled:opacity-50"
            >
              {isPending ? "Working…" : "Save"}
            </button>
            {isPublished ? (
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={isPending}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground/85 hover:bg-surface-elevated disabled:opacity-50"
              >
                Unpublish
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPending}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
              >
                Publish
              </button>
            )}
          </>
        }
      />

      <div className="page-rise-delay-1 border-b border-border bg-surface px-4 py-2">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <label htmlFor="tour-slug" className="text-sm text-muted">
            Public link
          </label>
          <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-md border border-border focus-within:border-accent">
            <span className="shrink-0 border-r border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-muted">
              /t/
            </span>
            <input
              id="tour-slug"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                markLocalChange();
              }}
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Lowercase letters, numbers, and hyphens"
              className="min-w-0 flex-1 px-2.5 py-1.5 text-sm outline-none"
            />
          </div>
          <span className="text-xs text-muted">Saved with Save</span>
        </div>
        <div className="mx-auto max-w-3xl">
          <AuthError message={error ?? undefined} />
          {message && !error ? (
            <p className="mt-2 text-sm text-muted" aria-live="polite">
              {message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
          <div className="border-b border-border px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Scenes
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {scenes.length === 0 ? (
              <li className="rounded-md bg-surface-elevated px-3 py-4 text-sm text-muted">
                <p className="font-medium text-foreground">No scenes yet</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Upload a 360° panorama to start building this tour. Changes stay
                  local until you Save.
                </p>
              </li>
            ) : (
              scenes.map((scene, index) => {
                const isSelected = selected?.id === scene.id;
                const isRenaming = renamingId === scene.id;

                return (
                  <li key={scene.id} className="mb-1">
                    {isRenaming ? (
                      <form
                        className="space-y-1"
                        onSubmit={(event) => {
                          event.preventDefault();
                          commitRename();
                        }}
                      >
                        <label className="sr-only" htmlFor={`rename-scene-${scene.id}`}>
                          Scene name
                        </label>
                        <input
                          ref={renameInputRef}
                          id={`rename-scene-${scene.id}`}
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              event.preventDefault();
                              cancelRename();
                            }
                          }}
                          disabled={isPending}
                          className="w-full rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
                        />
                        <div className="flex gap-1">
                          <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground disabled:opacity-60"
                          >
                            Done
                          </button>
                          <button
                            type="button"
                            onClick={cancelRename}
                            disabled={isPending}
                            className="rounded-md border border-border px-2 py-1 text-xs text-muted disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div
                        className={`rounded-md ${
                          isSelected ? "bg-accent-muted" : "hover:bg-surface-elevated"
                        }`}
                      >
                        <div className="flex items-center gap-0.5">
                          <div className="flex shrink-0 flex-col py-0.5 pl-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveScene(scene.id, -1)}
                              disabled={isPending || index === 0}
                              className="rounded px-1 py-0.5 text-[10px] leading-none text-muted hover:bg-surface-elevated disabled:opacity-30"
                              aria-label={`Move ${scene.title} up`}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveScene(scene.id, 1)}
                              disabled={isPending || index === scenes.length - 1}
                              className="rounded px-1 py-0.5 text-[10px] leading-none text-muted hover:bg-surface-elevated disabled:opacity-30"
                              aria-label={`Move ${scene.title} down`}
                            >
                              ▼
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => selectScene(scene.id)}
                            className={`min-w-0 flex-1 py-2 pr-1 text-left text-sm ${
                              isSelected
                                ? "font-medium text-accent"
                                : "text-muted"
                            }`}
                          >
                            <span className="block truncate">{scene.title}</span>
                            {scene.pendingFile ? (
                              <span className="block text-[10px] font-normal text-amber-300">
                                Not uploaded yet
                              </span>
                            ) : null}
                          </button>
                        </div>
                        {isSelected ? (
                          <div className="flex gap-1 px-2 pb-2">
                            <button
                              type="button"
                              onClick={() => beginRename(scene)}
                              disabled={isPending}
                              className="rounded px-2 py-1 text-xs font-medium text-muted hover:bg-surface-elevated disabled:opacity-60"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteScene(scene)}
                              disabled={isPending}
                              className="rounded px-2 py-1 text-xs font-medium text-danger hover:bg-surface-elevated disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={handleAddSceneClick}
            disabled={isPending}
            className="m-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted hover:bg-surface-elevated disabled:opacity-60"
          >
            + Add scene
          </button>
        </aside>

        <section className="relative min-w-0 flex-1 bg-[#061617]">
          <PanoramaViewer
            imageUrl={selected?.image_url ?? EDITOR_PLACEHOLDER_PANORAMA}
            mode="edit"
            markers={selected ? markers : []}
            onSphereClick={handleSphereClick}
            onMarkerMove={handleMarkerMove}
            onMarkerClick={(marker) => {
              if (!selected) return;
              setSelectedHotspotId(marker.id);
              setPlaceMode(null);
              setPendingPlacement(null);
              setMessage("Hotspot selected — drag to move or delete");
            }}
            className="absolute inset-0 h-full w-full"
          />

          {scenes.length > 0 ? (
            <div className="absolute inset-x-0 top-0 z-10 flex gap-2 overflow-x-auto bg-gradient-to-b from-black/55 to-transparent px-3 pb-8 pt-3 md:hidden">
              {scenes.map((scene) => {
                const isSelected = selected?.id === scene.id;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => selectScene(scene.id)}
                    className={`shrink-0 rounded border px-3 py-1.5 text-xs font-medium ${
                      isSelected
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-white/30 bg-black/35 text-white"
                    }`}
                  >
                    {scene.title}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="absolute bottom-4 left-1/2 z-10 flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 flex-col gap-2">
            {(error || message) && (
              <p
                role={error ? "alert" : undefined}
                aria-live="polite"
                className={`rounded-md px-3 py-2 text-center text-xs md:hidden ${
                  error ? "bg-danger-muted text-danger" : "bg-black/55 text-white/90"
                }`}
              >
                {error ?? message}
              </p>
            )}

            {pendingPlacement?.type === "navigation" ? (
              <div className="rounded-md border border-border bg-surface p-3 shadow-sm">
                <p className="text-sm font-medium text-foreground">Link to scene</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {otherScenes.map((scene) => (
                    <button
                      key={scene.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => confirmNavigationTarget(scene.id)}
                      className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground/85 hover:bg-surface-elevated disabled:opacity-60"
                    >
                      {scene.title}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setPendingPlacement(null);
                      setPlaceMode(null);
                      setMessage(null);
                    }}
                    className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {pendingPlacement?.type === "info" ? (
              <form
                className="rounded-md border border-border bg-surface p-3 shadow-sm"
                onSubmit={(event) => {
                  event.preventDefault();
                  confirmInfoContent();
                }}
              >
                <label
                  htmlFor="info-hotspot-content"
                  className="text-sm font-medium text-foreground"
                >
                  Info hotspot text
                </label>
                <textarea
                  id="info-hotspot-content"
                  value={infoDraft}
                  onChange={(event) => setInfoDraft(event.target.value)}
                  rows={3}
                  disabled={isPending}
                  className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                  placeholder="Room specs, notes for buyers…"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
                  >
                    Add hotspot
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingPlacement(null);
                      setPlaceMode(null);
                      setInfoDraft("");
                      setMessage(null);
                    }}
                    className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-2 rounded-md border border-border bg-surface/95 p-1.5 shadow-sm backdrop-blur">
              <button
                type="button"
                onClick={() => togglePlaceMode("navigation")}
                disabled={!canPlaceHotspots || isPending || Boolean(pendingPlacement)}
                aria-pressed={placeMode === "navigation"}
                className={`rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
                  placeMode === "navigation"
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/85 hover:bg-surface-elevated"
                }`}
              >
                Add navigation hotspot
              </button>
              <button
                type="button"
                onClick={() => togglePlaceMode("info")}
                disabled={!canPlaceHotspots || isPending || Boolean(pendingPlacement)}
                aria-pressed={placeMode === "info"}
                className={`rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
                  placeMode === "info"
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/85 hover:bg-surface-elevated"
                }`}
              >
                Add info hotspot
              </button>
              {selectedHotspotId ? (
                <button
                  type="button"
                  onClick={handleDeleteSelectedHotspot}
                  disabled={isPending}
                  className="rounded px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-muted disabled:opacity-50"
                >
                  Delete hotspot
                </button>
              ) : null}
            </div>

            {placementHint && !pendingPlacement ? (
              <p className="text-center text-xs text-white/90" aria-live="polite">
                {placementHint}
              </p>
            ) : null}
          </div>

          {!selected ? (
            <div className="pointer-events-none absolute inset-x-4 top-1/3 z-10 mx-auto max-w-sm rounded-md bg-black/55 px-4 py-3 text-center text-white">
              <p className="text-sm font-medium">No panorama yet</p>
              <p className="mt-1 text-xs text-white/80">
                Add a scene to replace this placeholder. Save when you are ready
                to keep your work.
              </p>
            </div>
          ) : null}

          <div
            className={`absolute right-3 z-20 flex gap-2 md:hidden ${
              scenes.length > 0 ? "top-14" : "top-3"
            }`}
          >
            {selected ? (
              <>
                <button
                  type="button"
                  onClick={() => beginRename(selected)}
                  disabled={isPending}
                  className="rounded-md bg-surface/95 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm disabled:opacity-60"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteScene(selected)}
                  disabled={isPending}
                  className="rounded-md bg-surface/95 px-3 py-1.5 text-sm font-medium text-danger shadow-sm disabled:opacity-60"
                >
                  Delete
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={handleAddSceneClick}
              disabled={isPending}
              className="rounded-md bg-surface/95 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm disabled:opacity-60"
            >
              Add scene
            </button>
          </div>

          {renamingId && selected && renamingId === selected.id ? (
            <div
              className={`absolute inset-x-3 z-20 rounded-md border border-border bg-surface p-3 shadow-sm md:hidden ${
                scenes.length > 0 ? "top-28" : "top-14"
              }`}
            >
              <label className="text-sm font-medium text-foreground" htmlFor="mobile-rename">
                Scene name
              </label>
              <input
                id="mobile-rename"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={commitRename}
                  className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={cancelRename}
                  className="rounded-md px-3 py-1.5 text-sm text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
