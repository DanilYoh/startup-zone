"use client";

import { Alert, Button, Stack } from "@mantine/core";
import styles from "../dashboard.module.css";

export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <Alert color="red" title="Profile unavailable" role="alert" className={styles.fullWidth}>
      <Stack gap="md">
        Something unexpected happened while loading the profile.
        <Button variant="light" color="red" onClick={reset} className={styles.alignStart}>
          Try again
        </Button>
      </Stack>
    </Alert>
  );
}
