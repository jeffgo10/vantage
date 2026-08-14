import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getPanoramasBucket() {
  const { env } = await getCloudflareContext({ async: true });
  return env.PANORAMAS;
}

export function panoramaObjectKey(tourId: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `tours/${tourId}/${crypto.randomUUID()}-${safeName}`;
}

/** Public path used in `scenes.image_url` and by the viewer. */
export function panoramaMediaPath(objectKey: string): string {
  return `/api/media/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

export function objectKeyFromMediaPath(pathname: string): string | null {
  const prefix = "/api/media/";
  if (!pathname.startsWith(prefix)) return null;
  const encoded = pathname.slice(prefix.length);
  if (!encoded) return null;
  return encoded.split("/").map(decodeURIComponent).join("/");
}

/** Store a panorama on R2 and return the public media path (no DB write). */
export async function putPanoramaObject(input: {
  tourId: string;
  filename: string;
  bytes: ArrayBuffer;
  contentType: string;
  uploadedBy: string;
}): Promise<{ objectKey: string; imageUrl: string }> {
  const objectKey = panoramaObjectKey(input.tourId, input.filename);
  const imageUrl = panoramaMediaPath(objectKey);
  const bucket = await getPanoramasBucket();
  await bucket.put(objectKey, input.bytes, {
    httpMetadata: { contentType: input.contentType },
    customMetadata: {
      tourId: input.tourId,
      uploadedBy: input.uploadedBy,
    },
  });
  return { objectKey, imageUrl };
}

export async function deletePanoramaObject(imageUrl: string): Promise<void> {
  const objectKey = objectKeyFromMediaPath(imageUrl);
  if (!objectKey) return;
  const bucket = await getPanoramasBucket();
  await bucket.delete(objectKey);
}
