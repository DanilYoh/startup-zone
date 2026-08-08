import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Group, Skeleton } from "@mantine/core";
import Link from "next/link";
import { Suspense } from "react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <Group gap="lg">
            <Link href="/" className="font-semibold tracking-tight">
              Startup Zone
            </Link>
            <Group gap="md" className="hidden sm:flex">
              <Link href="/protected" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                Dashboard
              </Link>
              <Link href="/dashboard/profile" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                Profile
              </Link>
              <Link href="/dashboard/applications" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                Applications
              </Link>
              <Link href="/dashboard/applications/inbox" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                Incoming
              </Link>
            </Group>
          </Group>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Suspense fallback={<Skeleton height={36} width={112} radius="md" />}>
              <AuthButton />
            </Suspense>
          </div>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-5 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
