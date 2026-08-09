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
                <Title order={1} size="h2">Thank you for signing up!</Title>
                <Text c="dimmed" size="sm" mt={4}>Check your email to confirm</Text>
              </div>
              <Text size="sm" c="dimmed">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account before signing in.
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </div>
    </div>
  );
}
