import { Paper, Stack, Text, Title } from "@mantine/core";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Stack gap="lg">
          <Paper withBorder shadow="sm" radius="lg" p="xl">
            <Stack gap="md">
              <div>
                <Title order={1} size="h2">Thank you for signing up!</Title>
                <Text c="dimmed" size="sm" mt={4}>Check your email to confirm</Text>
              </div>
              <Text size="sm" c="dimmed">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account before signing in.
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </div>
    </div>
  );
}
