import { LinkButton } from "@/components/link-button";
import { StartupStatusForm } from "@/features/startups/components/startup-status-form";
import { createClient } from "@/lib/supabase/server";
import { startupStageLabels } from "@/lib/validations";
import {
  Badge,
  Group,
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
  const roleCapabilities = isFounder
    ? [
        "Publish and manage founder-owned startups",
        "Control when a startup is publicly discoverable",
        "Review investor interest in one inbox",
        "Make terminal accept or reject decisions",
      ]
    : isInvestor
      ? [
        "Describe a clear investment thesis",
        "Set preferred stages and ticket range",
        "Discover persisted founder projects",
        "Track every investment interest request",
        ]
      : ["Choose an active founder or investor account to use the marketplace."];

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
                {isFounder ? "Founder workspace" : isInvestor ? "Investor workspace" : "Marketplace account"}
              </Text>
              <Title order={1} size="h2" mt={3}>
                {profile?.full_name ? `Welcome back, ${profile.full_name}.` : "Welcome to Startup Zone."}
              </Title>
              <Text mt="xs" c="dimmed">
                {profile?.headline ?? `Signed in as ${user.email ?? "a verified user"}.`}
              </Text>
            </div>
          </div>
          {isFounder ? (
            <Group gap="sm">
              <LinkButton href="/dashboard/applications/inbox" variant="default" size="sm">
                Investor interest
              </LinkButton>
              <LinkButton
                href="/dashboard/startups/new"
                size="sm"
                leftSection={<Plus size={18} aria-hidden="true" />}
              >
                Publish startup
              </LinkButton>
            </Group>
          ) : isInvestor ? (
            <Group gap="sm">
              <LinkButton href="/dashboard/applications" variant="default" size="sm">
                My interest
              </LinkButton>
              <LinkButton href="/startups" size="sm">
                Discover startups
              </LinkButton>
            </Group>
          ) : null}
        </div>

        <div className={styles.security}>
          <Title order={2} size="h4">What this role can do</Title>
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
        <div>
          <Title order={2} id="your-startups-heading" size="h3">
            {isFounder ? "Your startups" : "Investor workspace"}
          </Title>
          <Text mt={4} size="sm" c="dimmed">
            {isFounder
              ? "Projects published through your founder profile."
              : "Keep your investment profile current, discover projects, and track the conversations you start."}
          </Text>
        </div>

        {profileError || startupsError ? (
          <Paper withBorder radius="lg" p="xl">
            <Text size="sm" c="dimmed">Your startups could not be loaded. Please refresh and try again.</Text>
          </Paper>
        ) : isInvestor ? (
          <Paper withBorder radius="md" p={0} className={styles.investorPanel}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <Stack gap="md" align="flex-start" className={styles.workspaceCard}>
                <ThemeIcon color="brand" variant="light" size={36} radius="sm">
                  <Landmark className={styles.icon} aria-hidden="true" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4">Sharpen your investor profile</Title>
                  <Text mt={5} size="sm" c="dimmed">
                    Make your organization, thesis, preferred stages, and ticket range explicit.
                  </Text>
                </div>
                <LinkButton href="/dashboard/profile" variant="default" size="sm">Edit investor profile</LinkButton>
              </Stack>
              <Stack gap="md" align="flex-start" className={styles.workspaceCard}>
                <ThemeIcon color="brand" variant="light" size={36} radius="sm">
                  <Rocket className={styles.icon} aria-hidden="true" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4">Find a qualified opportunity</Title>
                  <Text mt={5} size="sm" c="dimmed">
                    Browse real founder projects and send focused investment interest.
                  </Text>
                </div>
                <LinkButton href="/startups" size="sm">Browse active startups</LinkButton>
              </Stack>
            </SimpleGrid>
          </Paper>
        ) : !isFounder ? (
          <Paper withBorder radius="lg" p="xl">
            <Text size="sm" c="dimmed">An active founder or investor profile is required.</Text>
          </Paper>
        ) : startups?.length ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {startups.map((startup) => (
              <Paper
                key={startup.id}
                component="article"
                aria-label={startup.title}
                withBorder
                radius="md"
                p="lg"
                className={styles.startupCard}
              >
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <div>
                      <Title order={3} size="h4">{startup.title}</Title>
                      <Text mt={4} size="sm" c="dimmed">/{startup.slug}</Text>
                    </div>
                    <Badge color={startup.is_active ? "indigo" : "gray"} variant="light">
                      {startup.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">{startup.one_pager}</Text>
                  <Group gap="xs">
                    <Badge variant="outline" color="gray">
                      {startupStageLabels[startup.stage]}
                    </Badge>
                    {startup.niche.map((item) => (
                      <Badge key={item} variant="light" color="gray">
                        {item}
                      </Badge>
                    ))}
                  </Group>
                  <Group gap="sm" align="flex-start">
                    <LinkButton href={`/dashboard/startups/${startup.id}/edit`} size="compact-sm">
                      Edit
                    </LinkButton>
                    <StartupStatusForm id={startup.id} isActive={startup.is_active} />
                    {startup.is_active && (
                      <LinkButton href={`/startups/${startup.slug}`} variant="subtle" size="compact-sm">
                        View public page
                      </LinkButton>
                    )}
                  </Group>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        ) : (
          <Paper withBorder radius="lg" p="xl">
            <Stack gap="md" align="flex-start">
              <ThemeIcon color="gray" variant="light" size={40} radius="md">
                <Rocket className={styles.icon} aria-hidden="true" />
              </ThemeIcon>
              <div>
                <Title order={3} size="h4">No startups yet</Title>
                <Text mt={4} size="sm" c="dimmed">
                  Publish the first project to make it available through the persisted marketplace data.
                </Text>
              </div>
              {isFounder && (
                <LinkButton href="/dashboard/startups/new">
                  Publish your first startup
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
