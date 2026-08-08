"use client";

import { Alert, Button, Stack, Title } from "@mantine/core";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Next.js instrumentation records the sanitized server-side failure.
    void error.digest;
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-5 py-12">
      <Stack gap="lg" className="w-full">
        <Title order={1}>Something went wrong</Title>
        <Alert color="red" title="This page could not be loaded">
          Try the request again. If the problem continues, return to the dashboard.
        </Alert>
        <div>
          <Button onClick={reset}>Try again</Button>
        </div>
      </Stack>
    </main>
  );
}
