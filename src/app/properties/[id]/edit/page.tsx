import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { PanoramaViewer } from "@/components/viewer/panorama-viewer";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Edit tour · ${id}` };
}

export default async function TourEditorPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader
        title={`Tour editor · ${id}`}
        actions={
          <>
            <Link
              href={`/t/${id}`}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Preview
            </Link>
            <button
              type="button"
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-[#185a3e]"
            >
              Save & publish
            </button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-white md:flex">
          <div className="border-b border-border px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Scenes
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            <li className="rounded-md bg-accent-muted px-3 py-2 text-sm font-medium text-accent">
              Living room
            </li>
            <li className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Kitchen</li>
          </ul>
          <button
            type="button"
            className="m-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            + Add scene
          </button>
        </aside>

        <section className="relative min-w-0 flex-1 bg-zinc-900">
          <PanoramaViewer
            imageUrl="https://pannellum.org/images/alma.jpg"
            hotspots={[
              {
                id: "demo-nav",
                yaw: 100,
                pitch: -5,
                type: "navigation",
                text: "To kitchen",
              },
            ]}
            className="absolute inset-0 h-full w-full"
          />

          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-md border border-border bg-white/95 p-1.5 shadow-sm backdrop-blur">
            <button
              type="button"
              className="rounded px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Add navigation hotspot
            </button>
            <button
              type="button"
              className="rounded px-3 py-1.5 text-sm font-medium text-zinc-400"
              disabled
              title="Paid tier — Phase 3"
            >
              Add info hotspot
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
