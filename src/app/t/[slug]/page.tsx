import { notFound } from "next/navigation";
import { PublicTourViewer } from "@/components/viewer/public-tour-viewer";
import { getPublicTourBySlug } from "@/lib/tours/public";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tour = await getPublicTourBySlug(slug);
  return {
    title: tour ? tour.title : "Tour not found",
    robots: { index: true, follow: true },
  };
}

/** Public shareable tour — no login required. */
export default async function PublicTourPage({ params }: PageProps) {
  const { slug } = await params;
  const tour = await getPublicTourBySlug(slug);

  if (!tour) {
    notFound();
  }

  return <PublicTourViewer tour={tour} />;
}
