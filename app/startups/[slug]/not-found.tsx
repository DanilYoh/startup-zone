import { LinkButton } from "@/components/link-button";
import { Paper, Stack, Text, Title } from "@mantine/core";
import styles from "../startups.module.css";

export default function StartupNotFound() {
  return (
    <div className={styles.narrowContainer}>
      <Paper withBorder radius="lg" p={{ base: "lg", sm: "xl" }}>
        <Stack gap="md" align="flex-start">
          <Title order={1} size="h2">
            Startup not found
          </Title>
          <Text c="dimmed">
            This project does not exist or is no longer active in the public directory.
          </Text>
          <LinkButton href="/startups">Browse active startups</LinkButton>
        </Stack>
      </Paper>
    </div>
  );
}
