"use client";

import {
  moderateApplication,
  type ModerationActionState,
} from "@/features/applications/server/actions";
import { Alert, Button, Stack } from "@mantine/core";
import { useActionState } from "react";
import styles from "./applications.module.css";

const initialState: ModerationActionState = { status: "idle" };

export function ApplicationDecisionForm({ applicationId }: { applicationId: number }) {
  const [state, formAction, pending] = useActionState(moderateApplication, initialState);

  return (
    <Stack gap="xs" align="flex-start" className={styles.decisionForm}>
      <form action={formAction} className={styles.decisionForm}>
        <input type="hidden" name="application_id" value={applicationId} />
        <div className={styles.decisionToolbar}>
          <Button type="submit" name="decision" value="accepted" color="teal" loading={pending}>
            Принять
          </Button>
          <Button
            type="submit"
            name="decision"
            value="rejected"
            color="red"
            variant="outline"
            loading={pending}
          >
            Отклонить
          </Button>
          <span className={styles.decisionHint}>Решение окончательное</span>
        </div>
      </form>
      {state.message && (
        <Alert
          color={state.status === "success" ? "teal" : "red"}
          role={state.status === "error" ? "alert" : "status"}
          p="xs"
        >
          {state.message}
        </Alert>
      )}
    </Stack>
  );
}
