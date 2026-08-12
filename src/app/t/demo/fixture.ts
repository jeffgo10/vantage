import type { TourPayload } from "@/types";
import fixture from "./tour.fixture.json";

/** Static demo tour — no Supabase. Used by `/t/demo`. */
export function getDemoTourFixture(): TourPayload {
  return fixture as TourPayload;
}
