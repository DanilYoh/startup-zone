import { Button, Stack, Text, Title } from "@mantine/core";
import { FileQuestion } from "lucide-react";
import Link from "next/link";
import styles from "./status.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <Stack gap="lg" className={styles.content}>
        <div className={styles.statusHeader}>
          <span className={styles.statusIcon}>
            <FileQuestion size={18} aria-hidden="true" />
          </span>
          <Text className={styles.statusCode}>Ошибка 404</Text>
        </div>
        <Title order={1}>Страница не найдена</Title>
        <Text c="dimmed">Возможно, страница перемещена или адрес указан неверно.</Text>
        <div className={styles.actions}>
          <Link href="/">
            <Button component="span">На главную</Button>
          </Link>
        </div>
      </Stack>
    </main>
  );
}
