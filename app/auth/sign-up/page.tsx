import { SignUpForm } from "@/features/auth/components/sign-up-form";
import Link from "next/link";
import styles from "../auth-layout.module.css";

export default function Page() {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.brand} aria-label="Startup Zone home">
        <span className={styles.brandMark}>SZ</span>
        <span>Startup Zone</span>
      </Link>
      <div className={styles.wide}>
        <SignUpForm />
      </div>
    </div>
  );
}
