"use client";

import { getAuthErrorMessage } from "@/features/auth/errors";
import { updatePasswordSchema } from "@/features/auth/schemas";
import { createClient } from "@/lib/supabase/client";
import {
  Alert,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { ArrowRight, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/features/auth/components/auth-form.module.css";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const validated = updatePasswordSchema.safeParse({ password });
    if (!validated.success) {
      setError(
        validated.error.flatten().fieldErrors.password?.[0] ??
          "Введите корректный пароль",
      );
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser(validated.data);
      if (error) {
        setError(getAuthErrorMessage("password_update_failed"));
        return;
      }
      router.push("/dashboard");
    } catch {
      setError(getAuthErrorMessage("password_update_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className} {...props}>
      <Paper withBorder radius="md" p={0} className={styles.authCard}>
        <div className={styles.cardBody}>
          <span className={styles.statusIcon}>
            <KeyRound size={20} aria-hidden="true" />
          </span>
          <div className={styles.authHeader}>
            <Text className={styles.eyebrow}>Безопасность аккаунта</Text>
            <Title order={1} className={styles.authTitle}>Новый пароль</Title>
            <Text className={styles.authDescription}>Введите новый пароль.</Text>
          </div>
          <form onSubmit={handleUpdatePassword} className={styles.form}>
            <Stack gap="sm">
              <PasswordInput
                id="password"
                name="password"
                label="Новый пароль"
                placeholder="Новый пароль"
                autoComplete="new-password"
                visibilityToggleButtonProps={{ "aria-label": "Показать или скрыть пароль" }}
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
              <Text className={styles.passwordHint}>От 8 до 72 символов</Text>
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
                Сохранить пароль
              </Button>
            </Stack>
          </form>
        </div>
      </Paper>
    </div>
  );
}
