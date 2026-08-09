"use client";

import { Alert, Button, Stack } from "@mantine/core";
import styles from "../../dashboard.module.css";

export default function InboxError({ reset }: { reset: () => void }) {
  return (
    <Alert color="red" title="Заявки инвесторов временно недоступны" role="alert" className={styles.fullWidth}>
      <Stack gap="md">
        При загрузке заявок инвесторов произошла ошибка.
        <Button color="red" variant="light" onClick={reset} className={styles.alignStart}>Повторить</Button>
      </Stack>
    </Alert>
  );
}
