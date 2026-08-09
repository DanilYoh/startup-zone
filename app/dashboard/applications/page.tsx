import { LinkButton } from "@/components/link-button";
import { PaginationNav } from "@/components/pagination-nav";
import { AcceptedContactCard } from "@/features/applications/components/accepted-contact-card";
import { listMyApplications } from "@/features/applications/server/queries";
import { parsePage } from "@/lib/pagination";
import { russianPlural } from "@/lib/market";
import { Alert, Badge, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import styles from "../dashboard.module.css";

const statusLabels = { pending: "На рассмотрении", accepted: "Принята", rejected: "Отклонена" } as const;

type MyApplicationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyApplicationsPage({ searchParams }: MyApplicationsPageProps) {
  const page = parsePage((await searchParams).page);
  const result = await listMyApplications(page);

  return (
    <Stack gap="xl" className={styles.fullWidth}>
      <div>
        <Title order={1}>Мои инвестиционные заявки</Title>
        <Text c="dimmed" mt={6}>Следите за статусом каждого обращения к основателям.</Text>
      </div>

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
        <Paper withBorder radius="lg" p="xl">
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
        <>
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            {result.data.map((application) => (
              <Paper key={application.id} component="article" withBorder radius="lg" p="lg">
                <Stack gap="md" align="flex-start">
                  <Badge variant="light">{statusLabels[application.status]}</Badge>
                  <div>
                    <Title order={2} size="h4">{application.startup.title}</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                      Инвестиционная заявка
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
                      Открыть стартап
                    </LinkButton>
                  ) : (
                    <Text size="sm" c="dimmed">Стартап сейчас неактивен.</Text>
                  )}
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
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
        </>
      )}
    </Stack>
  );
}
