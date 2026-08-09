import { LinkButton } from "@/components/link-button";
import { listMyApplications } from "@/features/applications/server/queries";
import { Alert, Badge, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import styles from "../dashboard.module.css";

const statusLabels = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" } as const;

export default async function MyApplicationsPage() {
  const result = await listMyApplications();

  return (
    <Stack gap="xl" className={styles.fullWidth}>
      <div>
        <Title order={1}>My applications</Title>
        <Text c="dimmed" mt={6}>Track specialist applications and investor interest requests.</Text>
      </div>

      {result.status === "error" ? (
        <Alert color="red" role="alert">Your applications could not be loaded. Refresh and try again.</Alert>
      ) : result.data.length === 0 ? (
        <Paper withBorder radius="lg" p="xl">
          <Stack gap="md" align="flex-start">
            <Title order={2} size="h4">No applications yet</Title>
            <Text c="dimmed">Browse active startups and send a focused message to a founder.</Text>
            <LinkButton href="/startups">Discover startups</LinkButton>
          </Stack>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          {result.data.map((application) => (
            <Paper key={application.id} component="article" withBorder radius="lg" p="lg">
              <Stack gap="md" align="flex-start">
                <Badge variant="light">{statusLabels[application.status]}</Badge>
                <div>
                  <Title order={2} size="h4">{application.startup.title}</Title>
                  <Text size="sm" c="dimmed" mt={4}>
                    {application.type === "team" ? "Specialist application" : "Investor interest"}
                  </Text>
                </div>
                <Text className={styles.preWrap}>{application.message}</Text>
                {application.startup.is_active ? (
                  <LinkButton href={`/startups/${application.startup.slug}`} variant="subtle" px={0}>
                    View startup
                  </LinkButton>
                ) : (
                  <Text size="sm" c="dimmed">This startup is currently inactive.</Text>
                )}
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
