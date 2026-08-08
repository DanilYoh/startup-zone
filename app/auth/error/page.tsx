import { Paper, Stack, Text, Title } from "@mantine/core";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <Text size="sm" c="dimmed">
          Code error: {params.error}
        </Text>
      ) : (
        <Text size="sm" c="dimmed">
          An unspecified error occurred.
        </Text>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
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
