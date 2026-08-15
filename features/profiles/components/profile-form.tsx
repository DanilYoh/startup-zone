"use client";

import {
  updateProfile,
  type ProfileActionState,
} from "@/features/profiles/server/actions";
import type { ProfileInput } from "@/features/profiles/schemas";
import type { MarketplaceRole, StartupStage } from "@/lib/domain-types";
import { startupStageLabels, startupStages } from "@/lib/validations";
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useActionState } from "react";
import styles from "./profile-form.module.css";

const initialState: ProfileActionState = { status: "idle" };

const roleLabels: Record<MarketplaceRole, string> = {
  founder: "Основатель",
  investor: "Инвестор",
};

const roleIntroductions: Record<MarketplaceRole, string> = {
  founder: "Расскажите об опыте и взгляде на рынок, которые стоят за вашими стартапами.",
  investor: "Покажите стратегию, предпочтительные стадии и типичный чек до первого обращения.",
};

type ProfileFormProps = {
  email: string | null;
  profile: {
    role: MarketplaceRole;
    full_name: string | null;
    headline: string | null;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    linkedin_url: string | null;
    founder_experience: string | null;
    investor_organization: string | null;
    investment_thesis: string | null;
    preferred_stages: StartupStage[];
    ticket_min: number | null;
    ticket_max: number | null;
    website_url: string | null;
  };
};

export function ProfileForm({ email, profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const fieldError = (field: keyof ProfileInput) => state.errors?.[field]?.[0];

  return (
    <Paper withBorder radius="md" p={0} className={styles.card}>
      <Stack gap={0}>
        <div className={styles.profileHero}>
          <Group align="center" wrap="nowrap">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name ?? email ?? "Profile"}
              size={72}
              radius="xl"
            />
            <div>
              <Text className={styles.roleLabel}>Профиль: {roleLabels[profile.role].toLowerCase()}</Text>
              <Title order={2} size="h3">Полезный профиль отвечает на следующий вопрос.</Title>
              <Text size="sm" c="dimmed" mt={5}>
                {roleIntroductions[profile.role]}
              </Text>
            </div>
          </Group>
          <div className={styles.blueprint}>
            <Text size="xs" fw={700} tt="uppercase" className={styles.blueprintLabel}>
              Структура профиля
            </Text>
            <Text size="sm">
              {profile.role === "founder"
                ? "Личность → компетентность основателя → контекст стартапа → проверяемые ссылки"
                : "Личность → организация → инвестиционная стратегия → стадии и чек → проверяемые ссылки"}
            </Text>
          </div>
        </div>

        <form action={formAction} className={styles.form}>
          <Stack gap={0}>
            <section className={styles.formSection} aria-labelledby="profile-identity-heading">
              <div className={styles.sectionIntro}>
                <Title order={3} size="h4" id="profile-identity-heading">Основная информация</Title>
                <Text size="sm" c="dimmed" mt={4}>Факты, по которым другие участники понимают, кто вы.</Text>
              </div>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  id="profile-full-name"
                  name="full_name"
                  label="Имя и фамилия"
                  defaultValue={profile.full_name ?? ""}
                  autoComplete="name"
                  required
                  error={fieldError("full_name")}
                />
                <TextInput
                  id="profile-headline"
                  name="headline"
                  label="Профессиональный заголовок"
                  placeholder={profile.role === "founder" ? "Основатель · Климатическая инфраструктура" : "Партнёр · B2B на seed-стадии"}
                  defaultValue={profile.headline ?? ""}
                  maxLength={120}
                  error={fieldError("headline")}
                />
                <TextInput
                  id="profile-location"
                  name="location"
                  label="Город"
                  defaultValue={profile.location ?? ""}
                  autoComplete="address-level2"
                  error={fieldError("location")}
                />
                <TextInput label="Электронная почта" value={email ?? "Недоступно"} readOnly disabled />
                <TextInput
                  label="Роль"
                  value={roleLabels[profile.role]}
                  readOnly
                  disabled
                  description="Выбрана при регистрации и не изменяется."
                />
              </SimpleGrid>
              <Textarea
                id="profile-bio"
                name="bio"
                label="О себе"
                description="Кратко о вашем опыте и взгляде на рынок."
                defaultValue={profile.bio ?? ""}
                minRows={4}
                autosize
                error={fieldError("bio")}
              />
            </section>

            {profile.role === "founder" ? (
              <section className={styles.formSection} aria-labelledby="founder-credibility-heading">
                <div className={styles.sectionIntro}>
                  <Title order={3} size="h4" id="founder-credibility-heading">Опыт основателя</Title>
                  <Text size="sm" c="dimmed" mt={4}>Добавьте контекст, которого нет в карточке стартапа.</Text>
                </div>
                <Textarea
                  id="profile-founder-experience"
                  name="founder_experience"
                  label="Релевантный опыт"
                  description="Отраслевая экспертиза, прошлые продукты, доступ к клиентам или важное наблюдение."
                  aria-describedby="founder-experience-visibility"
                  defaultValue={profile.founder_experience ?? ""}
                  minRows={5}
                  autosize
                  maxLength={1_200}
                  error={fieldError("founder_experience")}
                />
                <Text id="founder-experience-visibility" size="xs" c="dimmed">
                  Это профессиональное описание показывается рядом с активными стартапами.
                </Text>
              </section>
            ) : (
              <section className={styles.formSection} aria-labelledby="investor-fit-heading">
                <div className={styles.sectionIntro}>
                  <Title order={3} size="h4" id="investor-fit-heading">Инвестиционный профиль</Title>
                  <Text size="sm" c="dimmed" mt={4}>Помогите основателям оценить соответствие до начала разговора.</Text>
                </div>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    id="profile-investor-organization"
                    name="investor_organization"
                    label="Фонд или организация"
                    defaultValue={profile.investor_organization ?? ""}
                    maxLength={120}
                    error={fieldError("investor_organization")}
                  />
                  <TextInput
                    id="profile-website-url"
                    name="website_url"
                    type="url"
                    label="Сайт организации"
                    placeholder="https://example.com"
                    defaultValue={profile.website_url ?? ""}
                    error={fieldError("website_url")}
                  />
                </SimpleGrid>
                <Textarea
                  id="profile-investment-thesis"
                  name="investment_thesis"
                  label="Инвестиционная стратегия"
                  description="Во что вы инвестируете, почему сейчас и какой стартап вам подходит."
                  defaultValue={profile.investment_thesis ?? ""}
                  minRows={5}
                  autosize
                  maxLength={1_500}
                  error={fieldError("investment_thesis")}
                />
                <fieldset className={styles.stageFieldset}>
                  <legend>Предпочтительные стадии</legend>
                  <Text size="xs" c="dimmed" mb="sm">Выберите все стадии, которые вы рассматриваете.</Text>
                  <div className={styles.stageGrid}>
                    {startupStages.map((stage) => (
                      <Checkbox
                        key={stage}
                        name="preferred_stages"
                        value={stage}
                        label={startupStageLabels[stage]}
                        defaultChecked={profile.preferred_stages.includes(stage)}
                      />
                    ))}
                  </div>
                  {fieldError("preferred_stages") && (
                    <Text size="xs" c="red" mt="xs">{fieldError("preferred_stages")}</Text>
                  )}
                </fieldset>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <NumberInput
                    id="profile-ticket-min"
                    name="ticket_min"
                    label="Минимальный чек (₽)"
                    defaultValue={profile.ticket_min ?? undefined}
                    min={1}
                    max={1_000_000_000}
                    decimalScale={0}
                    allowNegative={false}
                    thousandSeparator=" "
                    error={fieldError("ticket_min")}
                  />
                  <NumberInput
                    id="profile-ticket-max"
                    name="ticket_max"
                    label="Максимальный чек (₽)"
                    defaultValue={profile.ticket_max ?? undefined}
                    min={1}
                    max={1_000_000_000}
                    decimalScale={0}
                    allowNegative={false}
                    thousandSeparator=" "
                    error={fieldError("ticket_max")}
                  />
                </SimpleGrid>
              </section>
            )}

            <section className={styles.formSection} aria-labelledby="profile-links-heading">
              <div className={styles.sectionIntro}>
                <Title order={3} size="h4" id="profile-links-heading">Проверяемые ссылки</Title>
                <Text size="sm" c="dimmed" mt={4}>Добавьте публичные ссылки, которые подтверждают вашу личность.</Text>
              </div>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  id="profile-avatar-url"
                  name="avatar_url"
                  type="url"
                  label="Ссылка на фотографию"
                  description="Только публичный HTTPS-адрес. Локальные и служебные сети запрещены."
                  defaultValue={profile.avatar_url ?? ""}
                  error={fieldError("avatar_url")}
                />
                <TextInput
                  id="profile-linkedin-url"
                  name="linkedin_url"
                  type="url"
                  label="Ссылка на LinkedIn"
                  placeholder="https://www.linkedin.com/in/your-name"
                  defaultValue={profile.linkedin_url ?? ""}
                  error={fieldError("linkedin_url")}
                />
              </SimpleGrid>
            </section>

            <div className={styles.formFooter}>
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
                Сохранить профиль
              </Button>
            </div>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
