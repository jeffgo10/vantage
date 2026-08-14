import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ViewsByTour } from "@/components/dashboard/views-by-tour";
import { ViewsChart } from "@/components/dashboard/views-chart";
import { AppHeader } from "@/components/layout/app-header";
import {
  MOCK_DASHBOARD_SUMMARY,
  MOCK_DAILY_VIEWS,
  MOCK_RECENT_ACTIVITY,
  viewsByTourForOwned,
} from "@/lib/analytics/mock-dashboard";
import { FREE_TIER } from "@/lib/constants";
import { listOwnedTours } from "@/lib/tours/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
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
  const viewsByTour = viewsByTourForOwned(
    tours.map((t) => ({ id: t.id, title: t.title, slug: t.slug })),
  );

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        actions={
          <>
            <Link
              href="/tours"
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            >
              Your tours
            </Link>
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
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Last 14 days · sample data</p>
        </div>

        <div className="space-y-6">
          <SummaryCards
            summary={MOCK_DASHBOARD_SUMMARY}
            activeTours={activeCount}
            maxActiveTours={FREE_TIER.maxActiveTours}
          />

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ViewsChart points={MOCK_DAILY_VIEWS} />
            </div>
            <div className="lg:col-span-2">
              <ViewsByTour stats={viewsByTour} />
            </div>
          </div>

          <RecentActivity items={MOCK_RECENT_ACTIVITY} />
        </div>
      </main>
    </div>
  );
}
