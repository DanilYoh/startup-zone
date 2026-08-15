"use client";

import { Alert, Button, Stack, Title } from "@mantine/core";
import * as Sentry from "@sentry/nextjs";
import { CircleAlert } from "lucide-react";
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
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <Stack gap="lg" className={styles.content}>
        <div className={styles.statusHeader}>
          <span className={styles.statusIcon}>
            <CircleAlert size={18} aria-hidden="true" />
          </span>
          <span className={styles.statusCode}>Ошибка приложения</span>
        </div>
        <Title order={1}>Что-то пошло не так</Title>
        <Alert color="red" title="Не удалось загрузить страницу">
          Повторите запрос. Если ошибка сохраняется, вернитесь в личный кабинет.
        </Alert>
        <div className={styles.actions}>
          <Button onClick={reset}>Повторить</Button>
        </div>
      </Stack>
    </main>
  );
}
