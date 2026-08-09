import { LinkButton } from "@/components/link-button";
import { Paper, Stack, Text, Title } from "@mantine/core";
import styles from "../startups.module.css";

export default function StartupNotFound() {
  return (
    <div className={styles.narrowContainer}>
      <Paper withBorder radius="lg" p={{ base: "lg", sm: "xl" }}>
        <Stack gap="md" align="flex-start">
          <Title order={1} size="h2">
            Стартап не найден
          </Title>
          <Text c="dimmed">
            Проект не существует или больше не опубликован в каталоге.
          </Text>
          <LinkButton href="/startups">Смотреть активные стартапы</LinkButton>
        </Stack>
      </Paper>
    </div>
  );
}
