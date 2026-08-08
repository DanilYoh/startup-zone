import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { Skeleton } from "@mantine/core";
import Link from "next/link";
import { Suspense } from "react";

export default function StartupsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{
          background: "color-mix(in srgb, var(--mantine-color-body) 92%, transparent)",
        }}
      >
        <nav
          aria-label="Marketplace navigation"
          className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5"
        >
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight"
              aria-label="Startup Zone home"
            >
              <span className="grid size-8 place-items-center rounded-xl bg-primary text-sm text-primary-foreground">
                SZ
              </span>
              <span>Startup Zone</span>
            </Link>
            <Link
              href="/startups"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Discover startups
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense fallback={<Skeleton height={36} width={112} radius="md" />}>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Startup Zone · Real projects published by founders.</p>
          <Link className="transition-colors hover:text-foreground" href="/">
            About the product
          </Link>
        </div>
      </footer>
    </div>
  );
}
