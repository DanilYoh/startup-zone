import { Button, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-5 py-12">
      <Stack gap="lg" className="w-full">
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
