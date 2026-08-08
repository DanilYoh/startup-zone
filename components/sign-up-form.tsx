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

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
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
            <Title order={1} size="h2">Sign up</Title>
            <Text c="dimmed" size="sm" mt={4}>Create a new account</Text>
          </div>
          <form onSubmit={handleSignUp}>
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
              <PasswordInput
                id="password"
                label="Password"
                required
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
              <PasswordInput
                id="repeat-password"
                label="Repeat Password"
                required
                value={repeatPassword}
                onChange={(event) => setRepeatPassword(event.currentTarget.value)}
              />
              {error && <Alert color="red" variant="light" role="alert">{error}</Alert>}
              <Button type="submit" fullWidth loading={isLoading}>
                Sign up
              </Button>
            </Stack>
            <Text mt="md" ta="center" size="sm">
              Already have an account?{" "}
              <Anchor component={Link} href="/auth/login">Login</Anchor>
            </Text>
          </form>
        </Stack>
      </Paper>
    </div>
  );
}
