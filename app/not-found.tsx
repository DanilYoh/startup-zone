import { Button, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import styles from "./status.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <Stack gap="lg" className={styles.content}>
        <Text c="dimmed" fw={600}>404</Text>
        <Title order={1}>Page not found</Title>
        <Text c="dimmed">The page may have moved, or the address may be incorrect.</Text>
        <div>
          <Link href="/">
            <Button component="span">Return home</Button>
          </Link>
        </div>
      </Stack>
    </main>
  );
}
