"use client";

import { Alert, Button, Stack } from "@mantine/core";
import styles from "../../../../dashboard/dashboard.module.css";

export default function EditStartupError({ reset }: { reset: () => void }) {
  return (
    <Alert color="red" title="Startup unavailable" role="alert" className={styles.fullWidth}>
      <Stack gap="md">
        Something unexpected happened while loading this startup.
        <Button variant="light" color="red" onClick={reset} className={styles.alignStart}>
          Try again
        </Button>
      </Stack>
    </Alert>
  );
}
