import { AuthShell } from "@/app/auth/auth-shell";
import authStyles from "@/features/auth/components/auth-form.module.css";
import { Button, Paper, Stack, Text, Title } from "@mantine/core";
import { ArrowRight, MailCheck } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <AuthShell>
      <Paper withBorder radius="md" p={0} className={authStyles.authCard}>
        <div className={authStyles.cardBody}>
          <Stack gap="md">
            <span className={authStyles.statusIcon}>
              <MailCheck size={20} aria-hidden="true" />
            </span>
            <div className={authStyles.authHeader}>
              <Text className={authStyles.eyebrow}>Последний шаг</Text>
              <Title order={1} className={authStyles.authTitle}>
                Регистрация почти завершена
              </Title>
              <Text className={authStyles.authDescription}>Подтвердите электронную почту</Text>
            </div>
            <Text className={authStyles.statusText}>
              Мы создали аккаунт. Перейдите по ссылке из письма, чтобы подтвердить
              электронную почту и войти.
            </Text>
            <Button
              component={Link}
              href="/auth/login"
              variant="default"
              className={authStyles.secondaryAction}
              rightSection={<ArrowRight size={15} aria-hidden="true" />}
              fullWidth
            >
              Перейти ко входу
            </Button>
          </Stack>
        </div>
      </Paper>
    </AuthShell>
  );
}
