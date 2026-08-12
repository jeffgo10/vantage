const SLUG_SUFFIX_LENGTH = 6;
const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_MIN_LENGTH = 2;
const SLUG_MAX_LENGTH = 64;

/** Reserved for static fixture routes under `/t/` (e.g. `/t/demo`). */
export const RESERVED_TOUR_SLUGS = new Set(["demo"]);

export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base || "tour";
}

/** Normalize a user-supplied public slug (no random suffix). */
export function normalizeTourSlug(raw: string): string {
  return slugifyTitle(raw).slice(0, SLUG_MAX_LENGTH);
}

export function isReservedTourSlug(slug: string): boolean {
  return RESERVED_TOUR_SLUGS.has(slug);
}

export function isValidTourSlug(slug: string): boolean {
  if (slug.length < SLUG_MIN_LENGTH || slug.length > SLUG_MAX_LENGTH) {
    return false;
  }
  if (isReservedTourSlug(slug)) {
    return false;
  }
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function createTourSlug(title: string): string {
  const suffix = Array.from({ length: SLUG_SUFFIX_LENGTH }, () =>
    SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)],
  ).join("");

  return `${slugifyTitle(title)}-${suffix}`;
}
