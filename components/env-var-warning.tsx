import { Badge, Button, Group } from "@mantine/core";
import styles from "./env-var-warning.module.css";

export function EnvVarWarning() {
  return (
    <Group gap="xs" wrap="nowrap" title="Добавьте переменные из .env.example, чтобы включить аутентификацию">
      <Badge variant="outline" color="gray" className={styles.badge}>
        Деморежим
      </Badge>
      <Button size="compact-sm" variant="outline" disabled>
        Войти
      </Button>
    </Group>
  );
}
