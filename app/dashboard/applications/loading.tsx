import { Skeleton, Stack } from "@mantine/core";
import styles from "../dashboard.module.css";

export default function ApplicationsLoading() {
  return (
    <Stack gap="md" className={styles.pageSkeleton} aria-label="Загрузка инвестиционных заявок">
      <Skeleton height={12} width={170} />
      <Skeleton height={42} className={styles.skeletonHeader} />
      <Skeleton height={300} radius="md" />
    </Stack>
  );
}
