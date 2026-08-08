import { Group, Text } from "@mantine/core";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "./link-button";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <Group gap="xs" wrap="nowrap">
      <Text size="sm" c="dimmed" className="hidden max-w-48 truncate lg:block">
        {typeof user.email === "string" ? user.email : "Signed in"}
      </Text>
      <LogoutButton />
    </Group>
  ) : (
    <Group gap="xs" wrap="nowrap">
      <LinkButton href="/auth/login" size="compact-sm" variant="outline">
        Sign in
      </LinkButton>
      <LinkButton href="/auth/sign-up" size="compact-sm">
        Sign up
      </LinkButton>
    </Group>
  );
}
