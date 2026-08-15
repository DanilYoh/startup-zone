import { LinkButton } from "@/components/link-button";
import { PaginationNav } from "@/components/pagination-nav";
import { AcceptedContactCard } from "@/features/applications/components/accepted-contact-card";
import { ApplicationDecisionForm } from "@/features/applications/components/application-decision-form";
import { listFounderApplications } from "@/features/applications/server/queries";
import { formatMarketCurrency, russianPlural } from "@/lib/market";
import { externalHostname } from "@/lib/external-url";
import { parsePage } from "@/lib/pagination";
import { startupStageLabels } from "@/lib/validations";
import { Alert, Anchor, Badge, Group, Paper, Stack, Text, Title } from "@mantine/core";
import styles from "../../dashboard.module.css";

const statusLabels = { pending: "На рассмотрении", accepted: "Принята", rejected: "Отклонена" } as const;
const statusColors = { pending: "yellow", accepted: "teal", rejected: "red" } as const;

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
      <Alert color="yellow" title="Нужен профиль основателя" className={styles.fullWidth}>
        Входящие заявки инвесторов доступны только основателям.
      </Alert>
    );
  }

  if (result.status === "error") {
    return <Alert color="red" role="alert" className={styles.fullWidth}>Не удалось загрузить заявки инвесторов. Обновите страницу.</Alert>;
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
    <Stack gap="xl" className={styles.pageStack}>
      <header className={styles.pageHeader}>
        <Text className={styles.eyebrow}>Deal room / Incoming</Text>
        <Title order={1}>Заявки инвесторов</Title>
        <Text className={styles.pageDescription}>Изучите каждое обращение и примите однозначное решение.</Text>
      </header>

      {result.contactStatus === "ready" && !result.ownContactReady && (
        <Alert color="yellow" variant="light" title="Включите обмен контактами">
          <Stack gap="sm" align="flex-start">
            <Text size="sm">
              Добавьте приватный контакт, чтобы принятые инвесторы могли продолжить общение с вами.
            </Text>
            <LinkButton href="/dashboard/profile" variant="subtle" px={0}>
              Настроить контакт
            </LinkButton>
          </Stack>
        </Alert>
      )}

      {groups.size === 0 ? (
        <Paper withBorder radius="md" p="xl" className={styles.emptyState}>
          <Stack gap="md" align="flex-start">
            <Title order={2} size="h4">
              {result.total > 0 ? "На этой странице нет заявок" : "Заявок инвесторов пока нет"}
            </Title>
            <Text c="dimmed">
              {result.total > 0
                ? "Вернитесь на первую страницу, чтобы продолжить просмотр входящих заявок."
                : "Заявки по вашим активным стартапам появятся здесь."}
            </Text>
            <LinkButton href={result.total > 0 ? "/dashboard/applications/inbox" : "/dashboard"}>
              {result.total > 0 ? "На первую страницу" : "В личный кабинет"}
            </LinkButton>
          </Stack>
        </Paper>
      ) : (
        <div className={styles.dealRoom}>
          <div className={styles.dealSummary}>
            <strong>INCOMING PIPELINE</strong>
            <Text size="xs" c="dimmed">{result.total} всего · {groups.size} проектов</Text>
          </div>
          <div className={styles.dealGroups}>
          {Array.from(groups.values()).map((group) => (
            <section key={group.startup.id} aria-labelledby={`startup-${group.startup.id}`} className={styles.dealGroup}>
              <header className={styles.dealGroupHeader}>
                <div>
                  <Text className={styles.sectionLabel}>Startup #{group.startup.id}</Text>
                  <Title order={2} size="h3" id={`startup-${group.startup.id}`}>{group.startup.title}</Title>
                </div>
                <LinkButton href={`/startups/${group.startup.slug}`} variant="default" size="compact-sm">
                  Открыть публичную страницу
                </LinkButton>
              </header>
              <div className={styles.dealGroupList}>
              {group.applications.map((application) => (
                <Paper
                  key={application.id}
                  component="article"
                  className={styles.dealCard}
                  data-status={application.status}
                >
                  <div className={styles.dealCardInner}>
                    <div className={styles.dealMain}>
                      <div className={styles.dealCardHeader}>
                        <div className={styles.dealIdentity}>
                          <Title order={3} size="h4">
                            {application.applicant.full_name ?? "Инвестор"}
                          </Title>
                          {application.applicant.headline && (
                            <Text size="sm" mt={2}>{application.applicant.headline}</Text>
                          )}
                          <div className={styles.dealMeta}>
                            <span>Заявка #{application.id}</span>
                            {application.applicant.location && <span>{application.applicant.location}</span>}
                          </div>
                        </div>
                        <Badge color={statusColors[application.status]} variant="light">
                          {statusLabels[application.status]}
                        </Badge>
                      </div>

                      <div className={styles.dealProfile}>
                        {application.applicant.bio && <Text c="dimmed">{application.applicant.bio}</Text>}
                        <div className={styles.dealDataGrid}>
                          {(application.applicant.investor_organization || application.applicant.website_url) && (
                            <div className={styles.dealDataCell}>
                              <span className={styles.dataLabel}>Организация</span>
                              <Text size="sm">
                                {application.applicant.investor_organization ?? "Инвестиционная организация"}
                                {application.applicant.website_url && (
                                  <> · <Anchor href={application.applicant.website_url} target="_blank" rel="noreferrer">{externalHostname(application.applicant.website_url)}</Anchor></>
                                )}
                              </Text>
                            </div>
                          )}
                          {(application.applicant.ticket_min !== null || application.applicant.ticket_max !== null) && (
                            <div className={styles.dealDataCell}>
                              <span className={styles.dataLabel}>Типичный чек</span>
                              <Text size="sm">
                                {application.applicant.ticket_min !== null ? formatMarketCurrency(application.applicant.ticket_min) : "не указан"}
                                {" – "}
                                {application.applicant.ticket_max !== null ? formatMarketCurrency(application.applicant.ticket_max) : "не указан"}
                              </Text>
                            </div>
                          )}
                        </div>
                        {application.applicant.investment_thesis && (
                          <div>
                            <span className={styles.dataLabel}>Инвестиционная стратегия</span>
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
                        {application.applicant.linkedin_url && (
                          <Anchor href={application.applicant.linkedin_url} target="_blank" rel="noreferrer">
                            {externalHostname(application.applicant.linkedin_url)}
                          </Anchor>
                        )}
                      </div>
                    </div>
                    <aside className={styles.dealAside}>
                      <div>
                        <span className={styles.dataLabel}>Сообщение инвестора</span>
                        <Paper radius="sm" p="md" className={styles.messagePanel}>
                          <Text className={styles.preWrap}>{application.message}</Text>
                        </Paper>
                      </div>
                      {application.status === "pending" && (
                        <ApplicationDecisionForm applicationId={application.id} />
                      )}
                      {application.status === "accepted" && (
                        <AcceptedContactCard
                          contact={result.contacts[application.applicant.id]}
                          contactStatus={result.contactStatus}
                          counterpartLabel="investor"
                        />
                      )}
                    </aside>
                  </div>
                </Paper>
              ))}
              </div>
            </section>
          ))}
          </div>
          <PaginationNav
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            itemLabel={russianPlural(result.total, "заявка", "заявки", "заявок")}
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
        </div>
      )}
    </Stack>
  );
}
