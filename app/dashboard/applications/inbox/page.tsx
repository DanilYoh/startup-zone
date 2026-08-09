import { LinkButton } from "@/components/link-button";
import { ApplicationDecisionForm } from "@/features/applications/components/application-decision-form";
import { listFounderApplications } from "@/features/applications/server/queries";
import { Alert, Anchor, Badge, Paper, Stack, Text, Title } from "@mantine/core";
import styles from "../../dashboard.module.css";

const statusLabels = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" } as const;
const statusColors = { pending: "yellow", accepted: "teal", rejected: "red" } as const;

export default async function FounderApplicationsPage() {
  const result = await listFounderApplications();

  if (result.status === "forbidden") {
    return (
      <Alert color="yellow" title="Founder profile required" className={styles.fullWidth}>
        Incoming applications are available only to founders.
      </Alert>
    );
  }

  if (result.status === "error") {
    return <Alert color="red" role="alert" className={styles.fullWidth}>Applications could not be loaded. Refresh and try again.</Alert>;
  }

  const groups = new Map<
    number,
    { startup: (typeof result.data)[number]["startup"]; applications: typeof result.data }
  >();

  for (const application of result.data) {
    const group = groups.get(application.startup.id);
    if (group) group.applications.push(application);
    else groups.set(application.startup.id, { startup: application.startup, applications: [application] });
  }

  return (
    <Stack gap="xl" className={styles.fullWidth}>
      <div>
        <Title order={1}>Incoming applications</Title>
        <Text c="dimmed" mt={6}>Review each message once and make a terminal decision.</Text>
      </div>

      {groups.size === 0 ? (
        <Paper withBorder radius="lg" p="xl">
          <Stack gap="md" align="flex-start">
            <Title order={2} size="h4">No incoming applications</Title>
            <Text c="dimmed">Applications to your active startups will appear here.</Text>
            <LinkButton href="/dashboard">Back to dashboard</LinkButton>
          </Stack>
        </Paper>
      ) : (
        Array.from(groups.values()).map((group) => (
          <section key={group.startup.id} aria-labelledby={`startup-${group.startup.id}`}>
            <Stack gap="md">
              <div>
                <Title order={2} size="h3" id={`startup-${group.startup.id}`}>{group.startup.title}</Title>
                <LinkButton href={`/startups/${group.startup.slug}`} variant="subtle" px={0}>
                  View public startup
                </LinkButton>
              </div>
              {group.applications.map((application) => (
                <Paper key={application.id} component="article" withBorder radius="lg" p="lg">
                  <Stack gap="md" align="flex-start">
                    <Badge color={statusColors[application.status]} variant="light">
                      {statusLabels[application.status]}
                    </Badge>
                    <div>
                      <Title order={3} size="h4">
                        {application.applicant.full_name ?? "Marketplace participant"}
                      </Title>
                      <Text size="sm" c="dimmed" mt={4}>
                        {application.type === "team" ? "Specialist application" : "Investor interest"}
                        {application.applicant.location ? ` · ${application.applicant.location}` : ""}
                      </Text>
                    </div>
                    {application.applicant.bio && <Text c="dimmed">{application.applicant.bio}</Text>}
                    {application.applicant.linkedin_url && (
                      <Anchor href={application.applicant.linkedin_url} target="_blank" rel="noreferrer">
                        LinkedIn profile
                      </Anchor>
                    )}
                    <Paper bg="var(--mantine-color-default-hover)" radius="md" p="md" className={styles.messagePanel}>
                      <Text className={styles.preWrap}>{application.message}</Text>
                    </Paper>
                    {application.status === "pending" && (
                      <ApplicationDecisionForm applicationId={application.id} />
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </section>
        ))
      )}
    </Stack>
  );
}
