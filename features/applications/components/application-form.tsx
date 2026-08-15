"use client";

import {
  createApplication,
  type ApplicationActionState,
} from "@/features/applications/server/actions";
import { Alert, Button, Stack, Textarea } from "@mantine/core";
import { useActionState } from "react";
import styles from "./applications.module.css";

const initialState: ApplicationActionState = { status: "idle" };

export function ApplicationForm({
  startupId,
}: {
  startupId: number;
}) {
  const [state, formAction, pending] = useActionState(createApplication, initialState);

  if (state.status === "success") {
    return <Alert color="teal" role="status" className={styles.successState}>{state.message}</Alert>;
  }

  return (
    <form action={formAction} className={styles.applicationForm}>
      <input type="hidden" name="startup_id" value={startupId} />
      <Stack gap="md" align="flex-start">
        <Textarea
          name="message"
          label="Сообщение основателю"
          description="Объясните, почему проект соответствует вашей стратегии и что вы хотите обсудить."
          minRows={5}
          autosize
          required
          minLength={20}
          maxLength={2_000}
          error={state.errors?.message?.[0]}
          className={`${styles.fullWidth} ${styles.messageField}`}
        />
        {state.message && <Alert color="red" role="alert">{state.message}</Alert>}
        <div className={styles.formFooter}>
          <span className={styles.formHint}>20–2000 символов · контакты откроются после принятия</span>
          <Button type="submit" loading={pending}>
            Отправить заявку
          </Button>
        </div>
      </Stack>
    </form>
  );
}
