import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { Skeleton } from "@mantine/core";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import styles from "./startups-supabase.module.css";

export default function StartupsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <nav
          aria-label="Навигация по площадке"
          className={styles.nav}
        >
          <div className={styles.navStart}>
            <Link
              href="/"
              className={styles.brand}
              aria-label="Главная Startup Zone"
            >
              <span className={styles.brandMark}>
                SZ
              </span>
              <span>Startup Zone</span>
            </Link>
            <Link
              href="/startups"
              className={styles.directoryLink}
              aria-current="page"
            >
              <LayoutGrid size={14} aria-hidden="true" />
              Каталог стартапов
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
          <p>Startup Zone · Структурированные проекты для предметных решений.</p>
          <div className={styles.footerLinks}>
            <Link className={styles.footerLink} href="/">О продукте</Link>
            <Link className={styles.footerLink} href="/legal/privacy">
              Политика обработки данных
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
