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
            <Title order={2} size="h3">Контакты после принятия заявки</Title>
            <Text size="sm" c="dimmed" mt={5} maw={720}>
              Эти данные остаются приватными. Площадка покажет их только основателю или инвестору
              с другой стороны принятой инвестиционной заявки.
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              id="profile-contact-email"
              name="contact_email"
              type="email"
              label="Электронная почта для связи"
              description="Укажите адрес, по которому с вами смогут связаться после принятия заявки."
              defaultValue={contact.contact_email ?? accountEmail ?? ""}
              autoComplete="email"
              maxLength={254}
              error={fieldError("contact_email")}
            />
            <TextInput
              id="profile-contact-url"
              name="contact_url"
              type="url"
              label="Ссылка для связи"
              description="Необязательная HTTPS-ссылка на Telegram, VK или календарь."
              placeholder="https://t.me/your-handle"
              defaultValue={contact.contact_url ?? ""}
              maxLength={2_048}
              error={fieldError("contact_url")}
            />
          </SimpleGrid>

          <Checkbox
            name="sharing_enabled"
            label="Показывать эти данные после того, как я приму заявку или мою заявку примут."
            description="Будущий доступ можно отключить. Получатели могли сохранить уже показанные им данные."
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
            Сохранить настройки контактов
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
