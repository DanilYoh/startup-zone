import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { Skeleton } from "@mantine/core";
import Link from "next/link";
import { Suspense } from "react";
import styles from "./startups-supabase.module.css";

export default function StartupsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <nav
          aria-label="Marketplace navigation"
          className={styles.nav}
        >
          <div className={styles.navStart}>
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
            <Link
              href="/startups"
              className={styles.directoryLink}
            >
              Discover startups
            </Link>
          </div>
          <div className={styles.navActions}>
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

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>Startup Zone · Real founder projects for aligned investors.</p>
          <Link className={styles.footerLink} href="/">
            About the product
          </Link>
        </div>
      </footer>
    </div>
  );
}
