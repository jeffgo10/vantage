import Link from "next/link";
import { PanoramaViewer } from "@/components/viewer/panorama-viewer";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: slug === "demo" ? "Demo tour" : `Tour · ${slug}`,
    robots: { index: true, follow: true },
  };
}

/** Public shareable tour — no login required. */
export default async function PublicTourPage({ params }: PageProps) {
  const { slug } = await params;
  const title = slug === "demo" ? "Demo property" : slug.replace(/-/g, " ");

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <PanoramaViewer
        imageUrl="https://pannellum.org/images/alma.jpg"
        markers={[
          {
            id: "public-nav",
            yaw: 100,
            pitch: -5,
            kind: "navigation",
            title: "Continue",
          },
          {
            id: "public-info",
            yaw: -30,
            pitch: -8,
            kind: "info",
            title: "Details",
            content: {
              type: "text",
              body: "Bright living room with hardwood floors.",
            },
          },
        ]}
        className="absolute inset-0 h-full w-full"
      />

      {/* Free-tier watermark — Phase 3 will gate on subscription */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded bg-black/45 px-2.5 py-1 text-xs font-medium text-white/90">
        Made with RoamVantage
      </div>

      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button
          type="button"
          className="rounded-md bg-black/45 px-3 py-1.5 text-sm text-white hover:bg-black/60"
        >
          Share
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-16">
        <div className="mx-auto flex max-w-4xl items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/70">Living room</p>
            <h1 className="text-lg font-semibold capitalize text-white">{title}</h1>
          </div>
          <Link
            href="/login"
            className="shrink-0 rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Contact agent
          </Link>
        </div>

        <div className="mx-auto mt-3 flex max-w-4xl gap-2 overflow-x-auto pb-1">
          {["Living room", "Kitchen"].map((scene, i) => (
            <button
              key={scene}
              type="button"
              className={`shrink-0 rounded border px-3 py-1.5 text-xs font-medium ${
                i === 0
                  ? "border-white bg-white text-zinc-900"
                  : "border-white/30 bg-black/30 text-white"
              }`}
            >
              {scene}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
