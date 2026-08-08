"use client";

import { Alert, Button, Stack } from "@mantine/core";

export default function EditStartupError({ reset }: { reset: () => void }) {
  return (
    <Alert color="red" title="Startup unavailable" role="alert" className="w-full">
      <Stack gap="md">
        Something unexpected happened while loading this startup.
        <Button variant="light" color="red" onClick={reset} className="self-start">
          Try again
        </Button>
      </Stack>
    </Alert>
  );
}
