import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { HeroPanoCarousel } from "@/components/home/hero-pano-carousel";

export default function HomePage() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <HeroPanoCarousel />

      <header className="page-rise relative z-10 flex items-center justify-between px-6 py-5">
        <BrandLogo priority />
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-white/80 hover:text-white">
            Log in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-accent px-3 py-1.5 font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Open app
          </Link>
        </nav>
      </header>

      <main className="page-rise-delay-1 relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-24 pt-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-accent">
          Immersive 360° tours
        </p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Walk a space in 360° — then share the link.
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/75">
          Upload panoramas, connect the rooms, and publish a tour anyone can open in the browser —
          homes, venues, workplaces, and anything in between.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Go to dashboard
          </Link>
          <Link
            href="/t/demo"
            className="rounded-md border border-white/35 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/15"
          >
            Preview public viewer
          </Link>
        </div>
      </main>
    </div>
  );
}
