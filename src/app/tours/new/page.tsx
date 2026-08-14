import { AppHeader } from "@/components/layout/app-header";
import { NewTourForm } from "@/components/tours/new-tour-form";

export const metadata = {
  title: "New tour",
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewTourPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader title="New tour" />
      <main className="page-rise-delay-1 mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create tour</h1>
        <p className="mt-2 text-sm text-muted">
          Add a title, then upload panoramas and place hotspots in the editor. The tour is only
          created when you Save.
        </p>

        <NewTourForm initialError={error} />
      </main>
    </div>
  );
}
