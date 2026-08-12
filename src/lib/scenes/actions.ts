"use server";

import { getOwnedTour } from "@/lib/tours/actions";
import {
  isReservedTourSlug,
  isValidTourSlug,
  normalizeTourSlug,
} from "@/lib/tours/slug";
import {
  deletePanoramaObject,
  objectKeyFromMediaPath,
} from "@/lib/r2/panoramas";
import { listScenesWithHotspotsForTour } from "@/lib/scenes/queries";
import { createClient } from "@/lib/supabase/server";
import type {
  Hotspot,
  HotspotType,
  TourStatus,
  Scene,
  SceneWithHotspots,
} from "@/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function isTempSceneId(id: string): boolean {
  return id.startsWith("temp_");
}

export type TourDraftHotspotInput = {
  type: HotspotType;
  /** Draft scene id (temp_* or persisted uuid). */
  targetClientSceneId: string | null;
  yaw: number;
  pitch: number;
  content: string | null;
};

export type TourDraftSceneInput = {
  /** Draft id — `temp_…` for new scenes, else existing uuid. */
  clientId: string;
  title: string;
  /** `/api/media/...` path (blob URLs must be uploaded before calling). */
  imageUrl: string;
  hotspots: TourDraftHotspotInput[];
};

export type SaveTourDraftInput = {
  tourId: string;
  slug: string;
  scenes: TourDraftSceneInput[];
};

export async function saveTourDraft(
  input: SaveTourDraftInput,
): Promise<{
  scenes?: SceneWithHotspots[];
  slug?: string;
  idMap?: Record<string, string>;
  error?: string;
}> {
  const tourId = input.tourId?.trim();
  if (!tourId) {
    return { error: "Tour id is required." };
  }

  const slug = normalizeTourSlug(input.slug ?? "");
  if (!isValidTourSlug(slug)) {
    if (isReservedTourSlug(slug)) {
      return { error: "The slug “demo” is reserved for the static fixture tour." };
    }
    return {
      error:
        "Slug must be 2–64 characters: lowercase letters, numbers, and hyphens.",
    };
  }

  for (const scene of input.scenes) {
    if (!scene.title.trim()) {
      return { error: "Every scene needs a name." };
    }
    if (!scene.imageUrl || scene.imageUrl.startsWith("blob:")) {
      return { error: "Upload panoramas before saving." };
    }
    if (!objectKeyFromMediaPath(scene.imageUrl) && !scene.imageUrl.startsWith("/")) {
      return { error: "Invalid panorama URL." };
    }
    for (const hotspot of scene.hotspots) {
      if (!Number.isFinite(hotspot.yaw) || !Number.isFinite(hotspot.pitch)) {
        return { error: "Invalid hotspot position." };
      }
      if (hotspot.type === "navigation" && !hotspot.targetClientSceneId) {
        return { error: "Navigation hotspots need a destination scene." };
      }
      if (hotspot.type === "navigation" && hotspot.targetClientSceneId === scene.clientId) {
        return { error: "Navigation hotspot must link to a different scene." };
      }
    }
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const tour = await getOwnedTour(tourId);
  if (!tour) {
    return { error: "Tour not found." };
  }

  const { data: slugTaken } = await supabase
    .from("tours")
    .select("id")
    .eq("slug", slug)
    .neq("id", tourId)
    .maybeSingle();

  if (slugTaken) {
    return { error: `The link /t/${slug} is already taken.` };
  }

  const { error: slugError } = await supabase
    .from("tours")
    .update({ slug })
    .eq("id", tourId)
    .eq("owner_user_id", user.id);

  if (slugError) {
    return {
      error:
        slugError.code === "23505"
          ? "That public link is already taken."
          : slugError.message,
    };
  }

  const { data: existingRows, error: listError } = await supabase
    .from("scenes")
    .select("id, image_url")
    .eq("tour_id", tourId);

  if (listError) {
    return { error: listError.message };
  }

  const existing = (existingRows ?? []) as Pick<Scene, "id" | "image_url">[];
  const existingById = new Map(existing.map((row) => [row.id, row]));
  const keptPersistedIds = new Set(
    input.scenes.map((scene) => scene.clientId).filter((id) => !isTempSceneId(id)),
  );

  const toDelete = existing.filter((row) => !keptPersistedIds.has(row.id));
  for (const row of toDelete) {
    const { error: inboundError } = await supabase
      .from("hotspots")
      .delete()
      .eq("target_scene_id", row.id);
    if (inboundError) {
      return { error: inboundError.message };
    }

    const { error: deleteError } = await supabase
      .from("scenes")
      .delete()
      .eq("id", row.id);
    if (deleteError) {
      return { error: deleteError.message };
    }

    try {
      await deletePanoramaObject(row.image_url);
    } catch (err) {
      console.error("saveTourDraft R2 cleanup", err);
    }
  }

  const clientToPersisted = new Map<string, string>();

  for (let order = 0; order < input.scenes.length; order += 1) {
    const draft = input.scenes[order];
    const title = draft.title.trim();

    if (isTempSceneId(draft.clientId)) {
      const { data, error } = await supabase
        .from("scenes")
        .insert({
          tour_id: tourId,
          title,
          image_url: draft.imageUrl,
          order,
        })
        .select("id")
        .maybeSingle();

      if (error || !data) {
        return { error: error?.message ?? "Could not create scene." };
      }
      clientToPersisted.set(draft.clientId, data.id as string);
      continue;
    }

    if (!existingById.has(draft.clientId)) {
      return { error: "Scene list is out of date. Refresh and try again." };
    }

    const previous = existingById.get(draft.clientId)!;
    const { error } = await supabase
      .from("scenes")
      .update({
        title,
        image_url: draft.imageUrl,
        order,
      })
      .eq("id", draft.clientId)
      .eq("tour_id", tourId);

    if (error) {
      return { error: error.message };
    }

    clientToPersisted.set(draft.clientId, draft.clientId);

    if (previous.image_url !== draft.imageUrl) {
      try {
        await deletePanoramaObject(previous.image_url);
      } catch (err) {
        console.error("saveTourDraft replaced image cleanup", err);
      }
    }
  }

  for (const draft of input.scenes) {
    const sceneId = clientToPersisted.get(draft.clientId);
    if (!sceneId) {
      return { error: "Could not resolve scene ids." };
    }

    const { error: clearError } = await supabase
      .from("hotspots")
      .delete()
      .eq("scene_id", sceneId);
    if (clearError) {
      return { error: clearError.message };
    }

    if (draft.hotspots.length === 0) continue;

    const rows = draft.hotspots.map((hotspot) => {
      const target =
        hotspot.type === "navigation" && hotspot.targetClientSceneId
          ? (clientToPersisted.get(hotspot.targetClientSceneId) ?? null)
          : null;

      return {
        scene_id: sceneId,
        type: hotspot.type,
        target_scene_id: target,
        position_yaw: hotspot.yaw,
        position_pitch: hotspot.pitch,
        content: hotspot.type === "info" ? hotspot.content?.trim() || null : null,
      };
    });

    if (rows.some((row) => row.type === "navigation" && !row.target_scene_id)) {
      return { error: "A navigation hotspot points to a missing scene." };
    }

    const { error: insertError } = await supabase.from("hotspots").insert(rows);
    if (insertError) {
      return { error: insertError.message };
    }
  }

  const scenes = await listScenesWithHotspotsForTour(tourId);
  return {
    scenes,
    slug,
    idMap: Object.fromEntries(clientToPersisted),
  };
}

export async function updateTourStatus(
  tourId: string,
  status: TourStatus,
): Promise<{ error?: string }> {
  if (!tourId) {
    return { error: "Tour id is required." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("tours")
    .update({ status })
    .eq("id", tourId)
    .eq("owner_user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return {};
}

/** @deprecated Prefer saveTourDraft — kept for compatibility. */
export async function renameScene(
  sceneId: string,
  title: string,
): Promise<{ scene?: Scene; error?: string }> {
  const trimmed = title.trim();
  if (!trimmed) {
    return { error: "Scene name is required." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("scenes")
    .update({ title: trimmed })
    .eq("id", sceneId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { error: error?.message ?? "Could not rename scene." };
  }

  return { scene: data as Scene };
}

/** @deprecated Prefer saveTourDraft */
export async function deleteScene(
  sceneId: string,
): Promise<{ error?: string }> {
  if (!sceneId) {
    return { error: "Scene id is required." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: scene, error: sceneError } = await supabase
    .from("scenes")
    .select("id, image_url")
    .eq("id", sceneId)
    .maybeSingle();

  if (sceneError || !scene) {
    return { error: sceneError?.message ?? "Scene not found." };
  }

  const { error: inboundError } = await supabase
    .from("hotspots")
    .delete()
    .eq("target_scene_id", sceneId);

  if (inboundError) {
    return { error: inboundError.message };
  }

  const { error: deleteError } = await supabase
    .from("scenes")
    .delete()
    .eq("id", sceneId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  try {
    await deletePanoramaObject(scene.image_url);
  } catch (err) {
    console.error("deleteScene R2 cleanup", err);
  }

  return {};
}

/** @deprecated Prefer saveTourDraft */
export async function reorderScenes(
  tourId: string,
  orderedSceneIds: string[],
): Promise<{ error?: string }> {
  if (!tourId || orderedSceneIds.length === 0) {
    return { error: "Nothing to reorder." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: existing, error: listError } = await supabase
    .from("scenes")
    .select("id")
    .eq("tour_id", tourId);

  if (listError) {
    return { error: listError.message };
  }

  const existingIds = new Set((existing ?? []).map((row) => row.id as string));
  if (
    existingIds.size !== orderedSceneIds.length ||
    orderedSceneIds.some((id) => !existingIds.has(id))
  ) {
    return { error: "Scene list is out of date. Refresh and try again." };
  }

  const updates = await Promise.all(
    orderedSceneIds.map((id, index) =>
      supabase.from("scenes").update({ order: index }).eq("id", id),
    ),
  );

  const failed = updates.find((result) => result.error);
  if (failed?.error) {
    return { error: failed.error.message };
  }

  return {};
}

type CreateHotspotInput = {
  sceneId: string;
  type: HotspotType;
  yaw: number;
  pitch: number;
  targetSceneId?: string | null;
  content?: string | null;
};

/** @deprecated Prefer saveTourDraft */
export async function createHotspot(
  input: CreateHotspotInput,
): Promise<{ hotspot?: Hotspot; error?: string }> {
  const { sceneId, type, yaw, pitch } = input;
  const targetSceneId = input.targetSceneId ?? null;
  const content = input.content?.trim() || null;

  if (!sceneId || !Number.isFinite(yaw) || !Number.isFinite(pitch)) {
    return { error: "Invalid hotspot position." };
  }

  if (type === "navigation" && !targetSceneId) {
    return { error: "Pick a destination scene for this navigation hotspot." };
  }

  if (type === "navigation" && targetSceneId === sceneId) {
    return { error: "Navigation hotspot must link to a different scene." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("hotspots")
    .insert({
      scene_id: sceneId,
      type,
      target_scene_id: type === "navigation" ? targetSceneId : null,
      position_yaw: yaw,
      position_pitch: pitch,
      content: type === "info" ? content : null,
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { error: error?.message ?? "Could not create hotspot." };
  }

  return { hotspot: data as Hotspot };
}

/** @deprecated Prefer saveTourDraft */
export async function updateHotspotPosition(
  hotspotId: string,
  yaw: number,
  pitch: number,
): Promise<{ hotspot?: Hotspot; error?: string }> {
  if (!hotspotId || !Number.isFinite(yaw) || !Number.isFinite(pitch)) {
    return { error: "Invalid hotspot position." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("hotspots")
    .update({
      position_yaw: yaw,
      position_pitch: pitch,
    })
    .eq("id", hotspotId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { error: error?.message ?? "Could not move hotspot." };
  }

  return { hotspot: data as Hotspot };
}

/** @deprecated Prefer saveTourDraft */
export async function deleteHotspot(
  hotspotId: string,
): Promise<{ error?: string }> {
  if (!hotspotId) {
    return { error: "Hotspot id is required." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase.from("hotspots").delete().eq("id", hotspotId);

  if (error) {
    return { error: error.message };
  }

  return {};
}
