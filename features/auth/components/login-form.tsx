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

const initialState: SignInActionState = { status: "idle" };

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const fieldError = (field: keyof SignInInput) => state.errors?.[field]?.[0];

  return (
    <div className={className} {...props}>
      <Paper withBorder shadow="sm" radius="lg" p="xl">
        <Stack gap="lg">
          <div>
            <Title order={1} size="h2">Login</Title>
            <Text c="dimmed" size="sm" mt={4}>Enter your email to access your marketplace dashboard.</Text>
          </div>
          <form action={formAction}>
            <Stack gap="md">
              <TextInput
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="m@example.com"
                autoComplete="email"
                required
                error={fieldError("email")}
              />
              <Stack gap={6}>
                <PasswordInput
                  id="password"
                  name="password"
                  label="Password"
                  autoComplete="current-password"
                  required
                  error={fieldError("password")}
                />
                <Anchor component={Link} href="/auth/forgot-password" size="sm" ta="right">
                  Forgot your password?
                </Anchor>
              </Stack>
              {state.message && <Alert color="red" variant="light" role="alert">{state.message}</Alert>}
              <Button type="submit" fullWidth loading={pending}>Login</Button>
            </Stack>
            <Text mt="md" ta="center" size="sm">
              Don&apos;t have an account?{" "}
              <Anchor component={Link} href="/auth/sign-up">Sign up</Anchor>
            </Text>
          </form>
        </Stack>
      </Paper>
    </div>
  );
}
