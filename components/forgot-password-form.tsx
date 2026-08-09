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
import Link from "next/link";
import { useState } from "react";

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
        <Paper withBorder shadow="sm" radius="lg" p="xl">
          <Stack gap="md">
            <div>
              <Title order={1} size="h2">Проверьте почту</Title>
              <Text c="dimmed" size="sm" mt={4}>Инструкция по восстановлению отправлена</Text>
            </div>
            <Text size="sm" c="dimmed">
              Если аккаунт зарегистрирован по электронной почте, вы получите
              письмо со ссылкой для смены пароля.
            </Text>
          </Stack>
        </Paper>
      ) : (
        <Paper withBorder shadow="sm" radius="lg" p="xl">
          <Stack gap="lg">
            <div>
              <Title order={1} size="h2">Восстановление пароля</Title>
              <Text c="dimmed" size="sm" mt={4}>
                Введите электронную почту, и мы отправим ссылку для смены пароля.
              </Text>
            </div>
            <form onSubmit={handleForgotPassword}>
              <Stack gap="md">
                <TextInput
                  id="email"
                  type="email"
                  label="Электронная почта"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                />
                {error && <Alert color="red" variant="light" role="alert">{error}</Alert>}
                <Button type="submit" fullWidth loading={isLoading}>
                  Отправить ссылку
                </Button>
              </Stack>
              <Text mt="md" ta="center" size="sm">
                Уже есть аккаунт?{" "}
                <Anchor component={Link} href="/auth/login">Войти</Anchor>
              </Text>
            </form>
          </Stack>
        </Paper>
      )}
    </div>
  );
}
