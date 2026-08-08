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
import { CheckCircle2, Plus, Rocket, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase
      .from("startups")
      .select("id, title, slug, one_pager, stage, niche, is_active")
      .eq("founder_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const isFounder = profile?.role === "founder";

  return (
    <div className="grid w-full gap-8">
      <Paper component="section" withBorder shadow="xs" radius="lg" p={{ base: "md", sm: "xl" }}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <ThemeIcon size={44} radius="md" color="teal" variant="light">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </ThemeIcon>
            <div>
              <Text size="sm" fw={500} c="teal">
                Verified server session
              </Text>
              <Title order={1} size="h2" mt={4}>
                {isFounder ? "Founder dashboard" : "Startup Zone dashboard"}
              </Title>
              <Text mt="xs" c="dimmed">Signed in as {user.email ?? "a verified user"}.</Text>
            </div>
          </div>
          {isFounder && (
            <Group gap="sm">
              <LinkButton href="/dashboard/applications/inbox" variant="outline" size="md">
                Incoming applications
              </LinkButton>
              <LinkButton
                href="/dashboard/startups/new"
                size="md"
                leftSection={<Plus size={18} aria-hidden="true" />}
              >
                Publish startup
              </LinkButton>
            </Group>
          )}
        </div>

        <div className="mt-8 border-t pt-6">
          <Title order={2} size="h4">Security boundary</Title>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            {[
              "Server-side user verification",
              "Session refresh in Next.js Proxy",
              "Ownership derived from the signed-in user",
              "Database row-level security",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Paper>

      <section aria-labelledby="your-startups-heading" className="grid gap-4">
        <div>
          <Title order={2} id="your-startups-heading" size="h3">
            Your startups
          </Title>
          <Text mt={4} size="sm" c="dimmed">
            Projects published through your founder profile.
          </Text>
        </div>

        {profileError || startupsError ? (
          <Paper withBorder radius="lg" p="xl">
            <Text size="sm" c="dimmed">Your startups could not be loaded. Please refresh and try again.</Text>
          </Paper>
        ) : !isFounder ? (
          <Paper withBorder radius="lg" p="xl">
            <Text size="sm" c="dimmed">A founder profile is required to publish and manage startups.</Text>
          </Paper>
        ) : startups?.length ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {startups.map((startup) => (
              <Paper
                key={startup.id}
                component="article"
                aria-label={startup.title}
                withBorder
                shadow="xs"
                radius="lg"
                p="lg"
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
                <Rocket className="size-5" aria-hidden="true" />
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
