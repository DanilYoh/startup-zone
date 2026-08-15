import { ThemeSwitcher } from "@/components/theme-switcher";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import styles from "./auth-layout.module.css";

type AuthShellProps = {
  children: React.ReactNode;
  size?: "narrow" | "wide";
};

function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Главная Startup Zone">
      <span className={styles.brandMark}>SZ</span>
      <span>Startup Zone</span>
    </Link>
  );
}

export function AuthShell({ children, size = "narrow" }: AuthShellProps) {
  return (
    <main className={styles.page}>
      <aside className={styles.story} aria-label="О Startup Zone">
        <div className={styles.storyGrid} aria-hidden="true" />
        <header className={styles.storyHeader}>
          <Brand />
          <ThemeSwitcher />
        </header>

        <div className={styles.storyContent}>
          <span className={styles.betaBadge}>
            <span className={styles.betaDot} aria-hidden="true" />
            Закрытая бета
          </span>
          <h2 className={styles.storyTitle}>Доступ к сделкам без информационного шума.</h2>
          <p className={styles.storyText}>
            Профили, стартапы и интро — в одном защищённом рабочем пространстве.
          </p>

          <div className={styles.flow} aria-label="Путь к знакомству">
            <div className={styles.flowStep}>
              <span>01</span>
              <strong>Профиль</strong>
              <small>Зафиксируйте роль и интересы</small>
            </div>
            <div className={styles.flowStep}>
              <span>02</span>
              <strong>Проект</strong>
              <small>Найдите точное совпадение</small>
            </div>
            <div className={styles.flowStep}>
              <span>03</span>
              <strong>Контакт</strong>
              <small>Начните предметный разговор</small>
            </div>
          </div>

          <div className={styles.privacyNote}>
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Контакты открываются только после принятой заявки.</span>
          </div>
        </div>
      </aside>

      <section className={styles.formPanel}>
        <header className={styles.mobileHeader}>
          <Brand />
          <span className={styles.mobileTheme}>
            <ThemeSwitcher />
          </span>
        </header>

        <div className={`${styles.formContainer} ${styles[size]}`}>{children}</div>

        <footer className={styles.formFooter}>
          <span>Startup Zone</span>
          <span aria-hidden="true">·</span>
          <Link href="/legal/privacy">Политика</Link>
          <Link href="/legal/consent">Согласие</Link>
        </footer>
      </section>
    </main>
  );
}
