import { LinkButton } from "@/components/link-button";
import { PaginationNav } from "@/components/pagination-nav";
import { ApplicationDecisionForm } from "@/features/applications/components/application-decision-form";
import { listFounderApplications } from "@/features/applications/server/queries";
import { parsePage } from "@/lib/pagination";
import { startupStageLabels } from "@/lib/validations";
import { Alert, Anchor, Badge, Group, Paper, Stack, Text, Title } from "@mantine/core";
import styles from "../../dashboard.module.css";

const statusLabels = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" } as const;
const statusColors = { pending: "yellow", accepted: "teal", rejected: "red" } as const;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type FounderApplicationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FounderApplicationsPage({
  searchParams,
}: FounderApplicationsPageProps) {
  const page = parsePage((await searchParams).page);
  const result = await listFounderApplications(page);

  if (result.status === "forbidden") {
    return (
      <Alert color="yellow" title="Founder profile required" className={styles.fullWidth}>
        Incoming investor interest is available only to founders.
      </Alert>
    );
  }

  if (result.status === "error") {
    return <Alert color="red" role="alert" className={styles.fullWidth}>Investor interest could not be loaded. Refresh and try again.</Alert>;
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
        <Title order={1}>Investor interest</Title>
        <Text c="dimmed" mt={6}>Review each investor request once and make a clear decision.</Text>
      </div>

      {groups.size === 0 ? (
        <Paper withBorder radius="lg" p="xl">
          <Stack gap="md" align="flex-start">
            <Title order={2} size="h4">
              {result.total > 0 ? "No requests on this page" : "No investor interest yet"}
            </Title>
            <Text c="dimmed">
              {result.total > 0
                ? "Return to the first page to continue reviewing incoming interest."
                : "Interest requests for your active startups will appear here."}
            </Text>
            <LinkButton href={result.total > 0 ? "/dashboard/applications/inbox" : "/dashboard"}>
              {result.total > 0 ? "First page" : "Back to dashboard"}
            </LinkButton>
          </Stack>
        </Paper>
      ) : (
        <>
          {Array.from(groups.values()).map((group) => (
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
                        {application.applicant.full_name ?? "Investor"}
                      </Title>
                      {application.applicant.headline && (
                        <Text size="sm" mt={2}>{application.applicant.headline}</Text>
                      )}
                      <Text size="sm" c="dimmed" mt={4}>
                        Investor interest
                        {application.applicant.location ? ` · ${application.applicant.location}` : ""}
                      </Text>
                    </div>
                    {application.applicant.bio && <Text c="dimmed">{application.applicant.bio}</Text>}
                    {(application.applicant.investor_organization || application.applicant.website_url) && (
                      <Text size="sm">
                        {application.applicant.investor_organization ?? "Investment organization"}
                        {application.applicant.website_url && (
                          <> · <Anchor href={application.applicant.website_url} target="_blank" rel="noreferrer">Website</Anchor></>
                        )}
                      </Text>
                    )}
                    {application.applicant.investment_thesis && (
                      <div>
                        <Text size="xs" tt="uppercase" c="dimmed" fw={700}>Investment thesis</Text>
                        <Text mt={4}>{application.applicant.investment_thesis}</Text>
                      </div>
                    )}
                    {application.applicant.preferred_stages.length > 0 && (
                      <Group gap="xs">
                        {application.applicant.preferred_stages.map((stage) => (
                          <Badge key={stage} variant="light" color="blue">{startupStageLabels[stage]}</Badge>
                        ))}
                      </Group>
                    )}
                    {(application.applicant.ticket_min !== null || application.applicant.ticket_max !== null) && (
                      <Text size="sm" c="dimmed">
                        Typical ticket: {application.applicant.ticket_min !== null ? currencyFormatter.format(application.applicant.ticket_min) : "Open"}
                        {" – "}
                        {application.applicant.ticket_max !== null ? currencyFormatter.format(application.applicant.ticket_max) : "Open"}
                      </Text>
                    )}
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
          ))}
          <PaginationNav
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            itemLabel={result.total === 1 ? "request" : "requests"}
            previousHref={
              result.page > 1
                ? `/dashboard/applications/inbox?page=${result.page - 1}`
                : undefined
            }
            nextHref={
              result.page < result.pageCount
                ? `/dashboard/applications/inbox?page=${result.page + 1}`
                : undefined
            }
          />
        </>
      )}
    </Stack>
  );
}
