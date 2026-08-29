"use client";

import { LinkButton } from "@/components/link-button";
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
    return (
      <Stack gap="sm" align="flex-start">
        <Alert color="teal" role="status">{state.message}</Alert>
        <LinkButton href="/dashboard/applications" variant="outline">
          Посмотреть мои заявки
        </LinkButton>
      </Stack>
    );
  }

  return (
    <form action={formAction}>
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
          className={styles.fullWidth}
        />
        {state.message && <Alert color="red" role="alert">{state.message}</Alert>}
        <Button type="submit" loading={pending}>
          Отправить заявку
        </Button>
      </Stack>
    </form>
  );
}
