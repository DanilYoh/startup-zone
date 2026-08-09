import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Group, Skeleton } from "@mantine/core";
import Link from "next/link";
import { Suspense } from "react";
import styles from "./dashboard-shell.module.css";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Group gap="lg">
            <Link href="/" className={styles.brand}>
              Startup Zone
            </Link>
            <Group gap="md" className={styles.desktopLinks}>
              <Link href="/dashboard" className={styles.navLink}>
                Dashboard
              </Link>
              <Link href="/dashboard/profile" className={styles.navLink}>
                Profile
              </Link>
              <Link href="/dashboard/applications" className={styles.navLink}>
                Applications
              </Link>
              <Link href="/dashboard/applications/inbox" className={styles.navLink}>
                Incoming
              </Link>
            </Group>
          </Group>
          <div className={styles.actions}>
            <ThemeSwitcher />
            <Suspense fallback={<Skeleton height={36} width={112} radius="md" />}>
              <AuthButton />
            </Suspense>
          </div>
          <div
            aria-label="Dashboard sections"
            className={styles.mobileLinks}
          >
            <Link href="/dashboard" className={`${styles.navLink} ${styles.mobileLink}`}>
              Dashboard
            </Link>
            <Link href="/dashboard/profile" className={`${styles.navLink} ${styles.mobileLink}`}>
              Profile
            </Link>
            <Link href="/dashboard/applications" className={`${styles.navLink} ${styles.mobileLink}`}>
              Applications
            </Link>
            <Link href="/dashboard/applications/inbox" className={`${styles.navLink} ${styles.mobileLink}`}>
              Incoming
            </Link>
          </div>
        </nav>
      </header>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
