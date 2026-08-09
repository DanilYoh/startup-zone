import { LinkButton } from "@/components/link-button";
import { StartupForm } from "@/features/startups/components/startup-form";
import { createClient } from "@/lib/supabase/server";
import { Paper, Skeleton, Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import styles from "../../dashboard.module.css";

async function NewStartupContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return (
      <Paper withBorder shadow="xs" radius="lg" p="xl" className={styles.formCard}>
        <Stack gap="md" align="flex-start">
          <Title order={1} size="h3">Founder profile unavailable</Title>
          <Text size="sm" c="dimmed">
            We could not verify your profile. Try again before publishing a startup.
          </Text>
          <LinkButton href="/dashboard" variant="outline">
            Back to dashboard
          </LinkButton>
        </Stack>
      </Paper>
    );
  }

  if (profile.role !== "founder") {
    return (
      <Paper withBorder shadow="xs" radius="lg" p="xl" className={styles.formCard}>
        <Stack gap="md" align="flex-start">
          <Title order={1} size="h3">Founder profile required</Title>
          <Text size="sm" c="dimmed">Only founder profiles can publish startups.</Text>
          <LinkButton href="/dashboard" variant="outline">
            Back to dashboard
          </LinkButton>
        </Stack>
      </Paper>
    );
  }

  return (
    <div className={styles.formPage}>
      <LinkButton href="/dashboard" variant="subtle" className={styles.fitWidth}>
        Back to dashboard
      </LinkButton>
      <StartupForm />
    </div>
  );
}

export default function NewStartupPage() {
  return (
    <Suspense fallback={<Skeleton height="44rem" radius="lg" className={styles.formSkeleton} />}>
      <NewStartupContent />
    </Suspense>
  );
}
