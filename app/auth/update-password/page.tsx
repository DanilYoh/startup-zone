import { UpdatePasswordForm } from "@/components/update-password-form";
import styles from "../auth-layout.module.css";

export default function Page() {
  return (
    <div className={styles.page}>
      <div className={styles.narrow}>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
