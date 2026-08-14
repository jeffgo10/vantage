"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createTourSlug,
  isReservedTourSlug,
  isValidTourSlug,
  normalizeTourSlug,
} from "@/lib/tours/slug";
import type { Tour, TourListItem, TourStatus } from "@/types";

function slugValidationError(slug: string): string {
  if (isReservedTourSlug(slug)) {
    return "The slug “demo” is reserved for the static fixture tour.";
  }
  return "Slug must be 2–64 characters: lowercase letters, numbers, and hyphens.";
}

/** Create a tour row without redirect — used by editor Save for new tours. */
export async function createTourRecord(input: {
  title: string;
  address?: string | null;
  slug?: string | null;
}): Promise<{ tour?: Tour; error?: string }> {
  const title = input.title.trim();
  if (!title) {
    return { error: "Title is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const customSlugRaw = (input.slug ?? "").trim();
  let slug: string;
  if (customSlugRaw) {
    slug = normalizeTourSlug(customSlugRaw);
    if (!isValidTourSlug(slug)) {
      return { error: slugValidationError(slug) };
    }

    const { data: existing } = await supabase
      .from("tours")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return { error: `The link /t/${slug} is already taken. Choose another slug.` };
    }
  } else {
    slug = createTourSlug(title);
  }

  const address = (input.address ?? "").trim() || null;

  const { data, error } = await supabase
    .from("tours")
    .insert({
      title,
      address,
      slug,
      owner_user_id: user.id,
      status: "draft",
    })
    .select("*")
    .single();

  if (error || !data) {
    const message =
      error?.code === "23505"
        ? "That public link is already taken. Choose another slug."
        : (error?.message ?? "Could not create tour.");
    return { error: message };
  }

  return { tour: data as Tour };
}

/** @deprecated Prefer continuing to the editor without creating; kept for redirects. */
export async function createTour(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const customSlugRaw = String(formData.get("slug") ?? "").trim();

  const result = await createTourRecord({
    title,
    address,
    slug: customSlugRaw || null,
  });

  if (result.error || !result.tour) {
    redirect(`/tours/new?error=${encodeURIComponent(result.error ?? "Could not create tour.")}`);
  }

  redirect(`/tours/${result.tour.id}/edit`);
}

export async function listOwnedTours(): Promise<TourListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("tours")
    .select("*, scenes(image_url, order)")
    .eq("owner_user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listOwnedTours", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { scenes, ...tour } = row as Tour & {
      scenes: { image_url: string; order: number }[] | null;
    };
    const firstScene = [...(scenes ?? [])].sort((a, b) => a.order - b.order)[0];
    return {
      ...(tour as Tour),
      thumbnailUrl: firstScene?.image_url ?? null,
    };
  });
}

export async function getOwnedTour(id: string): Promise<Tour | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getOwnedTour", error.message);
    return null;
  }

  return data as Tour | null;
}

export async function setTourStatus(tourId: string, status: TourStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("tours")
    .update({ status })
    .eq("id", tourId)
    .eq("owner_user_id", user.id);

  if (error) {
    console.error("setTourStatus", error.message);
  }

  redirect(`/tours/${tourId}/edit`);
}

export async function publishTour(formData: FormData) {
  const tourId = String(formData.get("tourId") ?? "");
  if (!tourId) {
    redirect("/tours");
  }
  await setTourStatus(tourId, "active");
}

export async function unpublishTour(formData: FormData) {
  const tourId = String(formData.get("tourId") ?? "");
  if (!tourId) {
    redirect("/tours");
  }
  await setTourStatus(tourId, "draft");
}

export async function updateTourSlug(formData: FormData) {
  const tourId = String(formData.get("tourId") ?? "").trim();
  const customSlugRaw = String(formData.get("slug") ?? "").trim();

  if (!tourId) {
    redirect("/tours");
  }

  const slug = normalizeTourSlug(customSlugRaw);
  if (!isValidTourSlug(slug)) {
    redirect(
      `/tours/${tourId}/edit?error=${encodeURIComponent(slugValidationError(slug))}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: taken } = await supabase
    .from("tours")
    .select("id")
    .eq("slug", slug)
    .neq("id", tourId)
    .maybeSingle();

  if (taken) {
    redirect(
      `/tours/${tourId}/edit?error=${encodeURIComponent(
        `The link /t/${slug} is already taken.`,
      )}`,
    );
  }

  const { error } = await supabase
    .from("tours")
    .update({ slug })
    .eq("id", tourId)
    .eq("owner_user_id", user.id);

  if (error) {
    const message =
      error.code === "23505"
        ? "That public link is already taken."
        : error.message;
    redirect(`/tours/${tourId}/edit?error=${encodeURIComponent(message)}`);
  }

  redirect(`/tours/${tourId}/edit`);
}
