import { LinkButton } from "@/components/link-button";
import { Paper, Stack, Text, Title } from "@mantine/core";

export default function StartupNotFound() {
  return (
    <Paper withBorder radius="lg" p="xl" className="mx-auto w-full max-w-2xl">
      <Stack gap="md" align="flex-start">
        <Title order={1} size="h3">Startup not found</Title>
        <Text c="dimmed">This startup does not exist or does not belong to your account.</Text>
        <LinkButton href="/protected">Back to dashboard</LinkButton>
      </Stack>
    </Paper>
  );
}

