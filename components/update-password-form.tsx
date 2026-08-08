"use client";

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className} {...props}>
      <Paper withBorder shadow="sm" radius="lg" p="xl">
        <Stack gap="lg">
          <div>
            <Title order={1} size="h2">Reset Your Password</Title>
            <Text c="dimmed" size="sm" mt={4}>Please enter your new password below.</Text>
          </div>
          <form onSubmit={handleForgotPassword}>
            <Stack gap="md">
              <PasswordInput
                id="password"
                label="New password"
                placeholder="New password"
                required
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
              {error && <Alert color="red" variant="light" role="alert">{error}</Alert>}
              <Button type="submit" fullWidth loading={isLoading}>
                Save new password
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </div>
  );
}
