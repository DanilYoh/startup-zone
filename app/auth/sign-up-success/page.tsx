import { Paper, Stack, Text, Title } from "@mantine/core";
import styles from "../auth-layout.module.css";

export default function Page() {
  return (
    <div className={styles.page}>
      <div className={styles.narrow}>
        <Stack gap="lg">
          <Paper withBorder shadow="sm" radius="lg" p="xl">
            <Stack gap="md">
              <div>
                <Title order={1} size="h2">Регистрация почти завершена</Title>
                <Text c="dimmed" size="sm" mt={4}>Подтвердите электронную почту</Text>
              </div>
              <Text size="sm" c="dimmed">
                Мы создали аккаунт. Перейдите по ссылке из письма, чтобы подтвердить
                электронную почту и войти.
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </div>
    </div>
  );
}
