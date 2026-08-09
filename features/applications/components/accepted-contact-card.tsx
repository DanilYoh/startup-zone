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
  if (contactStatus === "error") {
    return (
      <Alert color="red" variant="light" role="alert" title="Contact details unavailable">
        Refresh the page and try again. The accepted request remains safely recorded.
      </Alert>
    );
  }

  if (!contact) {
    return (
      <Paper withBorder radius="md" p="md">
        <Title order={4} size="h5">Waiting for private contact</Title>
        <Text size="sm" c="dimmed" mt={5}>
          The {counterpartLabel} has not enabled accepted contact exchange yet.
        </Text>
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs" align="flex-start">
        <div>
          <Title order={4} size="h5">Continue the conversation</Title>
          <Text size="sm" c="dimmed" mt={4}>
            Shared privately because this interest request was accepted.
          </Text>
        </div>
        {contact.contact_email && (
          <Anchor href={`mailto:${contact.contact_email}`}>{contact.contact_email}</Anchor>
        )}
        {contact.contact_url && (
          <Anchor href={contact.contact_url} target="_blank" rel="noreferrer">
            Open contact link
          </Anchor>
        )}
      </Stack>
    </Paper>
  );
}
