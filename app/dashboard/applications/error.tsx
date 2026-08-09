"use client";

import { Alert, Button, Stack } from "@mantine/core";
import styles from "../dashboard.module.css";

export default function ApplicationsError({ reset }: { reset: () => void }) {
  return (
    <Alert color="red" title="Interest unavailable" role="alert" className={styles.fullWidth}>
      <Stack gap="md">
        Something unexpected happened while loading your interest requests.
        <Button color="red" variant="light" onClick={reset} className={styles.alignStart}>Try again</Button>
      </Stack>
    </Alert>
  );
}
