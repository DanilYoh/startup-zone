"use client";

import { createClient } from "@/lib/supabase/client";
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
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
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
            <Title order={1} size="h2">Login</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Enter your email below to login to your account
            </Text>
          </div>
          <form onSubmit={handleLogin}>
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
              <Stack gap={6}>
                <PasswordInput
                  id="password"
                  label="Password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                />
                <Anchor component={Link} href="/auth/forgot-password" size="sm" ta="right">
                  Forgot your password?
                </Anchor>
              </Stack>
              {error && <Alert color="red" variant="light" role="alert">{error}</Alert>}
              <Button type="submit" fullWidth loading={isLoading}>
                Login
              </Button>
            </Stack>
            <Text mt="md" ta="center" size="sm">
              Don&apos;t have an account?{" "}
              <Anchor component={Link} href="/auth/sign-up">
                Sign up
              </Anchor>
            </Text>
          </form>
        </Stack>
      </Paper>
    </div>
  );
}
