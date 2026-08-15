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
import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import styles from "./auth-form.module.css";

const initialState: SignInActionState = { status: "idle" };
export function LoginForm({
  className,
  readOnlyDemoEnabled = false,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { readOnlyDemoEnabled?: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const fieldError = (field: keyof SignInInput) => state.errors?.[field]?.[0];

  return (
    <div className={className} {...props}>
      <Paper withBorder radius="md" p={0} className={styles.authCard}>
        <div className={styles.cardBody}>
          <div className={styles.authHeader}>
            <Text className={styles.eyebrow}>Личный кабинет</Text>
            <Title order={1} className={styles.authTitle}>Вход</Title>
            <Text className={styles.authDescription}>Введите email, чтобы открыть личный кабинет.</Text>
          </div>
          <form action={formAction} className={styles.form}>
            <Stack gap="sm">
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
              <div>
                <div className={styles.passwordRow}>
                  <Text component="span" size="xs" fw={600}>
                    Пароль
                  </Text>
                  <Anchor component={Link} href="/auth/forgot-password">
                    Забыли пароль?
                  </Anchor>
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  aria-label="Пароль"
                  autoComplete="current-password"
                  visibilityToggleButtonProps={{ "aria-label": "Показать или скрыть пароль" }}
                  required
                  error={fieldError("password")}
                />
              </div>
              {state.message && (
                <Alert className={styles.formAlert} color="red" variant="light" role="alert">
                  {state.message}
                </Alert>
              )}
              <Button
                className={styles.submitButton}
                type="submit"
                fullWidth
                loading={pending}
                rightSection={<ArrowRight size={15} aria-hidden="true" />}
              >
                Войти
              </Button>
            </Stack>
            <div className={styles.formFooter}>
              Нет аккаунта?{" "}
              <Anchor component={Link} href="/auth/sign-up">Зарегистрироваться</Anchor>
            </div>
          </form>
        </div>
        {readOnlyDemoEnabled && (
          <section className={styles.demoPanel} aria-label="Демонстрационная версия">
            <div className={styles.demoHeader}>
              <div>
                <Text className={styles.demoLabel}>Посмотреть без входа</Text>
                <Text className={styles.demoDescription} mt={2}>
                  Демо открывается без аккаунта и не создаёт пользовательскую сессию
                </Text>
              </div>
              <span className={styles.demoBadge}>read only</span>
            </div>
            <div className={styles.demoActions}>
              <Button component={Link} href="/startups" variant="default" size="xs" fullWidth>
                Открыть демо-каталог
              </Button>
              <Button
                component={Link}
                href="/startups/flowpilot-operations-ai"
                variant="default"
                size="xs"
                fullWidth
                rightSection={<ExternalLink size={13} aria-hidden="true" />}
              >
                Открыть демо-проект
              </Button>
            </div>
          </section>
        )}
      </Paper>
    </div>
  );
}
