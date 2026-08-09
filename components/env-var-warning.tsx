import { Badge, Button, Group } from "@mantine/core";
import styles from "./env-var-warning.module.css";

export function EnvVarWarning() {
  return (
    <Group gap="xs" wrap="nowrap" title="Add the variables from .env.example to enable authentication">
      <Badge variant="outline" color="gray" className={styles.badge}>
        Demo mode
      </Badge>
      <Button size="compact-sm" variant="outline" disabled>
        Sign in
      </Button>
    </Group>
  );
}
