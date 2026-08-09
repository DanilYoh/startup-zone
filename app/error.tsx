"use client";

import { Alert, Button, Stack, Title } from "@mantine/core";
import { useEffect } from "react";
import styles from "./status.module.css";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Next.js instrumentation records the sanitized server-side failure.
    void error.digest;
  }, [error]);

  return (
    <main className={styles.page}>
      <Stack gap="lg" className={styles.content}>
        <Title order={1}>Что-то пошло не так</Title>
        <Alert color="red" title="Не удалось загрузить страницу">
          Повторите запрос. Если ошибка сохраняется, вернитесь в личный кабинет.
        </Alert>
        <div>
          <Button onClick={reset}>Повторить</Button>
        </div>
      </Stack>
    </main>
  );
}
