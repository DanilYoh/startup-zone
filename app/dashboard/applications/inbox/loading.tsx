import { Skeleton, Stack } from "@mantine/core";
import styles from "../../dashboard.module.css";

export default function InboxLoading() {
  return (
    <Stack gap="md" className={styles.pageSkeleton} aria-label="Загрузка заявок инвесторов">
      <Skeleton height={12} width={170} />
      <Skeleton height={42} className={styles.skeletonHeader} />
      <Skeleton height={420} radius="md" />
    </Stack>
  );
}
