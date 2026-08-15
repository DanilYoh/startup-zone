import { DashboardNavLink } from "@/components/dashboard-nav-link";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ArrowUpRight, LayoutDashboard, Rocket, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import styles from "./dashboard-shell.module.css";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.topbar}>
          <Link href="/" className={styles.brand} aria-label="Главная Startup Zone">
            <span className={styles.brandMark}>SZ</span>
            <span>Startup Zone</span>
          </Link>
          <div className={styles.projectContext}>
            <span className={styles.divider} aria-hidden="true" />
            <span className={styles.environmentDot} aria-hidden="true" />
            <span>Личный кабинет</span>
          </div>
          <div className={styles.actions}>
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <nav aria-label="Навигация по личному кабинету" className={styles.sideNav}>
            <p className={styles.navLabel}>Рабочая область</p>
            <DashboardNavLink
              href="/dashboard"
              exact
              className={styles.navLink}
              activeClassName={styles.navLinkActive}
            >
              <LayoutDashboard size={16} aria-hidden="true" /> Обзор
            </DashboardNavLink>
            <p className={styles.navLabel}>Площадка</p>
            <DashboardNavLink
              href="/startups"
              className={styles.navLink}
              activeClassName={styles.navLinkActive}
            >
              <Rocket size={16} aria-hidden="true" /> Каталог стартапов
            </DashboardNavLink>
            <p className={styles.navLabel}>Аккаунт</p>
            <DashboardNavLink
              href="/dashboard/profile"
              className={styles.navLink}
              activeClassName={styles.navLinkActive}
            >
              <UserRound size={16} aria-hidden="true" /> Профиль
            </DashboardNavLink>
            <DashboardNavLink
              href="/dashboard/account"
              className={styles.navLink}
              activeClassName={styles.navLinkActive}
            >
              <ShieldCheck size={16} aria-hidden="true" /> Данные аккаунта
            </DashboardNavLink>
          </nav>
          <Link href="/" className={styles.backLink}>
            Публичный сайт <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
