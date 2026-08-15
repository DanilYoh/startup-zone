import { LinkButton } from "@/components/link-button";
import { ApplicationForm } from "@/features/applications/components/application-form";
import { getApplicationContext } from "@/features/applications/server/queries";
import { Alert, Badge, Stack, Text, Title } from "@mantine/core";
import styles from "./applications.module.css";

const statusLabels = { pending: "На рассмотрении", accepted: "Принята", rejected: "Отклонена" } as const;
const statusColors = { pending: "yellow", accepted: "teal", rejected: "red" } as const;

export async function ApplicationPanel({
  startupId,
  founderId,
}: {
  startupId: number;
  founderId: string;
}) {
  const context = await getApplicationContext(startupId, founderId);

  return (
    <Stack gap="md" className={styles.applicationPanel}>
      <div className={styles.panelHeader}>
        <div>
          <Text className={styles.panelEyebrow}>Deal room</Text>
          <Title order={2} size="h3">Интересен этот проект?</Title>
        </div>
        <span className={styles.secureMark}>
          <span className={styles.secureDot} aria-hidden="true" />
          private
        </span>
      </div>
      {context.status === "signed_out" ? (
        <div className={styles.signedOutState}>
          <Text c="dimmed">Войдите как инвестор, чтобы связаться с основателем.</Text>
          <LinkButton href="/auth/login" className={styles.fitWidth}>Войти и откликнуться</LinkButton>
        </div>
      ) : context.status === "owner" ? (
        <Text c="dimmed">Это ваш стартап. Заявки инвесторов появятся в личном кабинете.</Text>
      ) : context.status === "unsupported_role" ? (
        <Text c="dimmed">Отправлять инвестиционные заявки могут только инвесторы.</Text>
      ) : context.status === "error" ? (
        <Alert color="red" role="alert">Не удалось загрузить форму заявки. Обновите страницу.</Alert>
      ) : context.existing ? (
        <Stack gap="xs" align="flex-start" className={styles.existingState}>
          <Text c="dimmed">Вы уже отправили заявку по этому проекту.</Text>
          <Badge variant="light" color={statusColors[context.existing.status]}>
            {statusLabels[context.existing.status]}
          </Badge>
          <LinkButton href="/dashboard/applications" variant="subtle" px={0}>Посмотреть мои заявки</LinkButton>
        </Stack>
      ) : (
        <ApplicationForm startupId={startupId} />
      )}
    </Stack>
  );
}
