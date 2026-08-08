import { ProfileForm } from "@/features/profiles/components/profile-form";
import { getCurrentProfile } from "@/features/profiles/server/queries";
import { Alert, Stack, Text, Title } from "@mantine/core";

export default async function ProfilePage() {
  const result = await getCurrentProfile();

  return (
    <Stack gap="xl" className="w-full">
      <div>
        <Title order={1}>Profile</Title>
        <Text c="dimmed" mt={6}>
          Keep your marketplace identity accurate and useful to other participants.
        </Text>
      </div>

      {result.status === "ready" ? (
        <ProfileForm email={result.email} profile={result.profile} />
      ) : (
        <Alert color="red" variant="light" role="alert" title="Profile unavailable">
          {result.status === "missing"
            ? "Your authenticated account does not have a marketplace profile. Sign out and contact support."
            : "Your profile could not be loaded. Refresh the page and try again."}
        </Alert>
      )}
    </Stack>
  );
}

