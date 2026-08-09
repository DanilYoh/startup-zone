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
          <Title order={1} size="h3">Профиль основателя недоступен</Title>
          <Text size="sm" c="dimmed">
            Не удалось проверить профиль. Повторите попытку перед публикацией стартапа.
          </Text>
          <LinkButton href="/dashboard" variant="outline">
            Назад в кабинет
          </LinkButton>
        </Stack>
      </Paper>
    );
  }

  if (profile.role !== "founder") {
    return (
      <Paper withBorder shadow="xs" radius="lg" p="xl" className={styles.formCard}>
        <Stack gap="md" align="flex-start">
          <Title order={1} size="h3">Требуется профиль основателя</Title>
          <Text size="sm" c="dimmed">Публиковать стартапы могут только основатели.</Text>
          <LinkButton href="/dashboard" variant="outline">
            Назад в кабинет
          </LinkButton>
        </Stack>
      </Paper>
    );
  }

  return (
    <div className={styles.formPage}>
      <LinkButton href="/dashboard" variant="subtle" className={styles.fitWidth}>
        Назад в кабинет
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
