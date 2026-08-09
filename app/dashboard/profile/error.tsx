"use client";

import { Alert, Button, Stack } from "@mantine/core";
import styles from "../dashboard.module.css";

export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <Alert color="red" title="Профиль временно недоступен" role="alert" className={styles.fullWidth}>
      <Stack gap="md">
        При загрузке профиля произошла ошибка.
        <Button variant="light" color="red" onClick={reset} className={styles.alignStart}>
          Повторить
        </Button>
      </Stack>
    </Alert>
  );
}
