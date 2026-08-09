"use client";

import { signUp, type SignUpActionState } from "@/features/auth/server/actions";
import {
  marketplaceRoleDescriptions,
  marketplaceRoleLabels,
  marketplaceRoles,
  type SignUpInput,
} from "@/features/auth/schemas";
import {
  Alert,
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Radio,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useActionState } from "react";
import styles from "./auth-form.module.css";

const initialState: SignUpActionState = { status: "idle" };

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const fieldError = (field: keyof SignUpInput) => state.errors?.[field]?.[0];

  return (
    <div className={className} {...props}>
      <Paper withBorder radius="md" p={{ base: "lg", sm: "xl" }} className={styles.authCard}>
        <Stack gap="lg">
          <div>
            <Text className={styles.eyebrow}>Две стороны. Одна целевая площадка.</Text>
            <Title order={1} size="h2" mt={6}>Создайте аккаунт</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Выберите роль. После регистрации её нельзя изменить — это помогает сохранять доверие.
            </Text>
          </div>
          <form action={formAction}>
            <Stack gap="md">
              <TextInput
                id="full-name"
                name="full_name"
                label="Имя и фамилия"
                autoComplete="name"
                required
                error={fieldError("full_name")}
              />
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
              <Radio.Group
                name="role"
                label="Роль на площадке"
                defaultValue="founder"
                required
                error={fieldError("role")}
              >
                <div className={styles.roleGrid}>
                  {marketplaceRoles.map((role) => (
                    <label key={role} className={styles.roleOption}>
                      <Radio value={role} aria-label={marketplaceRoleLabels[role]} />
                      <span>
                        <Text fw={700}>{marketplaceRoleLabels[role]}</Text>
                        <Text size="xs" c="dimmed" mt={2}>{marketplaceRoleDescriptions[role]}</Text>
                      </span>
                    </label>
                  ))}
                </div>
              </Radio.Group>
              <PasswordInput
                id="password"
                name="password"
                label="Пароль"
                autoComplete="new-password"
                visibilityToggleButtonProps={{ "aria-label": "Показать или скрыть пароль" }}
                required
                minLength={8}
                maxLength={72}
                error={fieldError("password")}
              />
              <PasswordInput
                id="repeat-password"
                name="repeat_password"
                label="Повторите пароль"
                autoComplete="new-password"
                visibilityToggleButtonProps={{ "aria-label": "Показать или скрыть пароль" }}
                required
                minLength={8}
                maxLength={72}
                error={fieldError("repeat_password")}
              />
              {state.message && (
                <Alert color="red" variant="light" role="alert">
                  {state.message}
                </Alert>
              )}
              <Button type="submit" fullWidth loading={pending}>
                Создать аккаунт
              </Button>
            </Stack>
            <Text mt="md" ta="center" size="sm">
              Уже есть аккаунт?{" "}
              <Anchor component={Link} href="/auth/login">Войти</Anchor>
            </Text>
          </form>
        </Stack>
      </Paper>
    </div>
  );
}
