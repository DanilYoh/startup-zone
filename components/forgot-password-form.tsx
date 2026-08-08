"use client";

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
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
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
              <Title order={1} size="h2">Check Your Email</Title>
              <Text c="dimmed" size="sm" mt={4}>Password reset instructions sent</Text>
            </div>
            <Text size="sm" c="dimmed">
              If you registered using your email and password, you will receive
              a password reset email.
            </Text>
          </Stack>
        </Paper>
      ) : (
        <Paper withBorder shadow="sm" radius="lg" p="xl">
          <Stack gap="lg">
            <div>
              <Title order={1} size="h2">Reset Your Password</Title>
              <Text c="dimmed" size="sm" mt={4}>
                Type in your email and we&apos;ll send you a link to reset your password
              </Text>
            </div>
            <form onSubmit={handleForgotPassword}>
              <Stack gap="md">
                <TextInput
                  id="email"
                  type="email"
                  label="Email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                />
                {error && <Alert color="red" variant="light" role="alert">{error}</Alert>}
                <Button type="submit" fullWidth loading={isLoading}>
                  Send reset email
                </Button>
              </Stack>
              <Text mt="md" ta="center" size="sm">
                Already have an account?{" "}
                <Anchor component={Link} href="/auth/login">Login</Anchor>
              </Text>
            </form>
          </Stack>
        </Paper>
      )}
    </div>
  );
}
