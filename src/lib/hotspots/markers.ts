import type { PanoramaMarker } from "@/components/viewer/panorama-viewer";
import type { Hotspot } from "@/types";

const NAV_CHEVRON_ICON = "/icons/nav-chevron.svg";

export function hotspotToMarker(hotspot: Hotspot): PanoramaMarker {
  const isNav = hotspot.type === "navigation";
  return {
    id: hotspot.id,
    yaw: hotspot.position_yaw,
    pitch: hotspot.position_pitch,
    kind: isNav ? "navigation" : "info",
    title: isNav ? "Go" : "Info",
    pin: isNav ? { iconUrl: NAV_CHEVRON_ICON } : undefined,
    content: hotspot.content
      ? { type: "text", body: hotspot.content }
      : undefined,
    data: hotspot.target_scene_id
      ? { targetSceneId: hotspot.target_scene_id }
      : undefined,
  };
}
