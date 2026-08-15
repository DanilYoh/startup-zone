import { LinkButton } from "@/components/link-button";
import { PaginationNav } from "@/components/pagination-nav";
import { AcceptedContactCard } from "@/features/applications/components/accepted-contact-card";
import { listMyApplications } from "@/features/applications/server/queries";
import { parsePage } from "@/lib/pagination";
import { russianPlural } from "@/lib/market";
import { Alert, Badge, Paper, Stack, Text, Title } from "@mantine/core";
import styles from "../dashboard.module.css";

const statusLabels = { pending: "На рассмотрении", accepted: "Принята", rejected: "Отклонена" } as const;
const statusColors = { pending: "yellow", accepted: "teal", rejected: "red" } as const;

type MyApplicationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyApplicationsPage({ searchParams }: MyApplicationsPageProps) {
  const page = parsePage((await searchParams).page);
  const result = await listMyApplications(page);

  return (
    <Stack gap="xl" className={styles.pageStack}>
      <header className={styles.pageHeader}>
        <Text className={styles.eyebrow}>Deal room / Outgoing</Text>
        <Title order={1}>Мои инвестиционные заявки</Title>
        <Text className={styles.pageDescription}>Следите за статусом каждого обращения к основателям.</Text>
      </header>

      {result.status === "ready" && result.contactStatus === "ready" && !result.ownContactReady && (
        <Alert color="yellow" variant="light" title="Включите обмен контактами">
          <Stack gap="sm" align="flex-start">
            <Text size="sm">
              Добавьте приватный контакт, чтобы основатель мог связаться с вами после принятия заявки.
            </Text>
            <LinkButton href="/dashboard/profile" variant="subtle" px={0}>
              Настроить контакт
            </LinkButton>
          </Stack>
        </Alert>
      )}

      {result.status === "error" ? (
        <Alert color="red" role="alert">Не удалось загрузить заявки. Обновите страницу.</Alert>
      ) : result.data.length === 0 ? (
        <Paper withBorder radius="md" p="xl" className={styles.emptyState}>
          <Stack gap="md" align="flex-start">
            <Title order={2} size="h4">
              {result.total > 0 ? "На этой странице нет заявок" : "Вы ещё не отправляли заявки"}
            </Title>
            <Text c="dimmed">
              {result.total > 0
                ? "Вернитесь на первую страницу, чтобы продолжить просмотр заявок."
                : "Найдите подходящий стартап и отправьте основателю содержательное сообщение."}
            </Text>
            <LinkButton href={result.total > 0 ? "/dashboard/applications" : "/startups"}>
              {result.total > 0 ? "На первую страницу" : "Найти стартапы"}
            </LinkButton>
          </Stack>
        </Paper>
      ) : (
        <div className={styles.dealRoom}>
          <div className={styles.dealSummary}>
            <strong>APPLICATION PIPELINE</strong>
            <Text size="xs" c="dimmed">{result.total} всего</Text>
          </div>
          <div className={styles.dealGroup}>
            <div className={styles.panelHeader}>
              <Text size="xs" fw={650}>История обращений</Text>
              <span className={styles.panelHeaderText}>актуальные статусы</span>
            </div>
            <div className={styles.dealGroupList}>
            {result.data.map((application) => (
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
                        <Title order={2} size="h4">{application.startup.title}</Title>
                        <div className={styles.dealMeta}>
                          <span>Инвестиционная заявка</span>
                          <span>#{application.id}</span>
                        </div>
                      </div>
                      <Badge variant="light" color={statusColors[application.status]}>
                        {statusLabels[application.status]}
                      </Badge>
                    </div>
                    <div>
                      <span className={styles.dataLabel}>Ваше сообщение</span>
                      <Paper radius="sm" p="md" className={styles.messagePanel}>
                        <Text className={styles.preWrap}>{application.message}</Text>
                      </Paper>
                    </div>
                  </div>
                  <aside className={styles.dealAside}>
                    {application.status === "accepted" && (
                      <AcceptedContactCard
                        contact={result.contacts[application.startup.founder_id]}
                        contactStatus={result.contactStatus}
                        counterpartLabel="founder"
                      />
                    )}
                    {application.startup.is_active ? (
                      <LinkButton href={`/startups/${application.startup.slug}`} variant="default" size="compact-sm">
                        Открыть стартап
                      </LinkButton>
                    ) : (
                      <Text size="sm" c="dimmed">Стартап сейчас неактивен.</Text>
                    )}
                  </aside>
                </div>
              </Paper>
            ))}
            </div>
          </div>
          <PaginationNav
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            itemLabel={russianPlural(result.total, "заявка", "заявки", "заявок")}
            previousHref={
              result.page > 1 ? `/dashboard/applications?page=${result.page - 1}` : undefined
            }
            nextHref={
              result.page < result.pageCount
                ? `/dashboard/applications?page=${result.page + 1}`
                : undefined
            }
          />
        </div>
      )}
    </Stack>
  );
}
