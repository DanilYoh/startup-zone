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
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <Paper withBorder shadow="sm" radius="lg" p="xl">
        <Stack gap="lg">
          <div>
            <Title order={1} size="h2">Новый пароль</Title>
            <Text c="dimmed" size="sm" mt={4}>Введите новый пароль.</Text>
          </div>
          <form onSubmit={handleUpdatePassword}>
            <Stack gap="md">
              <PasswordInput
                id="password"
                label="Новый пароль"
                placeholder="Новый пароль"
                visibilityToggleButtonProps={{ "aria-label": "Показать или скрыть пароль" }}
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
              {error && <Alert color="red" variant="light" role="alert">{error}</Alert>}
              <Button type="submit" fullWidth loading={isLoading}>
                Сохранить пароль
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </div>
  );
}
