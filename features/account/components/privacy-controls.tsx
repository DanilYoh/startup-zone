"use client";

import {
  deleteAccount,
  type AccountDeletionActionState,
} from "@/features/account/server/actions";
import { Alert, Button, Paper, PasswordInput, Text, TextInput, Title } from "@mantine/core";
import { Download, Trash2 } from "lucide-react";
import { useActionState } from "react";
import styles from "./privacy-controls.module.css";

const initialState: AccountDeletionActionState = { status: "idle" };

export function PrivacyControls() {
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  return (
    <Paper withBorder radius="md" p={0} className={styles.card}>
      <section className={styles.section} aria-labelledby="account-export-heading">
        <div className={styles.sectionIntro}>
          <Text className={styles.eyebrow}>Portable copy</Text>
          <Title order={2} size="h3" id="account-export-heading">Экспорт данных</Title>
        </div>
        <div className={styles.sectionContent}>
          <Text c="dimmed" size="sm" maw={720}>
            Скачайте JSON со сведениями аккаунта, профилем, контактами, стартапами,
            заявками, согласиями и вашими записями аудита.
          </Text>
          <Button
            component="a"
            href="/dashboard/account/export"
            download
            variant="outline"
            leftSection={<Download size={16} aria-hidden="true" />}
            className={styles.exportButton}
          >
            Скачать мои данные
          </Button>
        </div>
      </section>

      <section className={styles.dangerSection} aria-labelledby="account-delete-heading">
        <div className={styles.sectionIntro}>
          <Text className={styles.dangerEyebrow}>Danger zone</Text>
          <Title order={2} size="h3" id="account-delete-heading">Отзыв согласия и удаление аккаунта</Title>
        </div>
        <div className={styles.sectionContent}>
          <Text c="dimmed" size="sm" maw={720}>
            Сервис не может работать без обработки данных аккаунта, поэтому отзыв
            согласия удаляет профиль, стартапы, заявки и Auth-учётную запись. Записи,
            которые нужны только для аудита, сразу теряют email и идентификатор пользователя.
          </Text>
          <Alert color="red" variant="light" title="Действие необратимо" className={styles.dangerAlert}>
            Сначала скачайте экспорт, если он вам нужен. Уже раскрытые другой стороне
            контакты невозможно удалить из её собственных копий.
          </Alert>
          <form action={formAction} className={styles.deleteForm}>
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
              className={styles.deleteButton}
            >
              Отозвать согласие и удалить аккаунт
            </Button>
          </form>
        </div>
      </section>
    </Paper>
  );
}
