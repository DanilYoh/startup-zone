import { LoginForm } from "@/features/auth/components/login-form";
import { isReadOnlyDemoEnabled } from "@/lib/env";
import { getSafeSignInRedirectPath } from "@/lib/routing";
import Link from "next/link";
import styles from "../auth-layout.module.css";

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function Page({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const returnTo = getSafeSignInRedirectPath(typeof next === "string" ? next : null);

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.brand} aria-label="Главная Startup Zone">
        <span className={styles.brandMark}>SZ</span>
        <span>Startup Zone</span>
      </Link>
      <div className={styles.narrow}>
        <LoginForm readOnlyDemoEnabled={isReadOnlyDemoEnabled()} returnTo={returnTo} />
      </div>
    </div>
  );
}
