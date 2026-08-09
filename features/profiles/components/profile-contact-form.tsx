"use client";

import {
  updateProfileContact,
  type ProfileContactActionState,
} from "@/features/profiles/server/actions";
import type { ProfileContactInput } from "@/features/profiles/schemas";
import { Alert, Button, Checkbox, Paper, SimpleGrid, Stack, Text, TextInput, Title } from "@mantine/core";
import { useActionState } from "react";
import styles from "./profile-form.module.css";

const initialState: ProfileContactActionState = { status: "idle" };

type ProfileContactFormProps = {
  accountEmail: string | null;
  contact: {
    contact_email: string | null;
    contact_url: string | null;
    sharing_enabled: boolean;
  };
};

export function ProfileContactForm({ accountEmail, contact }: ProfileContactFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileContact, initialState);
  const fieldError = (field: keyof ProfileContactInput) => state.errors?.[field]?.[0];

  return (
    <Paper withBorder radius="md" p={{ base: "md", sm: "xl" }} className={styles.card}>
      <form action={formAction}>
        <Stack gap="lg">
          <div>
            <Title order={2} size="h3">Accepted contact exchange</Title>
            <Text size="sm" c="dimmed" mt={5} maw={720}>
              These details stay private. The marketplace reveals them only to the founder or
              investor on the other side of an accepted interest request.
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              id="profile-contact-email"
              name="contact_email"
              type="email"
              label="Contact email"
              description="Use the address where you want accepted matches to reach you."
              defaultValue={contact.contact_email ?? accountEmail ?? ""}
              autoComplete="email"
              maxLength={254}
              error={fieldError("contact_email")}
            />
            <TextInput
              id="profile-contact-url"
              name="contact_url"
              type="url"
              label="Contact link"
              description="Optional Telegram, VK, scheduling, or other HTTPS link."
              placeholder="https://t.me/your-handle"
              defaultValue={contact.contact_url ?? ""}
              maxLength={2_048}
              error={fieldError("contact_url")}
            />
          </SimpleGrid>

          <Checkbox
            name="sharing_enabled"
            label="Share these details after I accept an interest request or my interest request is accepted."
            description="You can disable future sharing at any time. Existing recipients may already have saved details previously shown to them."
            defaultChecked={contact.sharing_enabled}
          />
          {fieldError("sharing_enabled") && (
            <Text size="xs" c="red">{fieldError("sharing_enabled")}</Text>
          )}

          {state.message && (
            <Alert
              color={state.status === "success" ? "teal" : "red"}
              variant="light"
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.message}
            </Alert>
          )}

          <Button type="submit" loading={pending} className={styles.submit}>
            Save contact settings
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
