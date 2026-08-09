import { ProfileForm } from "@/features/profiles/components/profile-form";
import { getCurrentProfile } from "@/features/profiles/server/queries";
import { Alert, Stack, Text, Title } from "@mantine/core";
import styles from "../dashboard.module.css";

export default async function ProfilePage() {
  const result = await getCurrentProfile();

  return (
    <Stack gap="xl" className={styles.fullWidth}>
      <div>
        <Title order={1}>Profile</Title>
        <Text c="dimmed" mt={6}>
          Keep the information founders and investors use to qualify a conversation accurate.
        </Text>
      </div>

      {result.status === "ready" ? (
        <ProfileForm email={result.email} profile={result.profile} />
      ) : (
        <Alert color="red" variant="light" role="alert" title="Profile unavailable">
          {result.status === "missing"
            ? "Your authenticated account does not have a marketplace profile. Sign out and contact support."
            : result.status === "retired"
              ? "This account does not have an active founder or investor role. Create a new marketplace account or contact support."
            : "Your profile could not be loaded. Refresh the page and try again."}
        </Alert>
      )}
    </Stack>
  );
}
