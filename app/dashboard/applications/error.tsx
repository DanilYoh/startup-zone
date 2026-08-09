"use client";

import { Alert, Button, Stack } from "@mantine/core";
import styles from "../dashboard.module.css";

export default function ApplicationsError({ reset }: { reset: () => void }) {
  return (
    <Alert color="red" title="Заявки временно недоступны" role="alert" className={styles.fullWidth}>
      <Stack gap="md">
        При загрузке ваших заявок произошла ошибка.
        <Button color="red" variant="light" onClick={reset} className={styles.alignStart}>Повторить</Button>
      </Stack>
    </Alert>
  );
}
