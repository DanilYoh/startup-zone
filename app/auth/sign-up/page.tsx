import { AuthShell } from "@/app/auth/auth-shell";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { getPublicLegalConfig } from "@/features/legal/server/config";
import { Skeleton } from "@mantine/core";
import { connection } from "next/server";
import { Suspense } from "react";

async function SignUpContent() {
  await connection();
  return <SignUpForm legalConfig={getPublicLegalConfig()} />;
}

export default function Page() {
  return (
    <AuthShell size="wide">
      <Suspense fallback={<Skeleton height="44rem" radius="md" />}>
        <SignUpContent />
      </Suspense>
    </AuthShell>
  );
}
