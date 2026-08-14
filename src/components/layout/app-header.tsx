"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";

function navLinkClass(active: boolean): string {
  return [
    "text-sm font-medium transition-colors",
    active ? "text-accent" : "text-muted hover:text-foreground",
  ].join(" ");
}

export function AppHeader({
  title,
  actions,
  leaveGuard,
}: {
  title?: string;
  actions?: React.ReactNode;
  /** Return false to cancel navigation away from the page. */
  leaveGuard?: () => boolean;
}) {
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";
  const onTours =
    pathname === "/tours" ||
    pathname.startsWith("/tours/");

  const guardClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (leaveGuard && !leaveGuard()) {
      event.preventDefault();
    }
  };

  return (
    <header className="page-rise flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-6">
        <BrandLogo href="/dashboard" onClick={guardClick} />
        <nav className="flex items-center gap-4" aria-label="Primary">
          <Link
            href="/dashboard"
            className={navLinkClass(onDashboard)}
            aria-current={onDashboard ? "page" : undefined}
            onClick={guardClick}
          >
            Dashboard
          </Link>
          <Link
            href="/tours"
            className={navLinkClass(onTours)}
            aria-current={onTours ? "page" : undefined}
            onClick={guardClick}
          >
            Tours
          </Link>
        </nav>
        {title ? <span className="hidden text-sm text-muted sm:inline">{title}</span> : null}
      </div>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
}
