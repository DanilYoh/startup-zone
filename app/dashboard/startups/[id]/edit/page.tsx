import { LinkButton } from "@/components/link-button";
import { StartupForm } from "@/features/startups/components/startup-form";
import { getOwnedStartupForEdit } from "@/features/startups/server/queries";
import { Paper, Skeleton, Stack, Text, Title } from "@mantine/core";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import styles from "../../../dashboard.module.css";

async function EditStartupContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  if (!/^\d+$/.test(rawId)) notFound();
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const result = await getOwnedStartupForEdit(id);
  if (result.status === "not_found") notFound();

  if (result.status === "forbidden") {
    return (
      <Paper withBorder radius="lg" p="xl" className={styles.formCard}>
        <Stack gap="md" align="flex-start">
          <Title order={1} size="h3">Founder profile required</Title>
          <Text c="dimmed">Only founders can edit startups.</Text>
          <LinkButton href="/dashboard" variant="outline">Back to dashboard</LinkButton>
        </Stack>
      </Paper>
    );
  }

  return (
    <div className={styles.formPage}>
      <LinkButton href="/dashboard" variant="subtle" className={styles.fitWidth}>
        Back to dashboard
      </LinkButton>
      <StartupForm startup={result.startup} />
    </div>
  );
}

export default function EditStartupPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Skeleton height="44rem" radius="lg" className={styles.formSkeleton} />}>
      <EditStartupContent params={params} />
    </Suspense>
  );
}
