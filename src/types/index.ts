/** Domain types — mirrors Supabase schema (see supabase/migrations). */

export type SubscriptionTier = "free" | "pro" | "team";
export type PropertyStatus = "draft" | "active" | "archived";
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

export interface Property {
  id: string;
  owner_user_id: string | null;
  owner_team_id: string | null;
  title: string;
  address: string | null;
  status: PropertyStatus;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  property_id: string;
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
  property_id: string;
  name: string;
  email: string;
  phone: string | null;
  submitted_at: string;
}

export interface ViewEvent {
  id: string;
  property_id: string;
  scene_id: string | null;
  session_id: string;
  viewed_at: string;
}

export interface PropertyWithScenes extends Property {
  scenes: Scene[];
}

export interface SceneWithHotspots extends Scene {
  hotspots: Hotspot[];
}

export interface TourPayload extends Property {
  scenes: SceneWithHotspots[];
}
