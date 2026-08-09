import { LegalDocument } from "@/features/legal/components/legal-document";
import { getPublicLegalConfig } from "@/features/legal/server/config";
import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Политика обработки персональных данных" };

async function PrivacyContent() {
  await connection();
  return <LegalDocument config={getPublicLegalConfig()} kind="privacy" />;
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<Skeleton height="42rem" radius="lg" />}>
      <PrivacyContent />
    </Suspense>
  );
}
