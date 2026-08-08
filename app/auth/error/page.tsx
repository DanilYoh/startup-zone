import { getAuthErrorMessage } from "@/features/auth/errors";
import { Paper, Stack, Text, Title } from "@mantine/core";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const params = await searchParams;

  return (
    <Text size="sm" c="dimmed">
      {getAuthErrorMessage(params.code)}
    </Text>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Stack gap="lg">
          <Paper withBorder shadow="sm" radius="lg" p="xl">
            <Stack gap="md">
              <Title order={1} size="h2">Sorry, something went wrong.</Title>
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
            </Stack>
          </Paper>
        </Stack>
      </div>
    </div>
  );
}
