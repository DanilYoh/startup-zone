import { Group, Text } from "@mantine/core";
import { hasEnvVars } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { EnvVarWarning } from "./env-var-warning";
import { LinkButton } from "./link-button";
import { LogoutButton } from "./logout-button";
import styles from "./auth-button.module.css";

export async function AuthButton() {
  if (!hasEnvVars) return <EnvVarWarning />;

  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <Group gap="xs" wrap="nowrap">
      <Text size="sm" className={styles.email}>
        {typeof user.email === "string" ? user.email : "Выполнен вход"}
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
        Войти
      </LinkButton>
      <LinkButton href="/auth/sign-up" size="compact-sm">
        Регистрация
      </LinkButton>
    </Group>
  );
}
