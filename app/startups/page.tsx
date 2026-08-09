import { LinkButton } from "@/components/link-button";
import { PaginationNav } from "@/components/pagination-nav";
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
import styles from "./startups.module.css";

export const metadata: Metadata = {
  title: "Discover startups",
  description: "Browse active startups published by Startup Zone founders.",
};

type StartupsPageProps = {
  searchParams: Promise<StartupDirectorySearchParams>;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function DirectorySkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" aria-label="Loading startups">
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
      <Paper component="form" action="/startups" withBorder radius="lg" p="lg">
        <div className={styles.filterGrid}>
          <TextInput
            name="q"
            label="Search by startup name"
            placeholder="Climate Lens"
            defaultValue={filters.query}
            maxLength={80}
            leftSection={<Search size={16} aria-hidden="true" />}
          />
          <NativeSelect
            id="directory-stage"
            name="stage"
            label="Stage"
            defaultValue={filters.stage ?? ""}
            data={[
              { value: "", label: "All stages" },
              ...startupStages.map((stage) => ({
                value: stage,
                label: startupStageLabels[stage],
              })),
            ]}
          />
          <TextInput
            id="directory-niche"
            name="niche"
            label="Exact niche"
            placeholder="ClimateTech"
            defaultValue={filters.niche}
            maxLength={40}
          />
          <Button type="submit">Apply filters</Button>
        </div>
        {hasStartupDirectoryFilters(filters) && (
          <Group mt="md" justify="space-between">
            <Text size="sm" c="dimmed">
              Showing filtered active startups.
            </Text>
            <LinkButton href="/startups" variant="subtle" size="compact-sm">
              Clear filters
            </LinkButton>
          </Group>
        )}
      </Paper>

      {result.status === "unconfigured" ? (
        <DirectoryNotice icon={ServerOff} title="Directory unavailable in demo mode">
          Connect a local or test Supabase environment to browse persisted founder projects. The
          public portfolio demo does not substitute static cards for marketplace data.
        </DirectoryNotice>
      ) : result.status === "error" ? (
        <Alert color="red" variant="light" title="Startups could not be loaded" role="alert">
          Refresh the page and try again. If the problem continues, the marketplace data service
          may be unavailable.
        </Alert>
      ) : result.data.items.length === 0 ? (
        <DirectoryNotice
          icon={hasStartupDirectoryFilters(filters) ? SearchX : Rocket}
          title={
            result.data.total > 0
              ? "No startups on this page"
              : hasStartupDirectoryFilters(filters)
                ? "No matching startups"
                : "No startups yet"
          }
        >
          {result.data.total > 0 ? (
            <Link href={startupDirectoryHref(filters, 1)}>Return to the first results page.</Link>
          ) : hasStartupDirectoryFilters(filters) ? (
            "Try a broader name, another stage, or remove the niche filter."
          ) : (
            "Active founder projects will appear here after they are published."
          )}
        </DirectoryNotice>
      ) : (
        <section aria-labelledby="startup-results-heading">
          <Group justify="space-between" align="flex-end" mb="lg">
            <div>
              <Title order={2} id="startup-results-heading" size="h3">
                Active startups
              </Title>
              <Text mt={4} size="sm" c="dimmed" aria-live="polite">
                {result.data.total} {result.data.total === 1 ? "project" : "projects"}
              </Text>
            </div>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {result.data.items.map((startup) => (
              <Paper component="article" key={startup.id} withBorder shadow="xs" radius="lg" p="lg">
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
                          Founded by {startup.founder.full_name}
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
                            Seeking {currencyFormatter.format(startup.funding_ask)}
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
                        View project
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
            itemLabel={result.data.total === 1 ? "project" : "projects"}
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
          Founder–investor marketplace
        </Badge>
        <Title order={1} mt="md" className={styles.textBalance} fz={{ base: 40, sm: 52 }} lh={1.08}>
          Find startups that fit your conviction.
        </Title>
        <Text mt="lg" size="lg" c="dimmed" lh={1.7}>
          Browse active founder projects, qualify the stage and niche, then open the full persisted
          startup profile before sending investment interest.
        </Text>
      </div>

      <Suspense fallback={<DirectorySkeleton />}>
        <DirectoryContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
