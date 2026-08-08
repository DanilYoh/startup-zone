"use client";

import { Alert, Button, Stack } from "@mantine/core";

export default function InboxError({ reset }: { reset: () => void }) {
  return (
    <Alert color="red" title="Applications unavailable" role="alert" className="w-full">
      <Stack gap="md">
        Something unexpected happened while loading incoming applications.
        <Button color="red" variant="light" onClick={reset} className="self-start">Try again</Button>
      </Stack>
    </Alert>
  );
}

