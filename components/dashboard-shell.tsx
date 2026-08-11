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
            <Link href="/dashboard" className={styles.navLink}>
              <LayoutDashboard size={16} aria-hidden="true" /> Обзор
            </Link>
            <p className={styles.navLabel}>Площадка</p>
            <Link href="/startups" className={styles.navLink}>
              <Rocket size={16} aria-hidden="true" /> Каталог стартапов
            </Link>
            <p className={styles.navLabel}>Аккаунт</p>
            <Link href="/dashboard/profile" className={styles.navLink}>
              <UserRound size={16} aria-hidden="true" /> Профиль
            </Link>
            <Link href="/dashboard/account" className={styles.navLink}>
              <ShieldCheck size={16} aria-hidden="true" /> Данные аккаунта
            </Link>
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
