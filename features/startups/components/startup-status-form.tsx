"use client";

import {
  updateStartupStatus,
  type StartupActionState,
} from "@/features/startups/server/actions";
import { Alert, Button, Stack } from "@mantine/core";
import { useActionState } from "react";

const initialState: StartupActionState = { status: "idle" };

export function StartupStatusForm({ id, isActive }: { id: number; isActive: boolean }) {
  const [state, formAction, pending] = useActionState(updateStartupStatus, initialState);

  return (
    <Stack gap="xs" align="flex-start">
      <form action={formAction}>
        <input type="hidden" name="startup_id" value={id} />
        <input type="hidden" name="is_active" value={String(!isActive)} />
        <Button
          type="submit"
          variant="outline"
          color={isActive ? "red" : "teal"}
          size="compact-sm"
          loading={pending}
        >
          {isActive ? "Снять с публикации" : "Опубликовать снова"}
        </Button>
      </form>
      {state.message && (
        <Alert
          color={state.status === "success" ? "teal" : "red"}
          variant="light"
          role={state.status === "error" ? "alert" : "status"}
          p="xs"
        >
          {state.message}
        </Alert>
      )}
    </Stack>
  );
}
