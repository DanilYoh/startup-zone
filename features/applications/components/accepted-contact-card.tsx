import type { AcceptedContact } from "@/features/applications/server/queries";
import { externalHostname } from "@/lib/external-url";
import { Alert, Anchor, Paper, Stack, Text, Title } from "@mantine/core";
import styles from "./applications.module.css";

type AcceptedContactCardProps = {
  contact?: AcceptedContact;
  contactStatus: "ready" | "error";
  counterpartLabel: "founder" | "investor";
};

export function AcceptedContactCard({
  contact,
  contactStatus,
  counterpartLabel,
}: AcceptedContactCardProps) {
  const counterpart = counterpartLabel === "founder" ? "основатель" : "инвестор";

  if (contactStatus === "error") {
    return (
      <Alert color="red" variant="light" role="alert" title="Контакты временно недоступны">
        Обновите страницу и повторите попытку. Принятая заявка остаётся сохранённой.
      </Alert>
    );
  }

  if (!contact) {
    return (
      <Paper withBorder radius="md" p="md" className={styles.waitingCard}>
        <div className={styles.contactHeader}>
          <span className={styles.waitingDot} aria-hidden="true" />
          <div>
            <Title order={4} size="h5">Ожидаем контактные данные</Title>
            <Text size="sm" c="dimmed" mt={5}>
              {counterpart[0].toUpperCase() + counterpart.slice(1)} пока не включил обмен контактами
              после принятия заявки.
            </Text>
          </div>
        </div>
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="md" p="md" className={styles.contactCard}>
      <Stack gap="xs" align="flex-start">
        <div className={styles.contactHeader}>
          <span className={styles.contactDot} aria-hidden="true" />
          <div>
            <Title order={4} size="h5">Продолжите общение напрямую</Title>
            <Text size="sm" c="dimmed" mt={4}>
              Эти данные доступны только потому, что инвестиционная заявка была принята.
            </Text>
          </div>
        </div>
        <div className={styles.contactLinks}>
          {contact.contact_email && (
            <Anchor
              href={`mailto:${contact.contact_email}`}
              aria-label={contact.contact_email}
              className={styles.contactLink}
            >
              <span className={styles.contactLabel}>Email</span>
              {contact.contact_email}
            </Anchor>
          )}
          {contact.contact_url && (
            <Anchor
              href={contact.contact_url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Открыть ${externalHostname(contact.contact_url)}`}
              className={styles.contactLink}
            >
              <span className={styles.contactLabel}>Ссылка</span>
              Открыть {externalHostname(contact.contact_url)}
            </Anchor>
          )}
        </div>
      </Stack>
    </Paper>
  );
}
