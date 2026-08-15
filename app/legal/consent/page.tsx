import { LegalDocument } from "@/features/legal/components/legal-document";
import { getPublicLegalConfig } from "@/features/legal/server/config";
import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Согласие на обработку персональных данных" };

async function ConsentContent() {
  await connection();
  return <LegalDocument config={getPublicLegalConfig()} kind="consent" />;
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<Skeleton className={styles.documentSkeleton} height="36rem" radius="md" />}>
      <ConsentContent />
    </Suspense>
  );
}
