"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthError } from "@/components/auth/auth-error";
import {
  createTourSlug,
  isValidTourSlug,
  normalizeTourSlug,
} from "@/lib/tours/slug";

type NewTourFormProps = {
  initialError?: string;
};

export function NewTourForm({ initialError }: NewTourFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const customSlugRaw = String(formData.get("slug") ?? "").trim();

    if (!title) {
      setError("Title is required.");
      return;
    }

    let slug: string;
    if (customSlugRaw) {
      slug = normalizeTourSlug(customSlugRaw);
      if (!isValidTourSlug(slug)) {
        setError(
          slug === "demo"
            ? "The slug “demo” is reserved for the static fixture tour."
            : "Slug must be 2–64 characters: lowercase letters, numbers, and hyphens.",
        );
        return;
      }
    } else {
      slug = createTourSlug(title);
    }

    setIsSubmitting(true);
    const params = new URLSearchParams({ title, slug });
    if (address) params.set("address", address);
    router.push(`/tours/new/edit?${params.toString()}`);
  }

  return (
    <>
      <AuthError message={error ?? undefined} />

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Title</span>
          <input
            name="title"
            required
            placeholder="123 Oak Street"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Address</span>
          <input
            name="address"
            placeholder="Optional location or address"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Public link slug</span>
          <div className="flex items-center gap-0 overflow-hidden rounded-md border border-border bg-surface focus-within:border-accent">
            <span className="shrink-0 border-r border-border bg-surface-elevated px-3 py-2 text-sm text-muted">
              /t/
            </span>
            <input
              name="slug"
              placeholder="demo"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Lowercase letters, numbers, and hyphens"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
            />
          </div>
          <span className="mt-1.5 block text-xs text-muted">
            Optional. Leave blank to auto-generate. Nothing is saved until you click Save in the
            editor.
          </span>
        </label>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
          >
            {isSubmitting ? "Opening editor…" : "Continue to editor"}
          </button>
          <Link
            href="/tours"
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
