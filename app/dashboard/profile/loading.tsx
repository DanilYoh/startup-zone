import { Skeleton, Stack } from "@mantine/core";
import styles from "../dashboard.module.css";

export default function ProfileLoading() {
  return (
    <Stack gap="lg" className={styles.fullWidth} aria-label="Загрузка профиля">
      <Skeleton height={48} width="40%" />
      <Skeleton height={620} radius="lg" />
    </Stack>
  );
}
