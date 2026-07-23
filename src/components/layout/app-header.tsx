import Link from "next/link";

export function AppHeader({
  title,
  actions,
}: {
  title?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-zinc-900">
          Vantage
        </Link>
        {title ? <span className="text-sm text-zinc-500">{title}</span> : null}
      </div>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
}
