import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link href="/" className="font-semibold tracking-tight">
            Startup Zone
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Suspense fallback={<div className="h-9 w-28 animate-pulse rounded-md bg-muted" />}>
              <AuthButton />
            </Suspense>
          </div>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-5 py-12">{children}</main>
    </div>
  );
}
