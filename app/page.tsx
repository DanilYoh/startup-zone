import { AuthButton } from "@/components/auth-button";
import { LinkButton } from "@/components/link-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button, Skeleton } from "@mantine/core";
import {
  ArrowRight,
  Building2,
  Check,
  Compass,
  Landmark,
  LockKeyhole,
  Radar,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import styles from "./home-supabase.module.css";

const founderFields = [
  "Identity and professional headline",
  "Founder experience and domain credibility",
  "Published startup, traction, and funding ask",
  "Location and trusted professional links",
] as const;

const investorFields = [
  "Identity, fund, or investment organization",
  "A clear investment thesis",
  "Preferred startup stages",
  "Typical ticket range and trusted links",
] as const;

const workflow = [
  {
    number: "01",
    title: "Founders publish the signal",
    description:
      "A structured startup page turns the story, stage, market, and funding intent into comparable information.",
  },
  {
    number: "02",
    title: "Investors qualify the fit",
    description:
      "Discovery filters and a role-specific profile make relevance visible before anyone starts a conversation.",
  },
  {
    number: "03",
    title: "Both sides decide deliberately",
    description:
      "Interest requests are persisted, founder-owned, and resolved through explicit database-enforced decisions.",
  },
] as const;

function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Startup Zone home">
      <span className={styles.brandMark}>SZ</span>
      <span>Startup Zone</span>
    </Link>
  );
}

function ProfileFields({ fields }: { fields: readonly string[] }) {
  return (
    <ul className={styles.profileFields}>
      {fields.map((field) => (
        <li key={field}>
          <Check size={15} aria-hidden="true" />
          <span>{field}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <div className={styles.home}>
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Primary navigation">
          <Brand />
          <div className={styles.desktopNav}>
            <a href="#roles">For whom</a>
            <a href="#workflow">How it works</a>
            <Link href="/startups">Startups</Link>
            <a href="#trust">Trust</a>
          </div>
          <div className={styles.navActions}>
            <ThemeSwitcher />
            <Suspense fallback={<Skeleton height={36} width={124} radius="xl" />}>
              <AuthButton />
            </Suspense>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroNoise} aria-hidden="true" />
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>
                <Sparkles size={15} aria-hidden="true" />
                A focused founder–investor marketplace
              </div>
              <h1>
                Where ambitious founders meet <span>aligned capital.</span>
              </h1>
              <p className={styles.heroDescription}>
                Startup Zone replaces noisy networking with two clear profiles, structured startup
                data, and a direct path from discovery to a qualified investment conversation.
              </p>
              <div className={styles.heroActions}>
                <LinkButton
                  href="/startups"
                  size="lg"
                  rightSection={<ArrowRight size={17} aria-hidden="true" />}
                >
                  Explore startups
                </LinkButton>
                <LinkButton href="/auth/sign-up" size="lg" variant="outline">
                  Create a profile
                </LinkButton>
              </div>
              <div className={styles.proofRow} aria-label="Product scope">
                <div><strong>2</strong><span>purpose-built roles</span></div>
                <div><strong>1</strong><span>decision workflow</span></div>
                <div><strong>RLS</strong><span>at the data boundary</span></div>
              </div>
            </div>

            <div className={styles.signalBoard} aria-label="Founder and investor profile match">
              <div className={`${styles.signalCard} ${styles.founderSignal}`}>
                <div className={styles.signalHeader}>
                  <span className={styles.signalIcon}><Building2 size={20} aria-hidden="true" /></span>
                  <span className={styles.signalStatus}>Publishing</span>
                </div>
                <p className={styles.signalKicker}>Founder signal</p>
                <h2>Make the opportunity legible.</h2>
                <div className={styles.signalLines}>
                  <span style={{ "--line-width": "92%" } as React.CSSProperties} />
                  <span style={{ "--line-width": "68%" } as React.CSSProperties} />
                  <span style={{ "--line-width": "81%" } as React.CSSProperties} />
                </div>
                <div className={styles.signalTags}><span>Stage</span><span>Traction</span><span>Ask</span></div>
              </div>

              <div className={styles.matchRail} aria-hidden="true">
                <span />
                <div><Radar size={18} /></div>
                <span />
              </div>

              <div className={`${styles.signalCard} ${styles.investorSignal}`}>
                <div className={styles.signalHeader}>
                  <span className={styles.signalIcon}><Landmark size={20} aria-hidden="true" /></span>
                  <span className={styles.signalStatus}>Qualifying</span>
                </div>
                <p className={styles.signalKicker}>Investor fit</p>
                <h2>Invest where you have conviction.</h2>
                <div className={styles.fitGrid}>
                  <div><span>Thesis</span><strong>Aligned</strong></div>
                  <div><span>Stage</span><strong>Seed</strong></div>
                  <div><span>Ticket</span><strong>In range</strong></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className={styles.rolesSection}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionKicker}>One marketplace, two intentional identities</p>
            <h2>Profiles should help the other side make a decision.</h2>
            <p>
              Generic social profiles create noise. Startup Zone asks each role for the information
              that establishes credibility and qualifies fit.
            </p>
          </div>

          <div className={styles.roleGrid}>
            <article className={`${styles.roleCard} ${styles.founderCard}`}>
              <div className={styles.roleCardTop}>
                <span className={styles.roleNumber}>01</span>
                <Building2 size={30} aria-hidden="true" />
              </div>
              <p className={styles.roleType}>Founder profile</p>
              <h3>Credibility around the person. Evidence around the startup.</h3>
              <p className={styles.roleDescription}>
                A founder profile stays concise because product, market, stage, links, and funding
                belong to the persisted startup page.
              </p>
              <ProfileFields fields={founderFields} />
              <LinkButton href="/auth/sign-up" variant="subtle" px={0} rightSection={<ArrowRight size={15} />}>
                Join as a founder
              </LinkButton>
            </article>

            <article className={`${styles.roleCard} ${styles.investorCard}`}>
              <div className={styles.roleCardTop}>
                <span className={styles.roleNumber}>02</span>
                <Landmark size={30} aria-hidden="true" />
              </div>
              <p className={styles.roleType}>Investor profile</p>
              <h3>A visible mandate, so founders can qualify you too.</h3>
              <p className={styles.roleDescription}>
                An investor profile makes focus and decision range explicit instead of hiding them
                behind a generic biography.
              </p>
              <ProfileFields fields={investorFields} />
              <LinkButton href="/auth/sign-up" variant="subtle" px={0} rightSection={<ArrowRight size={15} />}>
                Join as an investor
              </LinkButton>
            </article>
          </div>
        </section>

        <section id="workflow" className={styles.workflowSection}>
          <div className={styles.workflowInner}>
            <div className={styles.workflowIntro}>
              <p className={styles.sectionKicker}>From signal to conversation</p>
              <h2>Less browsing. Better qualification.</h2>
              <p>
                Every step is reachable in the product and backed by real persisted data—not a set
                of decorative demo cards.
              </p>
              <LinkButton href="/startups" variant="outline">Open the live directory</LinkButton>
            </div>
            <div className={styles.workflowList}>
              {workflow.map((step) => (
                <article key={step.number} className={styles.workflowStep}>
                  <span>{step.number}</span>
                  <div><h3>{step.title}</h3><p>{step.description}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="trust" className={styles.trustSection}>
          <div className={styles.trustCard}>
            <div>
              <p className={styles.sectionKicker}>Trust is a product feature</p>
              <h2>Fast at the edge. Strict at the boundary.</h2>
              <p>
                Public discovery is server-rendered with bounded queries. Sensitive actions verify
                identity on the server and remain independently constrained by PostgreSQL and RLS.
              </p>
            </div>
            <div className={styles.trustGrid}>
              <div><Compass size={22} /><strong>Focused discovery</strong><span>Search, stage, niche, and bounded pagination.</span></div>
              <div><LockKeyhole size={22} /><strong>Role-aware access</strong><span>Ownership and permissions enforced twice.</span></div>
              <div><Sparkles size={22} /><strong>Honest demo states</strong><span>Loading, empty, errors, and real persistence.</span></div>
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div>
            <p className={styles.sectionKicker}>Ready when the fit is real</p>
            <h2>Build the profile that starts a better conversation.</h2>
          </div>
          <div className={styles.finalActions}>
            <LinkButton href="/auth/sign-up" size="lg" rightSection={<ArrowRight size={17} />}>Create profile</LinkButton>
            <Button component="a" href="https://github.com/DanilYoh/startup-zone" target="_blank" rel="noreferrer" size="lg" variant="subtle">
              View source
            </Button>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <Brand />
        <p>Founder–investor marketplace MVP · Built for deliberate decisions.</p>
        <a href="https://github.com/DanilYoh" target="_blank" rel="noreferrer">GitHub · DanilYoh</a>
      </footer>
    </div>
  );
}
