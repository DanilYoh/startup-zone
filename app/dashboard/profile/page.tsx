import { ProfileForm } from "@/features/profiles/components/profile-form";
import { ProfileContactForm } from "@/features/profiles/components/profile-contact-form";
import { getCurrentProfile } from "@/features/profiles/server/queries";
import { Alert, Stack, Text, Title } from "@mantine/core";
import styles from "../dashboard.module.css";

export default async function ProfilePage() {
  const result = await getCurrentProfile();

  return (
    <Stack gap="xl" className={styles.pageStack}>
      <header className={styles.pageHeader}>
        <Text className={styles.eyebrow}>Account / Profile</Text>
        <Title order={1}>Профиль</Title>
        <Text className={styles.pageDescription}>
          Поддерживайте в актуальном состоянии данные, по которым оценивают будущий разговор.
        </Text>
      </header>

      {result.status === "ready" ? (
        <>
          <ProfileForm email={result.email} profile={result.profile} />
          <ProfileContactForm accountEmail={result.email} contact={result.contact} />
        </>
      ) : (
        <Alert color="red" variant="light" role="alert" title="Профиль недоступен" className={styles.errorState}>
          {result.status === "missing"
            ? "У аккаунта нет профиля на площадке. Выйдите и обратитесь в поддержку."
            : result.status === "retired"
              ? "У аккаунта нет активной роли основателя или инвестора. Создайте новый аккаунт или обратитесь в поддержку."
            : "Не удалось загрузить профиль. Обновите страницу."}
        </Alert>
      )}
    </Stack>
  );
}
