import { Skeleton, Stack } from "@mantine/core";
import styles from "../dashboard.module.css";

export default function ApplicationsLoading() {
  return (
    <Stack gap="lg" className={styles.fullWidth} aria-label="Loading applications">
      <Skeleton height={48} width="45%" />
      <Skeleton height={240} radius="lg" />
    </Stack>
  );
}
