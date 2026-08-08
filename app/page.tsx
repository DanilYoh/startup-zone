import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { hasEnvVars } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Database,
  Rocket,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const capabilities = [
  {
    icon: Users,
    title: "Marketplace domain foundation",
    description:
      "The data model and role boundaries cover founders, investors, specialists, and startup ownership.",
  },
  {
    icon: ShieldCheck,
    title: "Security designed into the model",
    description:
      "Supabase sessions, schema validation, database migrations, and row-level security define the authorization boundary.",
  },
  {
    icon: Rocket,
    title: "A reviewable product slice",
    description:
      "The public repository implements the product shell and startup-creation slice with typed actions and automated checks.",
  },
] as const;

const stack = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Supabase",
  "PostgreSQL",
  "Zod",
  "Tailwind CSS",
] as const;

function Brand() {
  return (
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
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <nav
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"
          aria-label="Primary navigation"
        >
          <Brand />
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#product">
              Product
            </a>
            <a className="transition-colors hover:text-foreground" href="#architecture">
              Architecture
            </a>
            <a className="transition-colors hover:text-foreground" href="#about">
              About
            </a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {!hasEnvVars ? (
              <div className="hidden sm:block">
                <EnvVarWarning />
              </div>
            ) : (
              <Suspense fallback={<div className="h-9 w-28 animate-pulse rounded-md bg-muted" />}>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_38%)]" />
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
                <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                Product foundation · current scope
              </div>
              <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
                Find the right people to move a startup forward.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
                Startup Zone explores how founders, specialists, and early-stage investors could
                collaborate in one focused workspace. This demo presents the implemented product
                shell and architecture, not a finished marketplace.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={hasEnvVars ? "/auth/sign-up" : "#architecture"}>
                    {hasEnvVars ? "Create an account" : "Explore the architecture"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="https://github.com/DanilYoh/startup-zone" target="_blank" rel="noreferrer">
                    View source on GitHub
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-3 shadow-2xl shadow-foreground/5">
              <div className="rounded-2xl border bg-background p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Featured opportunity</p>
                    <h2 className="mt-1 text-xl font-semibold">Climate analytics for logistics</h2>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    MVP
                  </span>
                </div>
                <p className="mt-5 leading-7 text-muted-foreground">
                  A decision-support platform helping operations teams reduce emissions and cost
                  across complex delivery networks.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['ClimateTech', 'B2B SaaS', 'Data'].map((tag) => (
                    <span key={tag} className="rounded-full border px-3 py-1 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4 border-t pt-5">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Looking for</p>
                    <p className="mt-1 font-medium">Product engineer</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Funding stage</p>
                    <p className="mt-1 font-medium">Pre-seed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Product thinking
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A marketplace foundation, not a finished product.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Today the repository covers the secure domain foundation and startup-creation slice.
              Directory, discovery, applications, and investor workflows remain planned product work.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
                <span className="grid size-10 place-items-center rounded-xl bg-muted">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="architecture" className="border-y bg-muted/40">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <Code2 className="size-5" aria-hidden="true" />
                <p className="font-medium">Engineering decisions</p>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Modern React, with the backend discipline to ship.
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Server-first rendering keeps the client lean. PostgreSQL constraints and RLS keep
                authorization close to the data. Automated checks make every change reviewable.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {stack.map((technology) => (
                  <span key={technology} className="rounded-lg border bg-background px-3 py-2 text-sm">
                    {technology}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border bg-background p-5 font-mono text-sm shadow-sm">
              <div className="flex items-center gap-3 rounded-xl bg-muted/70 p-4">
                <Code2 className="size-5 shrink-0" aria-hidden="true" />
                <span>Next.js App Router + React Server Components</span>
              </div>
              <div className="ml-5 h-5 border-l" aria-hidden="true" />
              <div className="flex items-center gap-3 rounded-xl bg-muted/70 p-4">
                <ShieldCheck className="size-5 shrink-0" aria-hidden="true" />
                <span>Server Actions + Zod validation + Supabase Auth</span>
              </div>
              <div className="ml-5 h-5 border-l" aria-hidden="true" />
              <div className="flex items-center gap-3 rounded-xl bg-muted/70 p-4">
                <Database className="size-5 shrink-0" aria-hidden="true" />
                <span>PostgreSQL + migrations + row-level security</span>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-6xl px-5 py-20">
          <div className="rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-12">
            <p className="text-sm font-medium uppercase tracking-[0.2em] opacity-70">Open source</p>
            <div className="mt-3 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Review the decisions, not just the screenshots.
                </h2>
                <p className="mt-4 text-lg leading-8 opacity-75">
                  The repository includes local setup, database migrations, quality gates, and an
                  architecture overview for an honest technical review.
                </p>
              </div>
              <Button asChild size="lg" variant="secondary">
                <a href="https://github.com/DanilYoh/startup-zone" target="_blank" rel="noreferrer">
                  Open repository
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Startup Zone · A production-minded marketplace foundation.</p>
          <a
            className="transition-colors hover:text-foreground"
            href="https://github.com/DanilYoh"
            target="_blank"
            rel="noreferrer"
          >
            GitHub · DanilYoh
          </a>
        </div>
      </footer>
    </div>
  );
}
