import { Skeleton, Stack } from "@mantine/core";

export default function ProfileLoading() {
  return (
    <Stack gap="lg" className="w-full" aria-label="Loading profile">
      <Skeleton height={48} width="40%" />
      <Skeleton height={620} radius="lg" />
    </Stack>
  );
}

