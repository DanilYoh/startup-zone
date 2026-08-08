import { LinkButton } from "@/components/link-button";
import { StartupForm } from "@/components/startup-form";
import { createClient } from "@/lib/supabase/server";
import { Paper, Skeleton, Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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
      <Paper withBorder shadow="xs" radius="lg" p="xl" className="mx-auto w-full max-w-2xl">
        <Stack gap="md" align="flex-start">
          <Title order={1} size="h3">Founder profile unavailable</Title>
          <Text size="sm" c="dimmed">
            We could not verify your profile. Try again before publishing a startup.
          </Text>
          <LinkButton href="/protected" variant="outline">
            Back to dashboard
          </LinkButton>
        </Stack>
      </Paper>
    );
  }

  if (profile.role !== "founder") {
    return (
      <Paper withBorder shadow="xs" radius="lg" p="xl" className="mx-auto w-full max-w-2xl">
        <Stack gap="md" align="flex-start">
          <Title order={1} size="h3">Founder profile required</Title>
          <Text size="sm" c="dimmed">Only founder profiles can publish startups.</Text>
          <LinkButton href="/protected" variant="outline">
            Back to dashboard
          </LinkButton>
        </Stack>
      </Paper>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      <LinkButton href="/protected" variant="subtle" className="w-fit">
        ← Back to dashboard
      </LinkButton>
      <StartupForm />
    </div>
  );
}

export default function NewStartupPage() {
  return (
    <Suspense fallback={<Skeleton height="44rem" radius="lg" className="mx-auto w-full max-w-3xl" />}>
      <NewStartupContent />
    </Suspense>
  );
}
