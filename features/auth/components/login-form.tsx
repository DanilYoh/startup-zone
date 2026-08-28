"use client";

import { signIn, type SignInActionState } from "@/features/auth/server/actions";
import type { SignInInput } from "@/features/auth/schemas";
import {
  Alert,
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useActionState } from "react";
import styles from "./auth-form.module.css";

const initialState: SignInActionState = { status: "idle" };
export function LoginForm({
  className,
  readOnlyDemoEnabled = false,
  returnTo = "/dashboard",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  readOnlyDemoEnabled?: boolean;
  returnTo?: string;
}) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const fieldError = (field: keyof SignInInput) => state.errors?.[field]?.[0];

  return (
    <div className={className} {...props}>
      <Paper withBorder radius="md" p="xl" className={styles.authCard}>
        <Stack gap="lg">
          <div>
            <Title order={1} size="h2">Вход</Title>
            <Text c="dimmed" size="sm" mt={4}>Введите email, чтобы открыть личный кабинет.</Text>
          </div>
          <form action={formAction}>
            <input type="hidden" name="next" value={returnTo} />
            <Stack gap="md">
              <TextInput
                id="email"
                name="email"
                type="email"
                label="Электронная почта"
                placeholder="m@example.com"
                autoComplete="email"
                required
                error={fieldError("email")}
              />
              <Stack gap={6}>
                <PasswordInput
                  id="password"
                  name="password"
                  label="Пароль"
                  autoComplete="current-password"
                  visibilityToggleButtonProps={{ "aria-label": "Показать или скрыть пароль" }}
                  required
                  error={fieldError("password")}
                />
                <Anchor component={Link} href="/auth/forgot-password" size="sm" ta="right">
                  Забыли пароль?
                </Anchor>
              </Stack>
              {state.message && <Alert color="red" variant="light" role="alert">{state.message}</Alert>}
              <Button type="submit" fullWidth loading={pending}>Войти</Button>
            </Stack>
            <Text mt="md" ta="center" size="sm">
              Нет аккаунта?{" "}
              <Anchor component={Link} href="/auth/sign-up">Зарегистрироваться</Anchor>
            </Text>
          </form>
          {readOnlyDemoEnabled && (
            <Stack gap="sm">
              <Text c="dimmed" size="sm" ta="center">
                Демо открывается без аккаунта и не создаёт пользовательскую сессию
              </Text>
              <Stack gap="sm">
                <Button component={Link} href="/startups" variant="outline" fullWidth>
                  Открыть демо-каталог
                </Button>
                <Button
                  component={Link}
                  href="/startups/flowpilot-operations-ai"
                  variant="outline"
                  fullWidth
                >
                  Открыть демо-проект
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Paper>
    </div>
  );
}
