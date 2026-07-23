import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";

export const metadata = {
  title: "New property",
};

export default function NewPropertyPage() {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader title="New property" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Create property</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Auth + Supabase insert land in the next Phase 1 slice. This form is a UI placeholder.
        </p>

        <form className="mt-8 space-y-4" action="/dashboard">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Title</span>
            <input
              name="title"
              required
              placeholder="123 Oak Street"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Address</span>
            <input
              name="address"
              placeholder="Optional listing address"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#185a3e]"
            >
              Continue to editor
            </button>
            <Link
              href="/dashboard"
              className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-zinc-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
