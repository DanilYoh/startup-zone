import { LinkButton } from "@/components/link-button";
import { ApplicationPanel } from "@/features/applications/components/application-panel";
import { getActiveStartupBySlug } from "@/lib/supabase/startups";
import { startupStageLabels } from "@/lib/validations";
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { ArrowLeft, ExternalLink, FileText, MapPin, ServerOff, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type StartupDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "long" });

function DetailSkeleton() {
  return (
    <Stack gap="lg" aria-label="Loading startup">
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
              Startup data is unavailable in demo mode
            </Title>
            <Text mt="xs" c="dimmed">
              Connect a local or test Supabase environment to open persisted founder projects.
            </Text>
          </div>
          <LinkButton href="/startups" variant="outline">
            Back to directory
          </LinkButton>
        </Stack>
      </Paper>
    );
  }

  if (result.status === "error") {
    return (
      <Alert color="red" variant="light" title="This startup could not be loaded" role="alert">
        Return to the directory or refresh the page and try again.
      </Alert>
    );
  }

  const startup = result.data;
  if (!startup) notFound();

  return (
    <Stack gap="xl">
      <div>
        <Group gap="xs" mb="lg">
          <LinkButton
            href="/startups"
            variant="subtle"
            leftSection={<ArrowLeft size={16} aria-hidden="true" />}
          >
            All startups
          </LinkButton>
        </Group>

        <Group gap="sm" mb="md">
          <Badge size="lg" variant="light">
            {startupStageLabels[startup.stage]}
          </Badge>
          <Text size="sm" c="dimmed">
            Published {dateFormatter.format(new Date(startup.created_at))}
          </Text>
        </Group>

        <Title order={1} className="text-balance" fz={{ base: 42, sm: 58 }} lh={1.05}>
          {startup.title}
        </Title>
        <Text mt="lg" size="xl" c="dimmed" lh={1.6} maw={820}>
          {startup.one_pager}
        </Text>
        <Group mt="lg" gap="xs">
          {startup.niche.map((item) => (
            <Badge key={item} variant="outline" color="gray" size="lg">
              {item}
            </Badge>
          ))}
        </Group>
      </div>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Paper component="article" withBorder radius="lg" p={{ base: "lg", sm: "xl" }} className="md:col-span-2">
          <Title order={2} size="h3">
            About the project
          </Title>
          <Text mt="lg" lh={1.8} className="whitespace-pre-wrap">
            {startup.description}
          </Text>
        </Paper>

        <Stack gap="lg">
          <Paper withBorder radius="lg" p="lg">
            <Title order={2} size="h4">
              Founder
            </Title>
            <Group mt="md" gap="sm" align="flex-start" wrap="nowrap">
              <ThemeIcon variant="light" color="gray" size={38} radius="md">
                <UserRound size={18} aria-hidden="true" />
              </ThemeIcon>
              <div>
                <Text fw={600}>{startup.founder?.full_name ?? "Startup Zone founder"}</Text>
                {startup.founder?.location && (
                  <Group gap={5} mt={4} wrap="nowrap">
                    <MapPin size={14} aria-hidden="true" />
                    <Text size="sm" c="dimmed">
                      {startup.founder.location}
                    </Text>
                  </Group>
                )}
              </div>
            </Group>
          </Paper>

          {(startup.funding_ask !== null || startup.equity_offered !== null) && (
            <Paper withBorder radius="lg" p="lg">
              <Title order={2} size="h4">
                Funding
              </Title>
              <Stack mt="md" gap="sm">
                {startup.funding_ask !== null && (
                  <div>
                    <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
                      Funding ask
                    </Text>
                    <Text mt={3} fw={600}>
                      {currencyFormatter.format(startup.funding_ask)}
                    </Text>
                  </div>
                )}
                {startup.equity_offered !== null && (
                  <div>
                    <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
                      Equity offered
                    </Text>
                    <Text mt={3} fw={600}>
                      {startup.equity_offered}%
                    </Text>
                  </div>
                )}
              </Stack>
            </Paper>
          )}

          {(startup.website_url || startup.deck_url) && (
            <Paper withBorder radius="lg" p="lg">
              <Title order={2} size="h4">
                Project links
              </Title>
              <Stack mt="md" gap="sm">
                {startup.website_url && (
                  <Button
                    component="a"
                    href={startup.website_url}
                    target="_blank"
                    rel="noreferrer"
                    variant="outline"
                    rightSection={<ExternalLink size={15} aria-hidden="true" />}
                  >
                    Visit website
                  </Button>
                )}
                {startup.deck_url && (
                  <Button
                    component="a"
                    href={startup.deck_url}
                    target="_blank"
                    rel="noreferrer"
                    variant="outline"
                    leftSection={<FileText size={15} aria-hidden="true" />}
                  >
                    Open pitch deck
                  </Button>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      </SimpleGrid>

      <Paper withBorder radius="lg" p={{ base: "lg", sm: "xl" }}>
        <ApplicationPanel startupId={startup.id} founderId={startup.founder_id} />
      </Paper>
    </Stack>
  );
}

export default function StartupDetailPage({ params }: StartupDetailPageProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
      <Suspense fallback={<DetailSkeleton />}>
        <StartupDetail params={params} />
      </Suspense>
    </div>
  );
}
