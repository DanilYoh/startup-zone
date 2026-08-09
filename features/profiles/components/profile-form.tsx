"use client";

import {
  updateProfile,
  type ProfileActionState,
} from "@/features/profiles/server/actions";
import type { ProfileInput } from "@/features/profiles/schemas";
import type { UserRole } from "@/lib/supabase/types";
import {
  Alert,
  Avatar,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useActionState } from "react";
import styles from "./profile-form.module.css";

const initialState: ProfileActionState = { status: "idle" };

const roleLabels: Record<UserRole, string> = {
  founder: "Founder",
  specialist: "Specialist",
  investor: "Investor",
};

type ProfileFormProps = {
  email: string | null;
  profile: {
    role: UserRole;
    full_name: string | null;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    linkedin_url: string | null;
  };
};

export function ProfileForm({ email, profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const fieldError = (field: keyof ProfileInput) => state.errors?.[field]?.[0];

  return (
    <Paper withBorder shadow="xs" radius="lg" p={{ base: "md", sm: "xl" }}>
      <Stack gap="xl">
        <Group align="center" wrap="nowrap">
          <Avatar src={profile.avatar_url} name={profile.full_name ?? email ?? "Profile"} size={64} />
          <div>
            <Title order={2} size="h3">Public profile</Title>
            <Text size="sm" c="dimmed" mt={4}>
              These details help marketplace participants understand who they are working with.
            </Text>
          </div>
        </Group>

        <form action={formAction}>
          <Stack gap="md">
            <TextInput label="Email" value={email ?? "Unavailable"} readOnly disabled />
            <TextInput
              label="Role"
              value={roleLabels[profile.role]}
              readOnly
              disabled
              description="Roles are assigned once during registration and cannot be changed."
            />
            <TextInput
              id="profile-full-name"
              name="full_name"
              label="Full name"
              defaultValue={profile.full_name ?? ""}
              autoComplete="name"
              required
              error={fieldError("full_name")}
            />
            <Textarea
              id="profile-bio"
              name="bio"
              label="Description"
              defaultValue={profile.bio ?? ""}
              minRows={4}
              autosize
              error={fieldError("bio")}
            />
            <TextInput
              id="profile-location"
              name="location"
              label="Location"
              defaultValue={profile.location ?? ""}
              autoComplete="address-level2"
              error={fieldError("location")}
            />
            <TextInput
              id="profile-avatar-url"
              name="avatar_url"
              type="url"
              label="Avatar URL"
              description="Use a public HTTP(S) image URL."
              defaultValue={profile.avatar_url ?? ""}
              error={fieldError("avatar_url")}
            />
            <TextInput
              id="profile-linkedin-url"
              name="linkedin_url"
              type="url"
              label="LinkedIn URL"
              placeholder="https://www.linkedin.com/in/your-name"
              defaultValue={profile.linkedin_url ?? ""}
              error={fieldError("linkedin_url")}
            />

            {state.message && (
              <Alert
                color={state.status === "success" ? "teal" : "red"}
                variant="light"
                role={state.status === "error" ? "alert" : "status"}
              >
                {state.message}
              </Alert>
            )}

            <Button type="submit" loading={pending} className={styles.submit}>
              Save profile
            </Button>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
