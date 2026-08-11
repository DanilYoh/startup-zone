import { PrivacyControls } from "@/features/account/components/privacy-controls";
import { Stack, Text, Title } from "@mantine/core";
import styles from "../dashboard.module.css";

export default function AccountPage() {
  return (
    <Stack gap="xl" className={styles.fullWidth}>
      <div>
        <Title order={1}>Данные аккаунта</Title>
        <Text c="dimmed" mt={6}>
          Управляйте копией своих данных и полным завершением работы с площадкой.
        </Text>
      </div>
      <PrivacyControls />
    </Stack>
  );
}
