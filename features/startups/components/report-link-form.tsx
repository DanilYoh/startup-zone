"use client";

import {
  reportStartupLink,
  type LinkReportActionState,
} from "@/features/startups/server/report-actions";
import { Alert, Button, NativeSelect, Stack } from "@mantine/core";
import { useActionState } from "react";

const initialState: LinkReportActionState = { status: "idle" };

export function ReportLinkForm({
  linkKind,
  startupId,
}: {
  linkKind: "website" | "deck";
  startupId: number;
}) {
  const [state, formAction, pending] = useActionState(reportStartupLink, initialState);

  return (
    <details>
      <summary>Сообщить о ссылке</summary>
      <form action={formAction}>
        <Stack gap="xs" mt="xs">
          <input type="hidden" name="startup_id" value={startupId} />
          <input type="hidden" name="link_kind" value={linkKind} />
          <NativeSelect
            name="reason"
            aria-label="Причина жалобы"
            defaultValue="phishing"
            data={[
              { value: "phishing", label: "Фишинг или подмена" },
              { value: "malware", label: "Вредоносный файл" },
              { value: "misleading", label: "Вводящая в заблуждение ссылка" },
              { value: "privacy", label: "Нарушение приватности" },
              { value: "other", label: "Другая причина" },
            ]}
          />
          <Button type="submit" variant="subtle" size="compact-sm" loading={pending}>
            Отправить жалобу
          </Button>
          {state.message && (
            <Alert
              color={state.status === "success" ? "teal" : "red"}
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.message}
            </Alert>
          )}
        </Stack>
      </form>
    </details>
  );
}
