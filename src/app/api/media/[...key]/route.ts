import { NextResponse } from "next/server";
import { getPanoramasBucket } from "@/lib/r2/panoramas";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ key: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { key: keyParts } = await context.params;
  if (!keyParts?.length) {
    return NextResponse.json({ error: "Missing object key" }, { status: 400 });
  }

  const objectKey = keyParts.map(decodeURIComponent).join("/");
  const imageUrlPath = `/api/media/${keyParts.map(encodeURIComponent).join("/")}`;

  const supabase = await createClient();

  // RLS: owners see draft scenes; anyone can see scenes on active tours.
  const { data: scene } = await supabase
    .from("scenes")
    .select("id, image_url")
    .eq("image_url", imageUrlPath)
    .maybeSingle();

  if (!scene) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const bucket = await getPanoramasBucket();
    const object = await bucket.get(objectKey);
    if (!object) {
      return NextResponse.json({ error: "Object missing" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType ?? "application/octet-stream",
    );
    headers.set("Cache-Control", "private, max-age=60");
    if (object.httpEtag) {
      headers.set("ETag", object.httpEtag);
    }

    return new NextResponse(object.body, { status: 200, headers });
  } catch (err) {
    console.error("R2 get failed", err);
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }
}
