import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";

type BrandLogoProps = {
  href?: string;
  priority?: boolean;
  className?: string;
  /** Height in Tailwind rem units — default 28px (`h-7`). */
  heightClassName?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function BrandLogo({
  href = "/",
  priority = false,
  className = "",
  heightClassName = "h-7",
  onClick,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center ${className}`.trim()}
      aria-label="RoamVantage home"
    >
      <Image
        src="/roamvantage-text.png"
        alt="RoamVantage"
        width={214}
        height={28}
        priority={priority}
        className={`${heightClassName} w-auto`}
      />
    </Link>
  );
}
