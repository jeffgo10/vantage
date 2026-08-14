import { NextResponse } from "next/server";
import { PANORAMA_UPLOAD } from "@/lib/constants";
import { getOwnedTour } from "@/lib/tours/actions";
import { putPanoramaObject } from "@/lib/r2/panoramas";
import { getNextSceneOrder } from "@/lib/scenes/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Upload a panorama to R2.
 * - Default: also inserts a `scenes` row (legacy).
 * - `persistScene=false`: file only — returns `{ imageUrl }` for explicit Save drafts.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const tourId = String(formData.get("tourId") ?? "");
  const title = String(formData.get("title") ?? "").trim() || "Untitled scene";
  const persistScene = String(formData.get("persistScene") ?? "true") !== "false";
  const file = formData.get("file");

  if (!tourId || !(file instanceof File)) {
    return NextResponse.json(
      { error: "tourId and file are required" },
      { status: 400 },
    );
  }

  const tour = await getOwnedTour(tourId);
  if (!tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  if (
    !PANORAMA_UPLOAD.allowedMimeTypes.includes(
      file.type as (typeof PANORAMA_UPLOAD.allowedMimeTypes)[number],
    )
  ) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, and WebP panoramas are supported." },
      { status: 400 },
    );
  }

  if (file.size > PANORAMA_UPLOAD.maxBytes) {
    return NextResponse.json(
      { error: "Panorama exceeds the 40MB upload limit." },
      { status: 400 },
    );
  }

  let imageUrl: string;
  try {
    ({ imageUrl } = await putPanoramaObject({
      tourId,
      filename: file.name || "panorama.jpg",
      bytes: await file.arrayBuffer(),
      contentType: file.type,
      uploadedBy: user.id,
    }));
  } catch (err) {
    console.error("R2 put failed", err);
    return NextResponse.json(
      { error: "Could not store panorama. Is the R2 binding available?" },
      { status: 503 },
    );
  }

  if (!persistScene) {
    return NextResponse.json({ imageUrl }, { status: 201 });
  }

  const order = await getNextSceneOrder(tourId);
  const { data: scene, error } = await supabase
    .from("scenes")
    .insert({
      tour_id: tourId,
      image_url: imageUrl,
      title,
      order,
    })
    .select("*")
    .single();

  if (error || !scene) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create scene" },
      { status: 500 },
    );
  }

  return NextResponse.json({ scene, imageUrl }, { status: 201 });
}
