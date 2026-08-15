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
import {
  ArrowRight,
  CircleDot,
  MapPin,
  Rocket,
  Search,
  SearchX,
  ServerOff,
  SlidersHorizontal,
} from "lucide-react";
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
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" aria-label="Загрузка стартапов">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Skeleton key={item} height={286} radius="md" />
      ))}
    </SimpleGrid>
  );
}

function startupMark(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const mark = words.length > 1
    ? words.slice(0, 2).map((word) => Array.from(word)[0]).join("")
    : Array.from(title).slice(0, 2).join("");

  return mark.toLocaleUpperCase("ru-RU");
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
    <Paper withBorder radius="lg" p={{ base: "lg", sm: "xl" }} className={styles.noticePanel}>
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
        <div className={styles.filterPanelHeader}>
          <div className={styles.filterPanelTitle}>
            <span className={styles.filterIcon} aria-hidden="true">
              <SlidersHorizontal size={16} />
            </span>
            <div>
              <Text fw={600}>Фильтры каталога</Text>
              <Text size="xs" c="dimmed">Сузьте выборку по ключевым параметрам сделки.</Text>
            </div>
          </div>
          {hasStartupDirectoryFilters(filters) && (
            <LinkButton href="/startups" variant="subtle" size="compact-sm">
              Сбросить фильтры
            </LinkButton>
          )}
        </div>
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
          <div className={styles.activeFilterNote}>
            <Text size="xs" c="dimmed">
              Показаны активные стартапы по выбранным фильтрам.
            </Text>
          </div>
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
          <div className={styles.resultsToolbar}>
            <div>
              <Title order={2} id="startup-results-heading" size="h3">
                Проекты в каталоге
              </Title>
              <Text mt={4} size="sm" c="dimmed" aria-live="polite">
                {result.data.total} {russianPlural(result.data.total, "стартап", "стартапа", "стартапов")}
              </Text>
            </div>
            <span className={styles.sortStatus}>
              <CircleDot size={13} aria-hidden="true" />
              Сначала новые
            </span>
          </div>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {result.data.items.map((startup) => (
              <Paper component="article" key={startup.id} withBorder radius="md" p={0} className={styles.startupCard}>
                <div className={styles.cardTop}>
                  <div className={styles.cardHeading}>
                    <span className={styles.startupMark} aria-hidden="true">
                      {startupMark(startup.title)}
                    </span>
                    <div>
                      <Title order={3} size="h4" className={styles.cardTitle}>
                        <Link
                          href={`/startups/${startup.slug}`}
                          className={styles.startupLink}
                        >
                          {startup.title}
                        </Link>
                      </Title>
                      {startup.founder?.full_name && (
                        <Text mt={3} size="xs" c="dimmed">
                          {startup.founder.full_name}
                        </Text>
                      )}
                    </div>
                  </div>
                  <Badge variant="light" className={styles.stageBadge}>{startupStageLabels[startup.stage]}</Badge>
                </div>

                <div className={styles.cardBody}>
                  <Text c="dimmed" lh={1.6} size="sm" className={styles.startupSummary}>
                    {startup.one_pager}
                  </Text>

                  <div className={styles.nicheList}>
                    {startup.niche.map((item) => (
                      <Badge key={item} variant="outline" color="gray" size="sm">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardMetrics}>
                    <div>
                      <Text component="span" className={styles.metricLabel}>Раунд</Text>
                      <Text size="sm" fw={650}>
                        {startup.funding_ask !== null
                          ? formatMarketCurrency(startup.funding_ask)
                          : "Не указан"}
                        {startup.equity_offered !== null && (
                          <Text component="span" size="xs" c="dimmed"> · {startup.equity_offered}%</Text>
                        )}
                      </Text>
                    </div>
                    <div>
                      <Text component="span" className={styles.metricLabel}>Локация</Text>
                      {startup.founder?.location ? (
                        <span className={styles.locationValue}>
                          <MapPin size={12} aria-hidden="true" />
                          {startup.founder.location}
                        </span>
                      ) : (
                        <Text size="sm" c="dimmed">Не указана</Text>
                      )}
                    </div>
                  </div>
                  <div className={styles.cardAction}>
                    <LinkButton
                      href={`/startups/${startup.slug}`}
                      variant="subtle"
                      rightSection={<ArrowRight size={15} aria-hidden="true" />}
                    >
                      Открыть проект
                    </LinkButton>
                  </div>
                </div>
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
      <div className={styles.directoryHero}>
        <div className={styles.heroIntro}>
          <p className={styles.pageEyebrow}>
            <CircleDot size={13} aria-hidden="true" />
            Открытый каталог
          </p>
          <Title order={1} mt="md" className={styles.textBalance} fz={{ base: 40, sm: 54 }} lh={1.03}>
            Найдите проект, который совпадает с вашей стратегией.
          </Title>
          <Text mt="lg" size="lg" c="dimmed" lh={1.65}>
            Сравнивайте стадию, нишу и параметры раунда. Полная карточка помогает принять
            решение до отправки инвестиционной заявки.
          </Text>
        </div>
        <dl className={styles.directoryLedger} aria-label="О каталоге">
          <div><dt>Формат</dt><dd>Открытый каталог</dd></div>
          <div><dt>Источник</dt><dd>Данные основателей</dd></div>
          <div><dt>Порядок</dt><dd>Сначала новые</dd></div>
        </dl>
      </div>

      <Suspense fallback={<DirectorySkeleton />}>
        <DirectoryContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
