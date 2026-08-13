import { Group, Text } from "@mantine/core";
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
          <Group className={styles.links} wrap="nowrap">
            <Link className={styles.documentLink} href="/legal/privacy">Политика</Link>
            <Link className={styles.documentLink} href="/legal/consent">Согласие</Link>
          </Group>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <Text size="sm" c="dimmed">Startup Zone · Документы об обработке персональных данных.</Text>
      </footer>
    </div>
  );
}
