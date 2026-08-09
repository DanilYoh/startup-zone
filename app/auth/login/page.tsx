import { LoginForm } from "@/features/auth/components/login-form";
import styles from "../auth-layout.module.css";

export default function Page() {
  return (
    <div className={styles.page}>
      <div className={styles.narrow}>
        <LoginForm />
      </div>
    </div>
  );
}
