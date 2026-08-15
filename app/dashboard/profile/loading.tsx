import { Skeleton, Stack } from "@mantine/core";
import styles from "../dashboard.module.css";

export default function ProfileLoading() {
  return (
    <Stack gap="md" className={styles.pageSkeleton} aria-label="Загрузка профиля">
      <Skeleton height={12} width={150} />
      <Skeleton height={42} className={styles.skeletonHeader} />
      <Skeleton height={680} radius="md" />
    </Stack>
  );
}
