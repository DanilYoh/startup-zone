"use client";

import { signUp, type SignUpActionState } from "@/features/auth/server/actions";
import { marketplaceRoleLabels, marketplaceRoles, type SignUpInput } from "@/features/auth/schemas";
import {
  Alert,
  Anchor,
  Button,
  NativeSelect,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useActionState } from "react";

const initialState: SignUpActionState = { status: "idle" };

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const fieldError = (field: keyof SignUpInput) => state.errors?.[field]?.[0];

  return (
    <div className={className} {...props}>
      <Paper withBorder shadow="sm" radius="lg" p="xl">
        <Stack gap="lg">
          <div>
            <Title order={1} size="h2">Create your account</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Choose the role that matches how you will use Startup Zone.
            </Text>
          </div>
          <form action={formAction}>
            <Stack gap="md">
              <TextInput
                id="full-name"
                name="full_name"
                label="Full name"
                autoComplete="name"
                required
                error={fieldError("full_name")}
              />
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
              <NativeSelect
                id="role"
                name="role"
                label="Role"
                description="Your role is assigned during registration and cannot be changed later."
                data={marketplaceRoles.map((role) => ({
                  value: role,
                  label: marketplaceRoleLabels[role],
                }))}
                required
                error={fieldError("role")}
              />
              <PasswordInput
                id="password"
                name="password"
                label="Password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                error={fieldError("password")}
              />
              <PasswordInput
                id="repeat-password"
                name="repeat_password"
                label="Repeat password"
                autoComplete="new-password"
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
                Create account
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
