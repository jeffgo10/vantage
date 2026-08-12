import { createClient } from "@/lib/supabase/server";
import type { Hotspot, Scene, SceneWithHotspots } from "@/types";

export async function listScenesForTour(tourId: string): Promise<Scene[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("tour_id", tourId)
    .order("order", { ascending: true });

  if (error) {
    console.error("listScenesForTour", error.message);
    return [];
  }

  return (data ?? []) as Scene[];
}

export async function listScenesWithHotspotsForTour(
  tourId: string,
): Promise<SceneWithHotspots[]> {
  const scenes = await listScenesForTour(tourId);
  if (scenes.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const sceneIds = scenes.map((scene) => scene.id);
  const { data, error } = await supabase
    .from("hotspots")
    .select("*")
    .in("scene_id", sceneIds);

  if (error) {
    console.error("listScenesWithHotspotsForTour", error.message);
    return scenes.map((scene) => ({ ...scene, hotspots: [] }));
  }

  const hotspots = (data ?? []) as Hotspot[];
  return scenes.map((scene) => ({
    ...scene,
    hotspots: hotspots.filter((hotspot) => hotspot.scene_id === scene.id),
  }));
}

export async function getNextSceneOrder(tourId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scenes")
    .select("order")
    .eq("tour_id", tourId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? data.order + 1 : 0;
}
