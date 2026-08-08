"use client";

import { Alert, Button, Stack } from "@mantine/core";

export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <Alert color="red" title="Profile unavailable" role="alert" className="w-full">
      <Stack gap="md">
        Something unexpected happened while loading the profile.
        <Button variant="light" color="red" onClick={reset} className="self-start">
          Try again
        </Button>
      </Stack>
    </Alert>
  );
}

