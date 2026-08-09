import { Group, Text } from "@mantine/core";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "./link-button";
import { LogoutButton } from "./logout-button";
import styles from "./auth-button.module.css";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <Group gap="xs" wrap="nowrap">
      <Text size="sm" className={styles.email}>
        {typeof user.email === "string" ? user.email : "Signed in"}
      </Text>
      <LogoutButton />
    </Group>
  ) : (
    <Group gap="xs" wrap="nowrap">
      <LinkButton
        href="/auth/login"
        size="compact-sm"
        variant="outline"
        className={styles.darkSurfaceOutline}
      >
        Sign in
      </LinkButton>
      <LinkButton href="/auth/sign-up" size="compact-sm">
        Sign up
      </LinkButton>
    </Group>
  );
}
