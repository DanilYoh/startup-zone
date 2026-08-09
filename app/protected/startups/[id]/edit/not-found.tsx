import { LinkButton } from "@/components/link-button";
import { Paper, Stack, Text, Title } from "@mantine/core";
import styles from "../../../../dashboard/dashboard.module.css";

export default function StartupNotFound() {
  return (
    <Paper withBorder radius="lg" p="xl" className={styles.formCard}>
      <Stack gap="md" align="flex-start">
        <Title order={1} size="h3">Startup not found</Title>
        <Text c="dimmed">This startup does not exist or does not belong to your account.</Text>
        <LinkButton href="/dashboard">Back to dashboard</LinkButton>
      </Stack>
    </Paper>
  );
}
