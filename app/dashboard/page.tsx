import { LinkButton } from "@/components/link-button";
import { StartupStatusForm } from "@/features/startups/components/startup-status-form";
import { createClient } from "@/lib/supabase/server";
import { startupStageLabels } from "@/lib/validations";
import {
  Badge,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { CheckCircle2, Landmark, Plus, Rocket, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import styles from "./dashboard.module.css";

async function DashboardContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [
    { data: profile, error: profileError },
    { data: startups, error: startupsError },
  ] = await Promise.all([
    supabase.from("profiles").select("role, full_name, headline").eq("id", user.id).maybeSingle(),
    supabase
      .from("startups")
      .select("id, title, slug, one_pager, stage, niche, is_active")
      .eq("founder_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const isFounder = profile?.role === "founder";
  const isInvestor = profile?.role === "investor";
  const startupCount = startups?.length ?? 0;
  const activeStartupCount = startups?.filter((startup) => startup.is_active).length ?? 0;
  const roleCapabilities = isFounder
    ? [
        "Публиковать и редактировать свои стартапы",
        "Управлять видимостью стартапа в каталоге",
        "Рассматривать заявки инвесторов в одном разделе",
        "Принимать или отклонять заявки окончательно",
      ]
    : isInvestor
      ? [
        "Описывать инвестиционную стратегию",
        "Указывать стадии и диапазон чека",
        "Находить опубликованные проекты основателей",
        "Отслеживать каждую инвестиционную заявку",
        ]
      : ["Для работы на площадке нужен активный аккаунт основателя или инвестора."];

  return (
    <div className={styles.dashboardGrid}>
      <Paper component="section" withBorder radius="md" p={0} className={styles.dashboardHero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIdentity}>
            <ThemeIcon size={36} radius="sm" color="brand" variant="light">
              <ShieldCheck className={styles.icon} aria-hidden="true" />
            </ThemeIcon>
            <div>
              <Text className={styles.workspaceLabel}>
                {isFounder ? "Кабинет основателя" : isInvestor ? "Кабинет инвестора" : "Аккаунт площадки"}
              </Text>
              <Title order={1} size="h2" mt={3}>
                {profile?.full_name ? `С возвращением, ${profile.full_name}.` : "Добро пожаловать в Startup Zone."}
              </Title>
              <Text mt="xs" c="dimmed">
                {profile?.headline ?? `Выполнен вход: ${user.email ?? "подтверждённый пользователь"}.`}
              </Text>
            </div>
          </div>
          {isFounder ? (
            <div className={styles.heroActions}>
              <LinkButton href="/dashboard/applications/inbox" variant="default" size="sm">
                Заявки инвесторов
              </LinkButton>
              <LinkButton
                href="/dashboard/startups/new"
                size="sm"
                leftSection={<Plus size={18} aria-hidden="true" />}
              >
                Опубликовать стартап
              </LinkButton>
            </div>
          ) : isInvestor ? (
            <div className={styles.heroActions}>
              <LinkButton href="/dashboard/applications" variant="default" size="sm">
                Мои заявки
              </LinkButton>
              <LinkButton href="/startups" size="sm">
                Каталог стартапов
              </LinkButton>
            </div>
          ) : null}
        </div>

        <div className={styles.security}>
          <div className={styles.securityHeader}>
            <span className={styles.liveDot} aria-hidden="true" />
            <Title order={2} size="h5">Возможности роли</Title>
            {isFounder && (
              <Text size="xs" c="dimmed" ml="auto">
                {activeStartupCount} из {startupCount} проектов опубликовано
              </Text>
            )}
          </div>
          <ul className={styles.securityList}>
            {roleCapabilities.map((item) => (
              <li key={item} className={styles.securityItem}>
                <CheckCircle2 className={styles.successIcon} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Paper>

      <section aria-labelledby="your-startups-heading" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeading}>
            <Text className={styles.sectionLabel}>Workspace</Text>
            <Title order={2} id="your-startups-heading" size="h3">
              {isFounder ? "Ваши стартапы" : "Рабочая область инвестора"}
            </Title>
            <Text size="sm" c="dimmed">
              {isFounder
                ? "Проекты, опубликованные через ваш профиль основателя."
                : "Обновляйте инвестиционный профиль, находите проекты и отслеживайте начатые разговоры."}
            </Text>
          </div>
          {isFounder && <span className={styles.sectionCount}>{startupCount} всего</span>}
        </div>

        {profileError || startupsError ? (
          <Paper withBorder radius="md" p="lg" className={styles.errorState}>
            <Text size="xs" fw={650} tt="uppercase" c="red">Ошибка загрузки</Text>
            <Text size="sm" c="dimmed" mt={6}>Не удалось загрузить стартапы. Обновите страницу.</Text>
          </Paper>
        ) : isInvestor ? (
          <Paper withBorder radius="md" p={0} className={styles.investorPanel}>
            <div className={styles.panelHeader}>
              <Text size="xs" fw={650}>Быстрый старт</Text>
              <span className={styles.panelHeaderText}>2 шага</span>
            </div>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={0}>
              <Stack gap="md" align="flex-start" className={styles.workspaceCard}>
                <ThemeIcon color="brand" variant="light" size={36} radius="sm">
                  <Landmark className={styles.icon} aria-hidden="true" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4">Уточните профиль инвестора</Title>
                  <Text mt={5} size="sm" c="dimmed">
                    Укажите организацию, стратегию, предпочтительные стадии и диапазон чека.
                  </Text>
                </div>
                <LinkButton href="/dashboard/profile" variant="default" size="sm">Редактировать профиль</LinkButton>
              </Stack>
              <Stack gap="md" align="flex-start" className={styles.workspaceCard}>
                <ThemeIcon color="brand" variant="light" size={36} radius="sm">
                  <Rocket className={styles.icon} aria-hidden="true" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4">Найдите подходящий проект</Title>
                  <Text mt={5} size="sm" c="dimmed">
                    Изучайте реальные проекты и отправляйте предметные инвестиционные заявки.
                  </Text>
                </div>
                <LinkButton href="/startups" size="sm">Смотреть активные стартапы</LinkButton>
              </Stack>
            </SimpleGrid>
          </Paper>
        ) : !isFounder ? (
          <Paper withBorder radius="md" p="lg" className={styles.permissionState}>
            <Text size="sm" c="dimmed">Нужен активный профиль основателя или инвестора.</Text>
          </Paper>
        ) : startups?.length ? (
          <div className={styles.startupList}>
            {startups.map((startup) => (
              <Paper
                key={startup.id}
                component="article"
                aria-label={startup.title}
                className={styles.startupCard}
              >
                <div className={styles.startupRow}>
                  <div className={styles.startupSummary}>
                    <div className={styles.startupTitleRow}>
                      <div>
                        <Title order={3} size="h4">{startup.title}</Title>
                        <Text mt={3} className={styles.startupSlug}>/{startup.slug}</Text>
                      </div>
                      <Badge
                        color={startup.is_active ? "teal" : "gray"}
                        variant="light"
                        className={styles.statusBadge}
                      >
                        {startup.is_active ? "Активен" : "Неактивен"}
                      </Badge>
                    </div>
                    <Text className={styles.startupDescription}>{startup.one_pager}</Text>
                    <div className={styles.startupMetadata}>
                      <Badge variant="outline" color="gray">
                        {startupStageLabels[startup.stage]}
                      </Badge>
                      {startup.niche.map((item) => (
                        <Badge key={item} variant="light" color="gray">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className={styles.startupActions}>
                    <LinkButton href={`/dashboard/startups/${startup.id}/edit`} size="compact-sm">
                      Редактировать
                    </LinkButton>
                    <StartupStatusForm id={startup.id} isActive={startup.is_active} />
                    {startup.is_active && (
                      <LinkButton href={`/startups/${startup.slug}`} variant="subtle" size="compact-sm">
                        Открыть публичную страницу
                      </LinkButton>
                    )}
                  </div>
                </div>
              </Paper>
            ))}
          </div>
        ) : (
          <Paper withBorder radius="md" p={{ base: "lg", sm: "xl" }} className={styles.emptyState}>
            <Stack gap="md" align="flex-start">
              <ThemeIcon color="gray" variant="light" size={40} radius="md">
                <Rocket className={styles.icon} aria-hidden="true" />
              </ThemeIcon>
              <div>
                <Title order={3} size="h4">Стартапов пока нет</Title>
                <Text mt={4} size="sm" c="dimmed">
                  Опубликуйте первый проект, чтобы он появился в каталоге площадки.
                </Text>
              </div>
              {isFounder && (
                <LinkButton href="/dashboard/startups/new">
                  Опубликовать первый стартап
                </LinkButton>
              )}
            </Stack>
          </Paper>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton height={288} radius="lg" />}>
      <DashboardContent />
    </Suspense>
  );
}
