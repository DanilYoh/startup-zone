"use client";

import {
  deleteAccount,
  type AccountDeletionActionState,
} from "@/features/account/server/actions";
import { Alert, Button, Divider, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { Download, Trash2 } from "lucide-react";
import { useActionState } from "react";

const initialState: AccountDeletionActionState = { status: "idle" };

export function PrivacyControls() {
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  return (
    <Paper withBorder radius="md" p={{ base: "md", sm: "xl" }}>
      <Stack gap="xl">
        <section>
          <Title order={2} size="h3">Экспорт данных</Title>
          <Text c="dimmed" size="sm" mt={5} maw={720}>
            Скачайте JSON со сведениями аккаунта, профилем, контактами, стартапами,
            заявками, согласиями и вашими записями аудита.
          </Text>
          <Button
            component="a"
            href="/dashboard/account/export"
            download
            variant="outline"
            mt="md"
            leftSection={<Download size={16} aria-hidden="true" />}
          >
            Скачать мои данные
          </Button>
        </section>

        <Divider />

        <section>
          <Title order={2} size="h3">Отзыв согласия и удаление аккаунта</Title>
          <Text c="dimmed" size="sm" mt={5} maw={720}>
            Сервис не может работать без обработки данных аккаунта, поэтому отзыв
            согласия удаляет профиль, стартапы, заявки и Auth-учётную запись. Записи,
            которые нужны только для аудита, сразу теряют email и идентификатор пользователя.
          </Text>
          <Alert color="red" variant="light" mt="md" title="Действие необратимо">
            Сначала скачайте экспорт, если он вам нужен. Уже раскрытые другой стороне
            контакты невозможно удалить из её собственных копий.
          </Alert>
          <form action={formAction}>
            <Stack gap="md" mt="md" maw={520}>
              <PasswordInput
                name="current_password"
                label="Текущий пароль"
                autoComplete="current-password"
                required
              />
              <TextInput
                name="confirmation"
                label="Введите УДАЛИТЬ для подтверждения"
                autoComplete="off"
                required
              />
              {state.message && <Alert color="red" role="alert">{state.message}</Alert>}
              <Button
                type="submit"
                color="red"
                loading={pending}
                leftSection={<Trash2 size={16} aria-hidden="true" />}
              >
                Отозвать согласие и удалить аккаунт
              </Button>
            </Stack>
          </form>
        </section>
      </Stack>
    </Paper>
  );
}
