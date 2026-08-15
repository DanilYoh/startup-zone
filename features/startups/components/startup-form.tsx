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
    <Paper withBorder radius="md" p={0} className={styles.card}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{startup ? "Startup / Edit" : "Startup / New"}</Text>
          <Title order={1} size="h2">
            {startup ? "Редактирование стартапа" : "Публикация стартапа"}
          </Title>
          <Text c="dimmed" size="sm" mt={5} maw={620}>
            Добавьте ключевую информацию, по которой инвестор сможет оценить проект.
          </Text>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.headerDot} aria-hidden="true" />
          {startup ? "Изменения применятся к карточке" : "После сохранения проект появится в каталоге"}
        </div>
      </header>

      <form action={formAction} className={styles.form}>
        {startup && <input type="hidden" name="startup_id" value={startup.id} />}

        <section className={styles.formSection} aria-labelledby="startup-basics-heading">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionIndex}>01</span>
            <Title order={2} size="h4" id="startup-basics-heading">Основное</Title>
            <Text size="sm" c="dimmed">Название, адрес и текущая стадия проекта.</Text>
          </div>
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
          </div>
        </section>

        <section className={styles.formSection} aria-labelledby="startup-positioning-heading">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionIndex}>02</span>
            <Title order={2} size="h4" id="startup-positioning-heading">Позиционирование</Title>
            <Text size="sm" c="dimmed">Проблема, решение и рынок — от краткого тезиса к деталям.</Text>
          </div>
          <div className={styles.fields}>
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
          </div>
        </section>

        <section className={styles.formSection} aria-labelledby="startup-round-heading">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionIndex}>03</span>
            <Title order={2} size="h4" id="startup-round-heading">Раунд</Title>
            <Text size="sm" c="dimmed">Ориентиры по сумме и предлагаемой доле.</Text>
          </div>
          <div className={styles.fields}>
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
          </div>
        </section>

        <section className={styles.formSection} aria-labelledby="startup-materials-heading">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionIndex}>04</span>
            <Title order={2} size="h4" id="startup-materials-heading">Материалы</Title>
            <Text size="sm" c="dimmed">Публичные ссылки для проверки проекта.</Text>
          </div>
          <div className={styles.fields}>
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
        </section>

        <div className={styles.actions}>
          {state.status === "error" ? (
            <Alert color="red" variant="light" role="alert">
              {state.message}
            </Alert>
          ) : (
            <Text className={styles.submitHint}>Проверьте публичные ссылки перед сохранением.</Text>
          )}
          <Button type="submit" size="md" loading={pending}>
            {startup ? "Сохранить изменения" : "Опубликовать стартап"}
          </Button>
        </div>
      </form>
    </Paper>
  );
}
