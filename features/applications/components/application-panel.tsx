import { LinkButton } from "@/components/link-button";
import { ApplicationForm } from "@/features/applications/components/application-form";
import { getApplicationContext } from "@/features/applications/server/queries";
import { Alert, Badge, Stack, Text, Title } from "@mantine/core";
import styles from "./applications.module.css";

const statusLabels = { pending: "На рассмотрении", accepted: "Принята", rejected: "Отклонена" } as const;

export async function ApplicationPanel({
  startupId,
  founderId,
  startupSlug,
}: {
  startupId: number;
  founderId: string;
  startupSlug: string;
}) {
  const context = await getApplicationContext(startupId, founderId);

  return (
    <Stack gap="md">
      <Title order={2} size="h3">Интересен этот проект?</Title>
      {context.status === "signed_out" ? (
        <>
          <Text c="dimmed">Войдите как инвестор, чтобы связаться с основателем.</Text>
          <LinkButton
            href={`/auth/login?next=${encodeURIComponent(`/startups/${startupSlug}`)}`}
            className={styles.fitWidth}
          >
            Войти и откликнуться
          </LinkButton>
        </>
      ) : context.status === "owner" ? (
        <Text c="dimmed">Это ваш стартап. Заявки инвесторов появятся в личном кабинете.</Text>
      ) : context.status === "unsupported_role" ? (
        <Text c="dimmed">Отправлять инвестиционные заявки могут только инвесторы.</Text>
      ) : context.status === "error" ? (
        <Alert color="red" role="alert">Не удалось загрузить форму заявки. Обновите страницу.</Alert>
      ) : context.existing ? (
        <Stack gap="xs" align="flex-start">
          <Text c="dimmed">Вы уже отправили заявку по этому проекту.</Text>
          <Badge variant="light">{statusLabels[context.existing.status]}</Badge>
          <LinkButton href="/dashboard/applications" variant="subtle" px={0}>Посмотреть мои заявки</LinkButton>
        </Stack>
      ) : (
        <ApplicationForm startupId={startupId} />
      )}
    </Stack>
  );
}
