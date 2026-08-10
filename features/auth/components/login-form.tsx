"use client";

import {
  signIn,
  signInDemo,
  type DemoSignInActionState,
  type SignInActionState,
} from "@/features/auth/server/actions";
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
const initialDemoState: DemoSignInActionState = { status: "idle" };

export function LoginForm({
  className,
  demoAccessEnabled = false,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { demoAccessEnabled?: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [demoState, demoAction, demoPending] = useActionState(
    signInDemo,
    initialDemoState,
  );
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
          {demoAccessEnabled && (
            <Stack gap="sm">
              <Text c="dimmed" size="sm" ta="center">
                Или откройте изолированную демосреду без регистрации
              </Text>
              <Stack gap="sm">
                <form action={demoAction}>
                  <input type="hidden" name="role" value="founder" />
                  <Button type="submit" variant="outline" fullWidth loading={demoPending}>
                    Войти как основатель
                  </Button>
                </form>
                <form action={demoAction}>
                  <input type="hidden" name="role" value="investor" />
                  <Button type="submit" variant="outline" fullWidth loading={demoPending}>
                    Войти как инвестор
                  </Button>
                </form>
              </Stack>
              {demoState.message && (
                <Alert color="red" variant="light" role="alert">
                  {demoState.message}
                </Alert>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>
    </div>
  );
}
