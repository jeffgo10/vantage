import type { Hotspot, HotspotType, SceneWithHotspots } from "@/types";

export type DraftHotspot = Hotspot;

export type DraftScene = SceneWithHotspots & {
  /** Present for newly added scenes until Save uploads to R2. */
  pendingFile?: File;
};

export function isTempSceneId(id: string): boolean {
  return id.startsWith("temp_");
}

export function createTempSceneId(): string {
  return `temp_${crypto.randomUUID()}`;
}

export function createTempHotspotId(): string {
  return `temp_${crypto.randomUUID()}`;
}

export function toDraftScenes(scenes: SceneWithHotspots[]): DraftScene[] {
  return scenes.map((scene) => ({
    ...scene,
    hotspots: scene.hotspots.map((hotspot) => ({ ...hotspot })),
  }));
}

export function revokeBlobUrl(url: string | undefined) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function sceneSnapshotKey(scenes: DraftScene[]): string {
  return JSON.stringify(
    scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      order: scene.order,
      image_url: scene.pendingFile ? `pending:${scene.pendingFile.name}:${scene.pendingFile.size}` : scene.image_url,
      hotspots: scene.hotspots.map((hotspot) => ({
        id: hotspot.id,
        type: hotspot.type,
        target_scene_id: hotspot.target_scene_id,
        position_yaw: hotspot.position_yaw,
        position_pitch: hotspot.position_pitch,
        content: hotspot.content,
      })),
    })),
  );
}

export function makeDraftHotspot(input: {
  sceneId: string;
  type: HotspotType;
  yaw: number;
  pitch: number;
  targetSceneId?: string | null;
  content?: string | null;
}): DraftHotspot {
  return {
    id: createTempHotspotId(),
    scene_id: input.sceneId,
    type: input.type,
    target_scene_id: input.type === "navigation" ? (input.targetSceneId ?? null) : null,
    position_yaw: input.yaw,
    position_pitch: input.pitch,
    content: input.type === "info" ? (input.content?.trim() || null) : null,
    created_at: new Date().toISOString(),
  };
}
