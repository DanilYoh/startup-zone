import { Skeleton, Stack } from "@mantine/core";

export default function InboxLoading() {
  return (
    <Stack gap="lg" className="w-full" aria-label="Loading incoming applications">
      <Skeleton height={48} width="50%" />
      <Skeleton height={360} radius="lg" />
    </Stack>
  );
}

