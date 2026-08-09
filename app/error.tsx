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
        <Title order={1}>Something went wrong</Title>
        <Alert color="red" title="This page could not be loaded">
          Try the request again. If the problem continues, return to the dashboard.
        </Alert>
        <div>
          <Button onClick={reset}>Try again</Button>
        </div>
      </Stack>
    </main>
  );
}
