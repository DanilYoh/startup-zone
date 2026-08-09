import { getAuthErrorMessage } from "@/features/auth/errors";
import { Paper, Stack, Text, Title } from "@mantine/core";
import { Suspense } from "react";
import styles from "../auth-layout.module.css";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const params = await searchParams;

  return (
    <Text size="sm" c="dimmed">
      {getAuthErrorMessage(params.code)}
    </Text>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.narrow}>
        <Stack gap="lg">
          <Paper withBorder shadow="sm" radius="lg" p="xl">
            <Stack gap="md">
              <Title order={1} size="h2">Не удалось завершить действие</Title>
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
            </Stack>
          </Paper>
        </Stack>
      </div>
    </div>
  );
}
