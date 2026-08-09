import type { AcceptedContact } from "@/features/applications/server/queries";
import { Alert, Anchor, Paper, Stack, Text, Title } from "@mantine/core";

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
      <Paper withBorder radius="md" p="md">
        <Title order={4} size="h5">Ожидаем контактные данные</Title>
        <Text size="sm" c="dimmed" mt={5}>
          {counterpart[0].toUpperCase() + counterpart.slice(1)} пока не включил обмен контактами
          после принятия заявки.
        </Text>
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs" align="flex-start">
        <div>
          <Title order={4} size="h5">Продолжите общение напрямую</Title>
          <Text size="sm" c="dimmed" mt={4}>
            Эти данные доступны только потому, что инвестиционная заявка была принята.
          </Text>
        </div>
        {contact.contact_email && (
          <Anchor href={`mailto:${contact.contact_email}`}>{contact.contact_email}</Anchor>
        )}
        {contact.contact_url && (
          <Anchor href={contact.contact_url} target="_blank" rel="noreferrer">
            Открыть ссылку для связи
          </Anchor>
        )}
      </Stack>
    </Paper>
  );
}
