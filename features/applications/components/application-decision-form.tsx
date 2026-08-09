"use client";

import {
  moderateApplication,
  type ModerationActionState,
} from "@/features/applications/server/actions";
import { Alert, Button, Group, Stack } from "@mantine/core";
import { useActionState } from "react";

const initialState: ModerationActionState = { status: "idle" };

export function ApplicationDecisionForm({ applicationId }: { applicationId: number }) {
  const [state, formAction, pending] = useActionState(moderateApplication, initialState);

  return (
    <Stack gap="xs" align="flex-start">
      <form action={formAction}>
        <input type="hidden" name="application_id" value={applicationId} />
        <Group gap="sm">
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
        </Group>
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
