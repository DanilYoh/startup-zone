"use client";

import { getAuthErrorMessage } from "@/features/auth/errors";
import { passwordResetRequestSchema } from "@/features/auth/schemas";
import { createClient } from "@/lib/supabase/client";
import {
  Alert,
  Anchor,
  Button,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import styles from "@/features/auth/components/auth-form.module.css";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const validated = passwordResetRequestSchema.safeParse({ email });
    if (!validated.success) {
      setError(
        validated.error.flatten().fieldErrors.email?.[0] ??
          "Введите корректный адрес электронной почты",
      );
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(validated.data.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) {
        setError(getAuthErrorMessage("password_reset_request_failed"));
        return;
      }
      setSuccess(true);
    } catch {
      setError(getAuthErrorMessage("password_reset_request_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className} {...props}>
      {success ? (
        <Paper withBorder radius="md" p={0} className={styles.authCard}>
          <div className={styles.cardBody}>
            <Stack gap="lg">
              <span className={styles.statusIcon}>
                <MailCheck size={20} aria-hidden="true" />
              </span>
              <div className={styles.authHeader}>
                <Text className={styles.eyebrow}>Восстановление доступа</Text>
                <Title order={1} className={styles.authTitle}>Проверьте почту</Title>
                <Text className={styles.authDescription}>Инструкция по восстановлению отправлена</Text>
              </div>
              <Text className={styles.statusText}>
                Если аккаунт зарегистрирован по электронной почте, вы получите
                письмо со ссылкой для смены пароля.
              </Text>
              <Button
                component={Link}
                href="/auth/login"
                variant="default"
                className={styles.secondaryAction}
                leftSection={<ArrowLeft size={15} aria-hidden="true" />}
                fullWidth
              >
                Вернуться ко входу
              </Button>
            </Stack>
          </div>
        </Paper>
      ) : (
        <Paper withBorder radius="md" p={0} className={styles.authCard}>
          <div className={styles.cardBody}>
            <div className={styles.authHeader}>
              <Text className={styles.eyebrow}>Восстановление доступа</Text>
              <Title order={1} className={styles.authTitle}>Восстановление пароля</Title>
              <Text className={styles.authDescription}>
                Введите электронную почту, и мы отправим ссылку для смены пароля.
              </Text>
            </div>
            <form onSubmit={handleForgotPassword} className={styles.form}>
              <Stack gap="sm">
                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  label="Электронная почта"
                  placeholder="m@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                />
                {error && (
                  <Alert className={styles.formAlert} color="red" variant="light" role="alert">
                    {error}
                  </Alert>
                )}
                <Button
                  className={styles.submitButton}
                  type="submit"
                  fullWidth
                  loading={isLoading}
                  rightSection={<ArrowRight size={15} aria-hidden="true" />}
                >
                  Отправить ссылку
                </Button>
              </Stack>
              <div className={styles.formFooter}>
                Уже есть аккаунт?{" "}
                <Anchor component={Link} href="/auth/login">Войти</Anchor>
              </div>
            </form>
          </div>
        </Paper>
      )}
    </div>
  );
}
