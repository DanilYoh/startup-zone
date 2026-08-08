import { Skeleton, Stack } from "@mantine/core";

export default function ApplicationsLoading() {
  return (
    <Stack gap="lg" className="w-full" aria-label="Loading applications">
      <Skeleton height={48} width="45%" />
      <Skeleton height={240} radius="lg" />
    </Stack>
  );
}

