import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ArrowUpRight, LayoutDashboard, Rocket, UserRound } from "lucide-react";
import Link from "next/link";
import styles from "./dashboard-shell.module.css";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.topbar}>
          <Link href="/" className={styles.brand} aria-label="Startup Zone home">
            <span className={styles.brandMark}>SZ</span>
            <span>Startup Zone</span>
          </Link>
          <div className={styles.projectContext}>
            <span className={styles.divider} aria-hidden="true" />
            <span className={styles.environmentDot} aria-hidden="true" />
            <span>Marketplace workspace</span>
          </div>
          <div className={styles.actions}>
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <nav aria-label="Dashboard navigation" className={styles.sideNav}>
            <p className={styles.navLabel}>Workspace</p>
            <Link href="/dashboard" className={styles.navLink}>
              <LayoutDashboard size={16} aria-hidden="true" /> Overview
            </Link>
            <p className={styles.navLabel}>Marketplace</p>
            <Link href="/startups" className={styles.navLink}>
              <Rocket size={16} aria-hidden="true" /> Discover startups
            </Link>
            <p className={styles.navLabel}>Account</p>
            <Link href="/dashboard/profile" className={styles.navLink}>
              <UserRound size={16} aria-hidden="true" /> Profile
            </Link>
          </nav>
          <Link href="/" className={styles.backLink}>
            Public site <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
