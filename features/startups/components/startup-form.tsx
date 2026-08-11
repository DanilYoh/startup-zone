"use client";

import {
  createStartup,
  updateStartup,
  type StartupActionState,
} from "@/features/startups/server/actions";
import type { Tables } from "@/lib/supabase/types";
import { startupStageLabels, startupStages, type StartupInput } from "@/lib/validations";
import {
  Alert,
  Button,
  NativeSelect,
  NumberInput,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useActionState } from "react";
import styles from "./startup-form.module.css";

const initialStartupActionState: StartupActionState = { status: "idle" };

type EditableStartup = Pick<
  Tables<"startups">,
  | "id"
  | "title"
  | "slug"
  | "one_pager"
  | "description"
  | "stage"
  | "niche"
  | "funding_ask"
  | "equity_offered"
  | "deck_url"
  | "website_url"
>;

export function StartupForm({ startup }: { startup?: EditableStartup }) {
  const action = startup ? updateStartup : createStartup;
  const [state, formAction, pending] = useActionState(action, initialStartupActionState);
  const fieldError = (field: keyof StartupInput) => state.errors?.[field]?.[0];

  return (
    <Paper withBorder radius="md" p={{ base: "md", sm: "xl" }}>
      <Stack gap="xl">
        <div>
          <Title order={1} size="h2">
            {startup ? "Редактирование стартапа" : "Публикация стартапа"}
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            Добавьте ключевую информацию, по которой инвестор сможет оценить проект.
          </Text>
        </div>
        <form action={formAction} className={styles.form}>
          {startup && <input type="hidden" name="startup_id" value={startup.id} />}
          <div className={styles.fields}>
            <TextInput
              className={styles.wideField}
              id="title"
              name="title"
              label="Название стартапа"
              defaultValue={startup?.title ?? ""}
              minLength={3}
              maxLength={80}
              required
              error={fieldError("title")}
            />
            <TextInput
              id="slug"
              name="slug"
              label="Адрес страницы"
              description="Латинские строчные буквы, цифры и дефисы."
              placeholder="climate-lens"
              defaultValue={startup?.slug ?? ""}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              minLength={3}
              maxLength={60}
              required
              error={fieldError("slug")}
            />
            <NativeSelect
              id="stage"
              name="stage"
              label="Стадия"
              data={[
                { value: "", label: "Выберите стадию", disabled: true },
                ...startupStages.map((stage) => ({
                  value: stage,
                  label: startupStageLabels[stage],
                })),
              ]}
              defaultValue={startup?.stage ?? ""}
              required
              error={fieldError("stage")}
            />
            <TextInput
              className={styles.wideField}
              id={startup ? "edit-one_pager" : "one_pager"}
              name="one_pager"
              label="Краткое описание"
              defaultValue={startup?.one_pager ?? ""}
              minLength={10}
              maxLength={240}
              required
              error={fieldError("one_pager")}
            />
            <Textarea
              className={styles.wideField}
              id="description"
              name="description"
              label="Подробное описание"
              defaultValue={startup?.description ?? ""}
              rows={7}
              minLength={50}
              maxLength={5000}
              required
              error={fieldError("description")}
            />
            <TextInput
              className={styles.wideField}
              id="niche"
              name="niche"
              label="Ниши"
              description="Укажите до восьми ниш через запятую."
              placeholder="ClimateTech, B2B SaaS"
              defaultValue={startup?.niche.join(", ") ?? ""}
              required
              error={fieldError("niche")}
            />
            <NumberInput
              id="funding_ask"
              name="funding_ask"
              label="Требуемая сумма (₽)"
              defaultValue={startup?.funding_ask ?? undefined}
              min={1}
              max={1_000_000_000}
              decimalScale={0}
              allowNegative={false}
              thousandSeparator=" "
              error={fieldError("funding_ask")}
            />
            <NumberInput
              id="equity_offered"
              name="equity_offered"
              label="Предлагаемая доля (%)"
              defaultValue={startup?.equity_offered ?? undefined}
              min={0}
              max={100}
              decimalScale={1}
              allowNegative={false}
              rightSection="%"
              error={fieldError("equity_offered")}
            />
            <TextInput
              id="website_url"
              name="website_url"
              type="url"
              label="Сайт проекта"
              placeholder="https://example.com"
              defaultValue={startup?.website_url ?? ""}
              error={fieldError("website_url")}
            />
            <TextInput
              id="deck_url"
              name="deck_url"
              type="url"
              label="Ссылка на презентацию"
              description="Прямой PDF или ссылка Google Drive, Google Slides, DocSend либо Pitch."
              placeholder="https://example.com/deck.pdf"
              defaultValue={startup?.deck_url ?? ""}
              error={fieldError("deck_url")}
            />
          </div>
          {state.status === "error" && (
            <Alert color="red" variant="light" role="alert">
              {state.message}
            </Alert>
          )}
          <div className={styles.actions}>
            <Button type="submit" size="md" loading={pending}>
              {startup ? "Сохранить изменения" : "Опубликовать стартап"}
            </Button>
          </div>
        </form>
      </Stack>
    </Paper>
  );
}
