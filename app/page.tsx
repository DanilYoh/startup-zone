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
import styles from "./page.module.css";

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
  "CSS Modules",
] as const;

function Brand() {
  return (
    <Link
      href="/"
      className={styles.brand}
      aria-label="Startup Zone home"
    >
      <span className={styles.brandMark}>
        SZ
      </span>
      <span>Startup Zone</span>
    </Link>
  );
}

async function FeaturedStartup() {
  const result = await listActiveStartups({ page: 1 });

  if (result.status !== "ready" || result.data.items.length === 0) {
    return (
      <div className={styles.featuredFrame}>
        <div className={styles.featuredCard}>
          <p className={styles.eyebrow}>Live marketplace</p>
          <h2 className={styles.featuredTitle}>
            {result.status === "ready" ? "Publish the first startup" : "Marketplace unavailable"}
          </h2>
          <p className={styles.featuredDescription}>
            {result.status === "ready"
              ? "Create a founder account and publish a project to make it visible to specialists and investors."
              : "The marketplace data could not be loaded. Try the startup directory again in a moment."}
          </p>
          <LinkButton
            href={result.status === "ready" ? "/auth/sign-up" : "/startups"}
            variant="outline"
            className={styles.featuredCta}
          >
            {result.status === "ready" ? "Create founder account" : "Open directory"}
          </LinkButton>
        </div>
      </div>
    );
  }

  const startup = result.data.items[0];

  return (
    <div className={styles.featuredFrame}>
      <div className={styles.featuredCard}>
        <div className={styles.featuredHeader}>
          <div>
            <p className={styles.eyebrow}>Featured live project</p>
            <h2 className={styles.featuredTitle}>{startup.title}</h2>
          </div>
          <Badge variant="light">{startupStageLabels[startup.stage]}</Badge>
        </div>
        <p className={styles.featuredDescription}>{startup.one_pager}</p>
        <div className={styles.tagList}>
          {startup.niche.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className={styles.featuredFooter}>
          <div>
            <p className={styles.metaLabel}>Founder</p>
            <p className={styles.founderName}>
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
    <div className={styles.home}>
      <a
        href="#main-content"
        className={styles.skipLink}
      >
        Skip to content
      </a>

      <header className={styles.header}>
        <nav
          className={styles.nav}
          aria-label="Primary navigation"
        >
          <Brand />
          <div className={styles.desktopNav}>
            <Link className={styles.navLink} href="/startups">
              Startups
            </Link>
            <a className={styles.navLink} href="#product">
              Product
            </a>
            <a className={styles.navLink} href="#architecture">
              Architecture
            </a>
            <a className={styles.navLink} href="#about">
              About
            </a>
          </div>
          <div className={styles.navActions}>
            <ThemeSwitcher />
            {!hasEnvVars ? (
              <div className={styles.envWarning}>
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
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroGrid}>
            <div>
              <div className={styles.liveBadge}>
                <CheckCircle2 className={styles.successIcon} aria-hidden="true" />
                Live end-to-end marketplace demo
              </div>
              <h1 className={styles.heroTitle}>
                Find the right people to move a startup forward.
              </h1>
              <p className={styles.heroDescription}>
                Founders publish real projects, specialists apply to join teams, and early-stage
                investors send focused interest requests. Create an account to try the complete
                role-aware workflow.
              </p>
              <div className={styles.heroActions}>
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

        <section id="product" className={styles.section}>
          <div className={styles.sectionIntro}>
            <p className={styles.sectionKicker}>
              Product thinking
            </p>
            <h2 className={styles.sectionTitle}>
              A focused marketplace MVP you can use end to end.
            </h2>
            <p className={styles.sectionDescription}>
              The public demo uses isolated synthetic data and exposes the same validated,
              role-aware flows covered by the automated test suite: onboarding, profiles, startup
              management, discovery, applications, and founder moderation.
            </p>
          </div>
          <div className={styles.capabilityGrid}>
            {capabilities.map(({ icon: Icon, title, description }) => (
              <article key={title} className={styles.capabilityCard}>
                <span className={styles.capabilityIconBox}>
                  <Icon className={styles.icon} aria-hidden="true" />
                </span>
                <h3 className={styles.capabilityTitle}>{title}</h3>
                <p className={styles.capabilityDescription}>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="architecture" className={styles.architectureSection}>
          <div className={styles.architectureGrid}>
            <div>
              <div className={styles.architectureKicker}>
                <Code2 className={styles.icon} aria-hidden="true" />
                <p>Engineering decisions</p>
              </div>
              <h2 className={styles.architectureTitle}>
                Modern React, with the backend discipline to ship.
              </h2>
              <p className={styles.architectureDescription}>
                Server-first rendering keeps the client lean. PostgreSQL constraints and RLS keep
                authorization close to the data. Automated checks make every change reviewable.
              </p>
              <div className={styles.technologyList}>
                {stack.map((technology) => (
                  <span key={technology} className={styles.technologyTag}>
                    {technology}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.architectureFlow}>
              <div className={styles.flowStep}>
                <Code2 className={styles.flowIcon} aria-hidden="true" />
                <span>Next.js App Router + React Server Components</span>
              </div>
              <div className={styles.flowConnector} aria-hidden="true" />
              <div className={styles.flowStep}>
                <ShieldCheck className={styles.flowIcon} aria-hidden="true" />
                <span>Server Actions + Zod validation + Supabase Auth</span>
              </div>
              <div className={styles.flowConnector} aria-hidden="true" />
              <div className={styles.flowStep}>
                <Database className={styles.flowIcon} aria-hidden="true" />
                <span>PostgreSQL + migrations + row-level security</span>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className={styles.aboutSection}>
          <div className={styles.aboutCard}>
            <p className={styles.aboutKicker}>Open source</p>
            <div className={styles.aboutContent}>
              <div className={styles.aboutCopy}>
                <h2 className={styles.aboutTitle}>
                  Review the decisions, not just the screenshots.
                </h2>
                <p className={styles.aboutDescription}>
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

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>Startup Zone · A working marketplace MVP.</p>
          <a
            className={styles.footerLink}
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
