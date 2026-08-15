"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type DashboardNavLinkProps = {
  children: React.ReactNode;
  className: string;
  activeClassName: string;
  href: string;
  exact?: boolean;
};

export function DashboardNavLink({
  activeClassName,
  children,
  className,
  exact = false,
  href,
}: DashboardNavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const classes = isActive ? `${className} ${activeClassName}` : className;

  return (
    <Link href={href} className={classes} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  );
}
