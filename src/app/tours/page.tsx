import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppHeader } from "@/components/layout/app-header";
import { EmptyTourCard, TourCard } from "@/components/tours/tour-card";
import { FREE_TIER } from "@/lib/constants";
import { listOwnedTours } from "@/lib/tours/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Tours",
};

export default async function ToursPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, tours] = await Promise.all([
    user
      ? supabase.from("profiles").select("name, email").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    listOwnedTours(),
  ]);

  const displayName = profile?.name?.trim() || profile?.email || user?.email || "A";
  const initial = displayName.charAt(0).toUpperCase();
  const activeCount = tours.filter((t) => t.status === "active").length;

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        actions={
          <>
            <span className="hidden text-sm text-muted sm:inline">
              {activeCount}/{FREE_TIER.maxActiveTours} tours used
            </span>
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-elevated"
              disabled
              title="Billing unlocks in Phase 3"
            >
              Upgrade
            </button>
            <SignOutButton />
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent"
              aria-hidden
              title={displayName}
            >
              {initial}
            </div>
          </>
        }
      />

      <main className="page-rise-delay-1 mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your tours</h1>
          <Link
            href="/tours/new"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            New tour
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tours.length === 0 ? (
            <EmptyTourCard />
          ) : (
            tours.map((tour) => <TourCard key={tour.id} tour={tour} />)
          )}
        </div>
      </main>
    </div>
  );
}
