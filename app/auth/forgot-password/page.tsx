import { ForgotPasswordForm } from "@/components/forgot-password-form";
import styles from "../auth-layout.module.css";

export default function Page() {
  return (
    <div className={styles.page}>
      <div className={styles.narrow}>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
