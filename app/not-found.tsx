import { Button, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import styles from "./status.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <Stack gap="lg" className={styles.content}>
        <Text c="dimmed" fw={600}>404</Text>
        <Title order={1}>Страница не найдена</Title>
        <Text c="dimmed">Возможно, страница перемещена или адрес указан неверно.</Text>
        <div>
          <Link href="/">
            <Button component="span">На главную</Button>
          </Link>
        </div>
      </Stack>
    </main>
  );
}
