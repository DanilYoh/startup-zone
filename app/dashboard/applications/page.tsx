import { LinkButton } from "@/components/link-button";
import { PaginationNav } from "@/components/pagination-nav";
import { AcceptedContactCard } from "@/features/applications/components/accepted-contact-card";
import { listMyApplications } from "@/features/applications/server/queries";
import { parsePage } from "@/lib/pagination";
import { Alert, Badge, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import styles from "../dashboard.module.css";

const statusLabels = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" } as const;

type MyApplicationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyApplicationsPage({ searchParams }: MyApplicationsPageProps) {
  const page = parsePage((await searchParams).page);
  const result = await listMyApplications(page);

  return (
    <Stack gap="xl" className={styles.fullWidth}>
      <div>
        <Title order={1}>My investment interest</Title>
        <Text c="dimmed" mt={6}>Track every focused conversation request you send to a founder.</Text>
      </div>

      {result.status === "ready" && result.contactStatus === "ready" && !result.ownContactReady && (
        <Alert color="yellow" variant="light" title="Enable accepted contact exchange">
          <Stack gap="sm" align="flex-start">
            <Text size="sm">
              Add a private contact so founders can reach you when they accept your interest.
            </Text>
            <LinkButton href="/dashboard/profile" variant="subtle" px={0}>
              Configure private contact
            </LinkButton>
          </Stack>
        </Alert>
      )}

      {result.status === "error" ? (
        <Alert color="red" role="alert">Your interest requests could not be loaded. Refresh and try again.</Alert>
      ) : result.data.length === 0 ? (
        <Paper withBorder radius="lg" p="xl">
          <Stack gap="md" align="flex-start">
            <Title order={2} size="h4">
              {result.total > 0 ? "No requests on this page" : "No investment interest yet"}
            </Title>
            <Text c="dimmed">
              {result.total > 0
                ? "Return to the first page to continue reviewing your interest requests."
                : "Browse active startups and send a focused message to a founder."}
            </Text>
            <LinkButton href={result.total > 0 ? "/dashboard/applications" : "/startups"}>
              {result.total > 0 ? "First page" : "Discover startups"}
            </LinkButton>
          </Stack>
        </Paper>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            {result.data.map((application) => (
              <Paper key={application.id} component="article" withBorder radius="lg" p="lg">
                <Stack gap="md" align="flex-start">
                  <Badge variant="light">{statusLabels[application.status]}</Badge>
                  <div>
                    <Title order={2} size="h4">{application.startup.title}</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                      Investor interest
                    </Text>
                  </div>
                  <Text className={styles.preWrap}>{application.message}</Text>
                  {application.status === "accepted" && (
                    <AcceptedContactCard
                      contact={result.contacts[application.startup.founder_id]}
                      contactStatus={result.contactStatus}
                      counterpartLabel="founder"
                    />
                  )}
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
          <PaginationNav
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            itemLabel={result.total === 1 ? "request" : "requests"}
            previousHref={
              result.page > 1 ? `/dashboard/applications?page=${result.page - 1}` : undefined
            }
            nextHref={
              result.page < result.pageCount
                ? `/dashboard/applications?page=${result.page + 1}`
                : undefined
            }
          />
        </>
      )}
    </Stack>
  );
}
