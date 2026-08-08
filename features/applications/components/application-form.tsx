"use client";

import {
  createApplication,
  type ApplicationActionState,
} from "@/features/applications/server/actions";
import { Alert, Button, Stack, Textarea } from "@mantine/core";
import { useActionState } from "react";

const initialState: ApplicationActionState = { status: "idle" };

export function ApplicationForm({
  startupId,
  role,
}: {
  startupId: number;
  role: "specialist" | "investor";
}) {
  const [state, formAction, pending] = useActionState(createApplication, initialState);

  if (state.status === "success") {
    return <Alert color="teal" role="status">{state.message}</Alert>;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="startup_id" value={startupId} />
      <Stack gap="md" align="flex-start">
        <Textarea
          name="message"
          label={role === "specialist" ? "Message to the founder" : "Investment interest"}
          description={
            role === "specialist"
              ? "Explain how your experience can help this team."
              : "Describe your interest and the contact you would like to request."
          }
          minRows={5}
          autosize
          required
          minLength={20}
          maxLength={2_000}
          error={state.errors?.message?.[0]}
          className="w-full"
        />
        {state.message && <Alert color="red" role="alert">{state.message}</Alert>}
        <Button type="submit" loading={pending}>
          {role === "specialist" ? "Send application" : "Send interest"}
        </Button>
      </Stack>
    </form>
  );
}

