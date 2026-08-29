"use client";

import {
  moderateApplication,
  type ModerationActionState,
} from "@/features/applications/server/actions";
import { Alert, Button, Group, Stack } from "@mantine/core";
import { useActionState, useState } from "react";

const initialState: ModerationActionState = { status: "idle" };
type Decision = "accepted" | "rejected";

export function ApplicationDecisionForm({ applicationId }: { applicationId: number }) {
  const [state, formAction, pending] = useActionState(moderateApplication, initialState);
  const [decision, setDecision] = useState<Decision | null>(null);

  return (
    <Stack gap="xs" align="flex-start">
      {decision ? (
        <form action={formAction}>
          <input type="hidden" name="application_id" value={applicationId} />
          <input type="hidden" name="decision" value={decision} />
          <Stack gap="xs" align="flex-start">
            <Alert color="yellow" title="Подтвердите решение">
              После подтверждения решение нельзя изменить.
            </Alert>
            <Group gap="sm">
              <Button
                type="submit"
                color={decision === "accepted" ? "teal" : "red"}
                loading={pending}
              >
                {decision === "accepted" ? "Да, принять заявку" : "Да, отклонить заявку"}
              </Button>
              <Button
                type="button"
                variant="subtle"
                disabled={pending}
                onClick={() => setDecision(null)}
              >
                Отмена
              </Button>
            </Group>
          </Stack>
        </form>
      ) : (
        <Group gap="sm">
          <Button type="button" color="teal" disabled={pending} onClick={() => setDecision("accepted")}>
            Принять
          </Button>
          <Button
            type="button"
            color="red"
            variant="outline"
            disabled={pending}
            onClick={() => setDecision("rejected")}
          >
            Отклонить
          </Button>
        </Group>
      )}
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
