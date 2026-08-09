import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LayoutDashboard, Rocket, UserRound } from "lucide-react";
import Link from "next/link";
import styles from "./dashboard-shell.module.css";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Dashboard navigation">
          <Link href="/" className={styles.brand} aria-label="Startup Zone home">
            <span className={styles.brandMark}>SZ</span>
            <span>Startup Zone</span>
          </Link>
          <div className={styles.desktopLinks}>
            <Link href="/dashboard" className={styles.navLink}>
              <LayoutDashboard size={16} aria-hidden="true" /> Overview
            </Link>
            <Link href="/dashboard/profile" className={styles.navLink}>
              <UserRound size={16} aria-hidden="true" /> Profile
            </Link>
            <Link href="/startups" className={styles.navLink}>
              <Rocket size={16} aria-hidden="true" /> Marketplace
            </Link>
          </div>
          <div className={styles.actions}>
            <ThemeSwitcher />
            <LogoutButton />
          </div>
          <div aria-label="Dashboard sections" className={styles.mobileLinks}>
            <Link href="/dashboard" className={`${styles.navLink} ${styles.mobileLink}`}>
              <LayoutDashboard size={16} aria-hidden="true" /> Overview
            </Link>
            <Link href="/dashboard/profile" className={`${styles.navLink} ${styles.mobileLink}`}>
              <UserRound size={16} aria-hidden="true" /> Profile
            </Link>
            <Link href="/startups" className={`${styles.navLink} ${styles.mobileLink}`}>
              <Rocket size={16} aria-hidden="true" /> Marketplace
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
