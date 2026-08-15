import { AuthShell } from "@/app/auth/auth-shell";
import { getAuthErrorMessage } from "@/features/auth/errors";
import authStyles from "@/features/auth/components/auth-form.module.css";
import { Button, Paper, Stack, Text, Title } from "@mantine/core";
import { ArrowLeft, CircleAlert } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const params = await searchParams;

  return (
    <Text className={authStyles.statusText}>
      {getAuthErrorMessage(params.code)}
    </Text>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  return (
    <AuthShell>
      <Paper withBorder radius="md" p={0} className={authStyles.authCard}>
        <div className={authStyles.cardBody}>
          <Stack gap="md">
            <span className={`${authStyles.statusIcon} ${authStyles.statusIconDanger}`}>
              <CircleAlert size={20} aria-hidden="true" />
            </span>
            <div className={authStyles.authHeader}>
              <Text className={authStyles.eyebrow}>Ошибка доступа</Text>
              <Title order={1} className={authStyles.authTitle}>
                Не удалось завершить действие
              </Title>
            </div>
            <Suspense>
              <ErrorContent searchParams={searchParams} />
            </Suspense>
            <Button
              component={Link}
              href="/auth/login"
              variant="default"
              className={authStyles.secondaryAction}
              leftSection={<ArrowLeft size={15} aria-hidden="true" />}
              fullWidth
            >
              Вернуться ко входу
            </Button>
          </Stack>
        </div>
      </Paper>
    </AuthShell>
  );
}
