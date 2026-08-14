import { redirect } from "next/navigation";
import { TourEditorClient } from "@/components/editor/tour-editor-client";
import {
  createTourSlug,
  isValidTourSlug,
  normalizeTourSlug,
} from "@/lib/tours/slug";

export const metadata = {
  title: "New tour · Editor",
};

type PageProps = {
  searchParams: Promise<{ title?: string; address?: string; slug?: string }>;
};

export default async function NewTourEditorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const title = (params.title ?? "").trim();
  if (!title) {
    redirect("/tours/new");
  }

  const address = (params.address ?? "").trim();
  const rawSlug = (params.slug ?? "").trim();
  const slug = rawSlug
    ? normalizeTourSlug(rawSlug)
    : createTourSlug(title);

  if (!isValidTourSlug(slug)) {
    redirect(
      `/tours/new?error=${encodeURIComponent(
        "Slug must be 2–64 characters: lowercase letters, numbers, and hyphens.",
      )}`,
    );
  }

  return (
    <TourEditorClient
      tourId={null}
      tourTitle={title}
      tourAddress={address || null}
      initialSlug={slug}
      initialStatus="draft"
      initialScenes={[]}
    />
  );
}
