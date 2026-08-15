import { PrivacyControls } from "@/features/account/components/privacy-controls";
import { Stack, Text, Title } from "@mantine/core";
import styles from "../dashboard.module.css";

export default function AccountPage() {
  return (
    <Stack gap="xl" className={styles.pageStack}>
      <header className={styles.pageHeader}>
        <Text className={styles.eyebrow}>Account / Data controls</Text>
        <Title order={1}>Данные аккаунта</Title>
        <Text className={styles.pageDescription}>
          Управляйте копией своих данных и полным завершением работы с площадкой.
        </Text>
      </header>
      <PrivacyControls />
    </Stack>
  );
}
