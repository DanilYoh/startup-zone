import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import styles from "./legal.module.css";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Навигация по документам">
          <Link href="/" className={styles.brand} aria-label="Главная Startup Zone">
            <span className={styles.brandMark}>SZ</span>
            <span>Startup Zone</span>
          </Link>
          <div className={styles.links}>
            <div className={styles.documentNav}>
              <Link className={styles.documentLink} href="/legal/privacy">Политика</Link>
              <Link className={styles.documentLink} href="/legal/consent">Согласие</Link>
            </div>
            <span className={styles.themeControl}>
              <ThemeSwitcher />
            </span>
          </div>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerMeta}>
            <span className={styles.footerDot} aria-hidden="true" />
            Startup Zone · Документы об обработке персональных данных.
          </span>
        </div>
      </footer>
    </div>
  );
}
