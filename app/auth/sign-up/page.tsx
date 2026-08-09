import { SignUpForm } from "@/features/auth/components/sign-up-form";
import styles from "../auth-layout.module.css";

export default function Page() {
  return (
    <div className={styles.page}>
      <div className={styles.wide}>
        <SignUpForm />
      </div>
    </div>
  );
}
