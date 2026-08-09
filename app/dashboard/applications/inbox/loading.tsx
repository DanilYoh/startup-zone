import { Skeleton, Stack } from "@mantine/core";
import styles from "../../dashboard.module.css";

export default function InboxLoading() {
  return (
    <Stack gap="lg" className={styles.fullWidth} aria-label="Loading investor interest">
      <Skeleton height={48} width="50%" />
      <Skeleton height={360} radius="lg" />
    </Stack>
  );
}
