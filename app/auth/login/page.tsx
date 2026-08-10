import { LoginForm } from "@/features/auth/components/login-form";
import { isDemoAccessEnabled } from "@/lib/env";
import Link from "next/link";
import styles from "../auth-layout.module.css";

export default function Page() {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.brand} aria-label="Главная Startup Zone">
        <span className={styles.brandMark}>SZ</span>
        <span>Startup Zone</span>
      </Link>
      <div className={styles.narrow}>
        <LoginForm demoAccessEnabled={isDemoAccessEnabled()} />
      </div>
    </div>
  );
}
