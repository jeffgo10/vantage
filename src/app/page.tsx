import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e8f2ec_0%,_#f7f7f5_45%,_#efece6_100%)]"
      />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <span className="text-xl font-semibold tracking-tight">RoamVantage</span>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
            Log in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:bg-[#185a3e]"
          >
            Open app
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-24 pt-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-accent">
          Virtual tours for real estate
        </p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Walk a property in 360° — then share the link.
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-zinc-600">
          RoamVantage lets agents stitch panoramic rooms into a navigable tour buyers can open on any
          device. No app store. No Matterport price tag.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go to dashboard
          </Link>
          <Link
            href="/t/demo"
            className="rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Preview public viewer
          </Link>
        </div>
      </main>
    </div>
  );
}
