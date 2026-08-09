"use client";

import { Alert, Button, Stack } from "@mantine/core";
import styles from "../../../dashboard.module.css";

export default function EditStartupError({ reset }: { reset: () => void }) {
  return (
    <Alert color="red" title="Стартап временно недоступен" role="alert" className={styles.fullWidth}>
      <Stack gap="md">
        При загрузке стартапа произошла ошибка.
        <Button variant="light" color="red" onClick={reset} className={styles.alignStart}>
          Повторить
        </Button>
      </Stack>
    </Alert>
  );
}
