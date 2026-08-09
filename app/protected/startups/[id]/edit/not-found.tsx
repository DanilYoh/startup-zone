import { LinkButton } from "@/components/link-button";
import { Paper, Stack, Text, Title } from "@mantine/core";
import styles from "../../../../dashboard/dashboard.module.css";

export default function StartupNotFound() {
  return (
    <Paper withBorder radius="lg" p="xl" className={styles.formCard}>
      <Stack gap="md" align="flex-start">
        <Title order={1} size="h3">Стартап не найден</Title>
        <Text c="dimmed">Такого стартапа нет или он не принадлежит вашей учётной записи.</Text>
        <LinkButton href="/dashboard">В личный кабинет</LinkButton>
      </Stack>
    </Paper>
  );
}
