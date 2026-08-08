import { LinkButton } from "@/components/link-button";
import { ApplicationForm } from "@/features/applications/components/application-form";
import { getApplicationContext } from "@/features/applications/server/queries";
import { Alert, Badge, Stack, Text, Title } from "@mantine/core";

const statusLabels = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" } as const;

export async function ApplicationPanel({
  startupId,
  founderId,
}: {
  startupId: number;
  founderId: string;
}) {
  const context = await getApplicationContext(startupId, founderId);

  return (
    <Stack gap="md">
      <Title order={2} size="h3">Interested in this project?</Title>
      {context.status === "signed_out" ? (
        <>
          <Text c="dimmed">Sign in with a specialist or investor account to contact the founder.</Text>
          <LinkButton href="/auth/login" className="w-fit">Sign in to respond</LinkButton>
        </>
      ) : context.status === "owner" ? (
        <Text c="dimmed">This is your startup. Applications from other participants appear in your dashboard.</Text>
      ) : context.status === "unsupported_role" ? (
        <Text c="dimmed">Only specialist and investor profiles can respond to startups.</Text>
      ) : context.status === "error" ? (
        <Alert color="red" role="alert">The application form could not be loaded. Refresh and try again.</Alert>
      ) : context.existing ? (
        <Stack gap="xs" align="flex-start">
          <Text c="dimmed">You already sent this {context.existing.type === "team" ? "application" : "interest request"}.</Text>
          <Badge variant="light">{statusLabels[context.existing.status]}</Badge>
          <LinkButton href="/dashboard/applications" variant="subtle" px={0}>View my applications</LinkButton>
        </Stack>
      ) : (
        <ApplicationForm startupId={startupId} role={context.role} />
      )}
    </Stack>
  );
}

