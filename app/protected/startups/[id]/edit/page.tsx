import { LinkButton } from "@/components/link-button";
import { StartupForm } from "@/features/startups/components/startup-form";
import { getOwnedStartupForEdit } from "@/features/startups/server/queries";
import { Paper, Skeleton, Stack, Text, Title } from "@mantine/core";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function EditStartupContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  if (!/^\d+$/.test(rawId)) notFound();
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const result = await getOwnedStartupForEdit(id);
  if (result.status === "not_found") notFound();

  if (result.status === "forbidden") {
    return (
      <Paper withBorder radius="lg" p="xl" className="mx-auto w-full max-w-2xl">
        <Stack gap="md" align="flex-start">
          <Title order={1} size="h3">Founder profile required</Title>
          <Text c="dimmed">Only founders can edit startups.</Text>
          <LinkButton href="/protected" variant="outline">Back to dashboard</LinkButton>
        </Stack>
      </Paper>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      <LinkButton href="/protected" variant="subtle" className="w-fit">
        ← Back to dashboard
      </LinkButton>
      <StartupForm startup={result.startup} />
    </div>
  );
}

export default function EditStartupPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Skeleton height="44rem" radius="lg" className="mx-auto w-full max-w-3xl" />}>
      <EditStartupContent params={params} />
    </Suspense>
  );
}
