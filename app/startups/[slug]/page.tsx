import { LinkButton } from "@/components/link-button";
import { formatMarketCurrency } from "@/lib/market";
import { ApplicationPanel } from "@/features/applications/components/application-panel";
import { getActiveStartupBySlug } from "@/lib/supabase/startups";
import { startupStageLabels } from "@/lib/validations";
import { externalHostname } from "@/lib/external-url";
import { ReportLinkForm } from "@/features/startups/components/report-link-form";
import {
  Alert,
  Badge,
  Button,
  Paper,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  Landmark,
  Link2,
  MapPin,
  ServerOff,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import styles from "../startups-supabase.module.css";

type StartupDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" });

function DetailSkeleton() {
  return (
    <Stack gap="lg" aria-label="Загрузка стартапа">
      <Skeleton height={42} width="65%" />
      <Skeleton height={88} radius="md" />
      <Skeleton height={320} radius="lg" />
    </Stack>
  );
}

async function StartupDetail({ params }: StartupDetailPageProps) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 60) notFound();

  const result = await getActiveStartupBySlug(slug);

  if (result.status === "unconfigured") {
    return (
      <Paper withBorder radius="lg" p={{ base: "lg", sm: "xl" }}>
        <Stack gap="md" align="flex-start">
          <ThemeIcon size={44} radius="md" variant="light" color="gray">
            <ServerOff size={21} aria-hidden="true" />
          </ThemeIcon>
          <div>
            <Title order={1} size="h2">
              Данные стартапа недоступны в деморежиме
            </Title>
            <Text mt="xs" c="dimmed">
              Подключите локальное или тестовое окружение Supabase, чтобы открыть сохранённый проект.
            </Text>
          </div>
          <LinkButton href="/startups" variant="outline">
            Назад в каталог
          </LinkButton>
        </Stack>
      </Paper>
    );
  }

  if (result.status === "error") {
    return (
      <Alert color="red" variant="light" title="Не удалось загрузить стартап" role="alert">
        Вернитесь в каталог или обновите страницу.
      </Alert>
    );
  }

  const startup = result.data;
  if (!startup) notFound();

  const hasRoundData = startup.funding_ask !== null || startup.equity_offered !== null;
  const hasProjectLinks = Boolean(startup.website_url || startup.deck_url);
  const hasSidebar = hasRoundData || hasProjectLinks;

  return (
    <>
      <div className={styles.detailBack}>
        <LinkButton
          href="/startups"
          variant="subtle"
          leftSection={<ArrowLeft size={16} aria-hidden="true" />}
        >
          Все стартапы
        </LinkButton>
      </div>

      <article>
        <header className={styles.detailHero}>
          <div className={styles.detailMeta}>
          <Badge size="lg" variant="light">
            {startupStageLabels[startup.stage]}
          </Badge>
            <span className={styles.detailDate}>
              <CalendarDays size={13} aria-hidden="true" />
            Опубликовано {dateFormatter.format(new Date(startup.created_at))}
            </span>
          </div>

          <Title order={1} className={`${styles.textBalance} ${styles.detailTitle}`} fz={{ base: 44, sm: 64 }} lh={0.98}>
          {startup.title}
          </Title>
          <p className={styles.detailLead}>
          {startup.one_pager}
          </p>
          <div className={styles.detailNiches}>
          {startup.niche.map((item) => (
            <Badge key={item} variant="outline" color="gray" size="lg">
              {item}
            </Badge>
          ))}
          </div>
        </header>

        <div className={`${styles.detailGrid} ${!hasSidebar ? styles.detailGridWide : ""}`}>
          <div className={styles.detailStory}>
            <section className={styles.storyPanel} aria-labelledby="about-project-heading">
              <span className={styles.sectionIndex}>01 / Проект</span>
              <Title order={2} size="h2" id="about-project-heading">О проекте</Title>
              <p className={`${styles.storyCopy} ${styles.preWrap}`}>{startup.description}</p>
            </section>

            <section className={styles.founderPanel} aria-labelledby="founder-heading">
              <span className={styles.sectionIndex}>02 / Команда</span>
              <Title order={2} size="h3" id="founder-heading">
              Основатель
              </Title>
              <div className={styles.founderIdentity}>
                <span className={styles.founderMark} aria-hidden="true">
                <UserRound size={18} aria-hidden="true" />
                </span>
                <div>
                  <Text fw={650}>{startup.founder?.full_name ?? "Основатель Startup Zone"}</Text>
                {startup.founder?.headline && (
                  <Text size="sm" c="dimmed" mt={2}>
                    {startup.founder.headline}
                  </Text>
                )}
                {startup.founder?.location && (
                    <span className={styles.founderLocation}>
                    <MapPin size={14} aria-hidden="true" />
                      {startup.founder.location}
                    </span>
                )}
                </div>
              </div>
            {startup.founder?.founder_experience && (
                <p className={`${styles.founderExperience} ${styles.preWrap}`}>
                {startup.founder.founder_experience}
                </p>
            )}
            </section>
          </div>

          {hasSidebar && (
            <aside className={styles.detailSidebar} aria-label="Параметры и ссылки проекта">
              {hasRoundData && (
                <section className={styles.sidePanel} aria-labelledby="round-heading">
                  <div className={styles.sidePanelHeader}>
                    <h2 id="round-heading">Параметры раунда</h2>
                    <Landmark size={16} aria-hidden="true" />
                  </div>
                  <div className={styles.dealMetrics}>
                {startup.funding_ask !== null && (
                  <div>
                        <span>Сумма</span>
                        <strong>{formatMarketCurrency(startup.funding_ask)}</strong>
                  </div>
                )}
                {startup.equity_offered !== null && (
                  <div>
                        <span>Доля</span>
                        <strong>{startup.equity_offered}%</strong>
                  </div>
                )}
                  </div>
                </section>
              )}

              {hasProjectLinks && (
                <section className={styles.sidePanel} aria-labelledby="links-heading">
                  <div className={styles.sidePanelHeader}>
                    <h2 id="links-heading">Материалы проекта</h2>
                    <Link2 size={16} aria-hidden="true" />
                  </div>
                  <div className={styles.projectLinks}>
                {startup.website_url && (
                      <div className={styles.projectLinkItem}>
                    <Button
                      component="a"
                      href={startup.website_url}
                      target="_blank"
                      rel="noreferrer"
                      variant="outline"
                      rightSection={<ExternalLink size={15} aria-hidden="true" />}
                    >
                      Открыть {externalHostname(startup.website_url)}
                    </Button>
                    <ReportLinkForm startupId={startup.id} linkKind="website" />
                      </div>
                )}
                {startup.deck_url && (
                      <div className={styles.projectLinkItem}>
                    <Button
                      component="a"
                      href={startup.deck_url}
                      target="_blank"
                      rel="noreferrer"
                      variant="outline"
                      leftSection={<FileText size={15} aria-hidden="true" />}
                    >
                      Презентация на {externalHostname(startup.deck_url)}
                    </Button>
                    <ReportLinkForm startupId={startup.id} linkKind="deck" />
                      </div>
                )}
                    <p className={styles.linkHint}>Внешние ссылки открываются в новой вкладке</p>
                  </div>
                </section>
              )}
            </aside>
          )}
        </div>
      </article>

      <section className={styles.applicationSection} aria-labelledby="application-heading">
        <div className={styles.applicationIntro}>
          <span className={styles.sectionIndex}>03 / Контакт</span>
          <Title order={2} size="h2" id="application-heading">Начать предметный разговор</Title>
          <p>Отправьте основателю краткое сообщение. Контакты откроются после принятия заявки.</p>
        </div>
        <div className={styles.applicationPanel}>
          <ApplicationPanel startupId={startup.id} founderId={startup.founder_id} />
        </div>
      </section>
    </>
  );
}

export default function StartupDetailPage({ params }: StartupDetailPageProps) {
  return (
    <div className={styles.detailPage}>
      <Suspense fallback={<DetailSkeleton />}>
        <StartupDetail params={params} />
      </Suspense>
    </div>
  );
}
