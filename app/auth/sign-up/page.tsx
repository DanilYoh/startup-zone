import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { getPublicLegalConfig } from "@/features/legal/server/config";
import { Skeleton } from "@mantine/core";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import styles from "../auth-layout.module.css";

async function SignUpContent() {
  await connection();
  return <SignUpForm legalConfig={getPublicLegalConfig()} />;
}

export default function Page() {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.brand} aria-label="Главная Startup Zone">
        <span className={styles.brandMark}>SZ</span>
        <span>Startup Zone</span>
      </Link>
      <div className={styles.wide}>
        <Suspense fallback={<Skeleton height="44rem" radius="lg" />}>
          <SignUpContent />
        </Suspense>
      </div>
    </div>
  );
}
