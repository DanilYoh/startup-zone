"use client";

import { Alert, Button, Stack } from "@mantine/core";
import styles from "../../dashboard.module.css";

export default function InboxError({ reset }: { reset: () => void }) {
  return (
    <Alert color="red" title="Investor interest unavailable" role="alert" className={styles.fullWidth}>
      <Stack gap="md">
        Something unexpected happened while loading investor interest.
        <Button color="red" variant="light" onClick={reset} className={styles.alignStart}>Try again</Button>
      </Stack>
    </Alert>
  );
}
