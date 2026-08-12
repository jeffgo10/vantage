import { createClient } from "@/lib/supabase/server";
import type { Hotspot, Scene, Tour, TourPayload } from "@/types";

export async function getPublicTourBySlug(slug: string): Promise<TourPayload | null> {
  const supabase = await createClient();

  const { data: tour, error } = await supabase
    .from("tours")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error || !tour) {
    if (error) console.error("getPublicTourBySlug", error.message);
    return null;
  }

  const { data: scenes, error: scenesError } = await supabase
    .from("scenes")
    .select("*")
    .eq("tour_id", tour.id)
    .order("order", { ascending: true });

  if (scenesError) {
    console.error("getPublicTourBySlug scenes", scenesError.message);
    return null;
  }

  const sceneRows = (scenes ?? []) as Scene[];
  const sceneIds = sceneRows.map((s) => s.id);

  let hotspots: Hotspot[] = [];
  if (sceneIds.length > 0) {
    const { data: hotspotRows, error: hotspotsError } = await supabase
      .from("hotspots")
      .select("*")
      .in("scene_id", sceneIds);

    if (hotspotsError) {
      console.error("getPublicTourBySlug hotspots", hotspotsError.message);
    } else {
      hotspots = (hotspotRows ?? []) as Hotspot[];
    }
  }

  let contactEmail: string | null = null;
  const { data: email, error: emailError } = await supabase.rpc(
    "contact_email_for_active_tour",
    { p_tour_id: (tour as Tour).id },
  );

  if (emailError) {
    console.error("getPublicTourBySlug contact_email", emailError.message);
  } else if (typeof email === "string" && email.length > 0) {
    contactEmail = email;
  }

  return {
    ...(tour as Tour),
    contact_email: contactEmail,
    scenes: sceneRows.map((scene) => ({
      ...scene,
      hotspots: hotspots.filter((h) => h.scene_id === scene.id),
    })),
  };
}
