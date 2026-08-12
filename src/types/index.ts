/** Domain types — mirrors Supabase schema (see supabase/migrations). */

export type SubscriptionTier = "free" | "pro" | "team";
export type TourStatus = "draft" | "active" | "archived";
export type HotspotType = "navigation" | "info";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "agent" | "admin";
  subscription_tier: SubscriptionTier;
  team_id: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  plan: "pro" | "team";
  seat_limit: number;
  created_at: string;
}

export interface Tour {
  id: string;
  owner_user_id: string | null;
  owner_team_id: string | null;
  title: string;
  address: string | null;
  status: TourStatus;
  slug: string;
  created_at: string;
  updated_at: string;
}

/** Tour row for list UIs, with first-scene preview URL when available. */
export interface TourListItem extends Tour {
  thumbnailUrl: string | null;
}

export interface Scene {
  id: string;
  tour_id: string;
  image_url: string;
  order: number;
  title: string;
  created_at: string;
}

export interface Hotspot {
  id: string;
  scene_id: string;
  type: HotspotType;
  target_scene_id: string | null;
  position_yaw: number;
  position_pitch: number;
  content: string | null;
  created_at: string;
}

/** Paid-tier analytics — Phase 3+ */
export interface Lead {
  id: string;
  tour_id: string;
  name: string;
  email: string;
  phone: string | null;
  submitted_at: string;
}

export interface ViewEvent {
  id: string;
  tour_id: string;
  scene_id: string | null;
  session_id: string;
  viewed_at: string;
}

export interface TourWithScenes extends Tour {
  scenes: Scene[];
}

export interface SceneWithHotspots extends Scene {
  hotspots: Hotspot[];
}

export interface TourPayload extends Tour {
  scenes: SceneWithHotspots[];
  /** Owner email for Free-tier "Get in touch" mailto; null when unknown. */
  contact_email: string | null;
}
