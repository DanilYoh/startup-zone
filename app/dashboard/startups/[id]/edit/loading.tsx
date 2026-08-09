import { Skeleton } from "@mantine/core";
import styles from "../../../dashboard.module.css";

export default function EditStartupLoading() {
  return <Skeleton height="44rem" radius="lg" className={styles.formSkeleton} />;
}
