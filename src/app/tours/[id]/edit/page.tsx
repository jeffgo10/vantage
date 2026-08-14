import { notFound } from "next/navigation";
import { TourEditorClient } from "@/components/editor/tour-editor-client";
import { getOwnedTour } from "@/lib/tours/actions";
import { listScenesWithHotspotsForTour } from "@/lib/scenes/queries";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const tour = await getOwnedTour(id);
  return { title: tour ? `Edit · ${tour.title}` : "Edit tour" };
}

export default async function TourEditorPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const tour = await getOwnedTour(id);
  if (!tour) {
    notFound();
  }

  const scenes = await listScenesWithHotspotsForTour(tour.id);

  return (
    <TourEditorClient
      tourId={tour.id}
      tourTitle={tour.title}
      tourAddress={tour.address}
      initialSlug={tour.slug}
      initialStatus={tour.status}
      initialScenes={scenes}
      initialError={error}
    />
  );
}
