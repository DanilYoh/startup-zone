import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { LinkButton } from "@/components/link-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { listActiveStartups } from "@/lib/supabase/startups";
import { hasEnvVars } from "@/lib/utils";
import { startupStageLabels } from "@/lib/validations";
import { Badge, Button, Skeleton } from "@mantine/core";
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
    title: "Role-aware onboarding",
    description:
      "Join as a founder, specialist, or investor, then maintain a profile built for marketplace collaboration.",
  },
  {
    icon: Rocket,
    title: "Persisted startup management",
    description:
      "Founders publish, edit, deactivate, and republish real projects that immediately appear in public discovery.",
  },
  {
    icon: ShieldCheck,
    title: "Applications and decisions",
    description:
      "Specialists and investors contact founders, track status, and receive database-enforced terminal decisions.",
  },
] as const;

const stack = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Supabase",
  "PostgreSQL",
  "Zod",
  "Mantine UI",
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

async function FeaturedStartup() {
  const result = await listActiveStartups({});

  if (result.status !== "ready" || result.data.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-3 shadow-2xl">
        <div className="rounded-2xl border bg-background p-6">
          <p className="text-sm text-muted-foreground">Live marketplace</p>
          <h2 className="mt-1 text-xl font-semibold">
            {result.status === "ready" ? "Publish the first startup" : "Marketplace unavailable"}
          </h2>
          <p className="mt-5 leading-7 text-muted-foreground">
            {result.status === "ready"
              ? "Create a founder account and publish a project to make it visible to specialists and investors."
              : "The marketplace data could not be loaded. Try the startup directory again in a moment."}
          </p>
          <LinkButton
            href={result.status === "ready" ? "/auth/sign-up" : "/startups"}
            variant="outline"
            className="mt-6"
          >
            {result.status === "ready" ? "Create founder account" : "Open directory"}
          </LinkButton>
        </div>
      </div>
    );
  }

  const startup = result.data[0];

  return (
    <div className="rounded-3xl border bg-card p-3 shadow-2xl">
      <div className="rounded-2xl border bg-background p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Featured live project</p>
            <h2 className="mt-1 text-xl font-semibold">{startup.title}</h2>
          </div>
          <Badge variant="light">{startupStageLabels[startup.stage]}</Badge>
        </div>
        <p className="mt-5 leading-7 text-muted-foreground">{startup.one_pager}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {startup.niche.map((tag) => (
            <span key={tag} className="rounded-full border px-3 py-1 text-xs">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between gap-4 border-t pt-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Founder</p>
            <p className="mt-1 font-medium">
              {startup.founder?.full_name ?? "Startup Zone founder"}
            </p>
          </div>
          <LinkButton href={`/startups/${startup.slug}`} variant="subtle">
            View project
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

function FeaturedStartupSkeleton() {
  return <Skeleton height={336} radius="xl" aria-label="Loading featured startup" />;
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

      <header
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{
          background: "color-mix(in srgb, var(--mantine-color-body) 90%, transparent)",
        }}
      >
        <nav
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"
          aria-label="Primary navigation"
        >
          <Brand />
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link className="transition-colors hover:text-foreground" href="/startups">
              Startups
            </Link>
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
              <Suspense fallback={<Skeleton height={36} width={112} radius="md" />}>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className="relative overflow-hidden border-b">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(circle at top left, color-mix(in srgb, var(--mantine-primary-color-filled) 10%, transparent), transparent 38%)",
            }}
          />
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
                <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                Live end-to-end marketplace demo
              </div>
              <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
                Find the right people to move a startup forward.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
                Founders publish real projects, specialists apply to join teams, and early-stage
                investors send focused interest requests. Create an account to try the complete
                role-aware workflow.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LinkButton
                  href="/startups"
                  size="lg"
                  rightSection={<ArrowRight size={16} aria-hidden="true" />}
                >
                  Discover startups
                </LinkButton>
                {hasEnvVars ? (
                  <LinkButton href="/auth/sign-up" size="lg" variant="outline">
                    Create an account
                  </LinkButton>
                ) : (
                  <Button
                    component="a"
                    href="https://github.com/DanilYoh/startup-zone"
                    target="_blank"
                    rel="noreferrer"
                    size="lg"
                    variant="outline"
                  >
                    View source on GitHub
                  </Button>
                )}
              </div>
            </div>

            <Suspense fallback={<FeaturedStartupSkeleton />}>
              <FeaturedStartup />
            </Suspense>
          </div>
        </section>

        <section id="product" className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Product thinking
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A focused marketplace MVP you can use end to end.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              The public demo uses isolated synthetic data and exposes the same validated,
              role-aware flows covered by the automated test suite: onboarding, profiles, startup
              management, discovery, applications, and founder moderation.
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

        <section id="architecture" className="border-y bg-muted">
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
              <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                <Code2 className="size-5 shrink-0" aria-hidden="true" />
                <span>Next.js App Router + React Server Components</span>
              </div>
              <div className="ml-5 h-5 border-l" aria-hidden="true" />
              <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                <ShieldCheck className="size-5 shrink-0" aria-hidden="true" />
                <span>Server Actions + Zod validation + Supabase Auth</span>
              </div>
              <div className="ml-5 h-5 border-l" aria-hidden="true" />
              <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
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
              <Button
                component="a"
                href="https://github.com/DanilYoh/startup-zone"
                target="_blank"
                rel="noreferrer"
                size="lg"
                variant="white"
                rightSection={<ArrowRight size={16} aria-hidden="true" />}
              >
                Open repository
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Startup Zone · A working marketplace MVP.</p>
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
