import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { FREE_TIER } from "@/lib/constants";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        actions={
          <>
            <span className="hidden text-sm text-zinc-500 sm:inline">
              0/{FREE_TIER.maxActiveProperties} properties used
            </span>
            <button
              type="button"
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Upgrade
            </button>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent"
              aria-hidden
            >
              A
            </div>
          </>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Your properties</h1>
          <Link
            href="/properties/new"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-[#185a3e]"
          >
            New property
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <EmptyPropertyCard />
        </div>
      </main>
    </div>
  );
}

function EmptyPropertyCard() {
  return (
    <div className="flex min-h-44 flex-col items-start justify-center border border-dashed border-border bg-white p-5 text-left">
      <p className="text-sm font-medium text-zinc-800">No properties yet</p>
      <p className="mt-1 text-sm text-zinc-500">
        Create a property, upload panoramas, and place navigation hotspots.
      </p>
      <Link href="/properties/new" className="mt-4 text-sm font-medium text-accent hover:underline">
        Create your first property →
      </Link>
    </div>
  );
}
