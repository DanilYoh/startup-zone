import { LinkButton } from "@/components/link-button";
import { PaginationNav } from "@/components/pagination-nav";
import { formatMarketCurrency, russianPlural } from "@/lib/market";
import {
  hasStartupDirectoryFilters,
  parseStartupDirectoryFilters,
  startupDirectoryHref,
  type StartupDirectorySearchParams,
} from "@/lib/startup-directory";
import { listActiveStartups } from "@/lib/supabase/startups";
import { startupStageLabels, startupStages } from "@/lib/validations";
import {
  Alert,
  Badge,
  Button,
  Group,
  NativeSelect,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { ArrowRight, MapPin, Rocket, Search, SearchX, ServerOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import styles from "./startups-supabase.module.css";

export const metadata: Metadata = {
  title: "Каталог стартапов",
  description: "Активные стартапы, опубликованные основателями Startup Zone.",
};

type StartupsPageProps = {
  searchParams: Promise<StartupDirectorySearchParams>;
};

function DirectorySkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" aria-label="Загрузка стартапов">
      {[1, 2, 3, 4].map((item) => (
        <Skeleton key={item} height={250} radius="lg" />
      ))}
    </SimpleGrid>
  );
}

function DirectoryNotice({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Rocket;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper withBorder radius="lg" p={{ base: "lg", sm: "xl" }}>
      <Stack gap="md" align="flex-start">
        <ThemeIcon size={44} radius="md" variant="light" color="gray">
          <Icon size={21} aria-hidden="true" />
        </ThemeIcon>
        <div>
          <Title order={2} size="h3">
            {title}
          </Title>
          <Text mt="xs" c="dimmed" maw={620}>
            {children}
          </Text>
        </div>
      </Stack>
    </Paper>
  );
}

async function DirectoryContent({ searchParams }: StartupsPageProps) {
  const filters = parseStartupDirectoryFilters(await searchParams);
  const result = await listActiveStartups(filters);

  return (
    <Stack gap="xl">
      <Paper component="form" action="/startups" withBorder radius="md" p="lg" className={styles.filterPanel}>
        <div className={styles.filterGrid}>
          <TextInput
            name="q"
            label="Поиск по названию"
            placeholder="Climate Lens"
            defaultValue={filters.query}
            maxLength={80}
            leftSection={<Search size={16} aria-hidden="true" />}
          />
          <NativeSelect
            id="directory-stage"
            name="stage"
            label="Стадия"
            defaultValue={filters.stage ?? ""}
            data={[
              { value: "", label: "Все стадии" },
              ...startupStages.map((stage) => ({
                value: stage,
                label: startupStageLabels[stage],
              })),
            ]}
          />
          <TextInput
            id="directory-niche"
            name="niche"
            label="Точная ниша"
            placeholder="ClimateTech"
            defaultValue={filters.niche}
            maxLength={40}
          />
          <Button type="submit">Применить фильтры</Button>
        </div>
        {hasStartupDirectoryFilters(filters) && (
          <Group mt="md" justify="space-between">
            <Text size="sm" c="dimmed">
              Показаны активные стартапы по выбранным фильтрам.
            </Text>
            <LinkButton href="/startups" variant="subtle" size="compact-sm">
              Сбросить фильтры
            </LinkButton>
          </Group>
        )}
      </Paper>

      {result.status === "unconfigured" ? (
        <DirectoryNotice icon={ServerOff} title="Каталог недоступен в деморежиме">
          Подключите локальное или тестовое окружение Supabase, чтобы увидеть сохранённые проекты.
          Публичная демоверсия не подменяет данные статическими карточками.
        </DirectoryNotice>
      ) : result.status === "error" ? (
        <Alert color="red" variant="light" title="Не удалось загрузить стартапы" role="alert">
          Обновите страницу. Если ошибка сохраняется, сервис данных может быть недоступен.
        </Alert>
      ) : result.data.items.length === 0 ? (
        <DirectoryNotice
          icon={hasStartupDirectoryFilters(filters) ? SearchX : Rocket}
          title={
            result.data.total > 0
              ? "На этой странице нет стартапов"
              : hasStartupDirectoryFilters(filters)
                ? "Подходящих стартапов не найдено"
                : "Стартапов пока нет"
          }
        >
          {result.data.total > 0 ? (
            <Link href={startupDirectoryHref(filters, 1)}>Вернуться на первую страницу.</Link>
          ) : hasStartupDirectoryFilters(filters) ? (
            "Попробуйте другое название или стадию либо уберите фильтр по нише."
          ) : (
            "Активные проекты появятся здесь после публикации основателями."
          )}
        </DirectoryNotice>
      ) : (
        <section aria-labelledby="startup-results-heading">
          <Group justify="space-between" align="flex-end" mb="lg">
            <div>
              <Title order={2} id="startup-results-heading" size="h3">
                Активные стартапы
              </Title>
              <Text mt={4} size="sm" c="dimmed" aria-live="polite">
                {result.data.total} {russianPlural(result.data.total, "стартап", "стартапа", "стартапов")}
              </Text>
            </div>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {result.data.items.map((startup) => (
              <Paper component="article" key={startup.id} withBorder radius="md" p="lg" className={styles.startupCard}>
                <Stack gap="md" h="100%">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <div>
                      <Title order={3} size="h4">
                        <Link
                          href={`/startups/${startup.slug}`}
                          className={styles.startupLink}
                        >
                          {startup.title}
                        </Link>
                      </Title>
                      {startup.founder?.full_name && (
                        <Text mt={4} size="sm" c="dimmed">
                          Основатель: {startup.founder.full_name}
                        </Text>
                      )}
                    </div>
                    <Badge variant="light">{startupStageLabels[startup.stage]}</Badge>
                  </Group>

                  <Text c="dimmed" lh={1.65}>
                    {startup.one_pager}
                  </Text>

                  <Group gap="xs">
                    {startup.niche.map((item) => (
                      <Badge key={item} variant="outline" color="gray">
                        {item}
                      </Badge>
                    ))}
                  </Group>

                  <div className={styles.cardFooter}>
                    <Group justify="space-between" align="center">
                      <div>
                        {startup.funding_ask !== null && (
                          <Text size="sm" fw={600}>
                            Требуется {formatMarketCurrency(startup.funding_ask)}
                          </Text>
                        )}
                        {startup.founder?.location && (
                          <Group gap={5} mt={4} wrap="nowrap">
                            <MapPin size={14} aria-hidden="true" />
                            <Text size="xs" c="dimmed">
                              {startup.founder.location}
                            </Text>
                          </Group>
                        )}
                      </div>
                      <LinkButton
                        href={`/startups/${startup.slug}`}
                        variant="subtle"
                        rightSection={<ArrowRight size={15} aria-hidden="true" />}
                      >
                        Открыть проект
                      </LinkButton>
                    </Group>
                  </div>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
          <PaginationNav
            page={result.data.page}
            pageCount={result.data.pageCount}
            total={result.data.total}
            itemLabel={russianPlural(result.data.total, "стартап", "стартапа", "стартапов")}
            previousHref={
              result.data.page > 1
                ? startupDirectoryHref(filters, result.data.page - 1)
                : undefined
            }
            nextHref={
              result.data.page < result.data.pageCount
                ? startupDirectoryHref(filters, result.data.page + 1)
                : undefined
            }
          />
        </section>
      )}
    </Stack>
  );
}

export default function StartupsPage({ searchParams }: StartupsPageProps) {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.heroIntro}>
        <Badge variant="light" size="lg">
          Стартапы и инвесторы
        </Badge>
        <Title order={1} mt="md" className={styles.textBalance} fz={{ base: 40, sm: 52 }} lh={1.08}>
          Найдите стартап, который соответствует вашей стратегии.
        </Title>
        <Text mt="lg" size="lg" c="dimmed" lh={1.7}>
          Изучайте активные проекты, оценивайте стадию и нишу, а затем открывайте полную карточку
          перед отправкой инвестиционной заявки.
        </Text>
      </div>

      <Suspense fallback={<DirectorySkeleton />}>
        <DirectoryContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
