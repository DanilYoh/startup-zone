"use client";

import {
  updateProfile,
  type ProfileActionState,
} from "@/features/profiles/server/actions";
import type { ProfileInput } from "@/features/profiles/schemas";
import type { MarketplaceRole, StartupStage } from "@/lib/domain-types";
import { startupStageLabels, startupStages } from "@/lib/validations";
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Divider,
  Group,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useActionState } from "react";
import styles from "./profile-form.module.css";

const initialState: ProfileActionState = { status: "idle" };

const roleLabels: Record<MarketplaceRole, string> = {
  founder: "Founder",
  investor: "Investor",
};

const roleIntroductions: Record<MarketplaceRole, string> = {
  founder: "Show the experience and point of view behind the startups you publish.",
  investor: "Make your thesis, preferred stages, and typical ticket clear before you reach out.",
};

type ProfileFormProps = {
  email: string | null;
  profile: {
    role: MarketplaceRole;
    full_name: string | null;
    headline: string | null;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    linkedin_url: string | null;
    founder_experience: string | null;
    investor_organization: string | null;
    investment_thesis: string | null;
    preferred_stages: StartupStage[];
    ticket_min: number | null;
    ticket_max: number | null;
    website_url: string | null;
  };
};

export function ProfileForm({ email, profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const fieldError = (field: keyof ProfileInput) => state.errors?.[field]?.[0];

  return (
    <Paper withBorder shadow="sm" radius="xl" p={{ base: "md", sm: "xl" }} className={styles.card}>
      <Stack gap="xl">
        <div className={styles.profileHero}>
          <Group align="center" wrap="nowrap">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name ?? email ?? "Profile"}
              size={72}
              radius="xl"
            />
            <div>
              <Text className={styles.roleLabel}>{roleLabels[profile.role]} profile</Text>
              <Title order={2} size="h3">A useful profile answers the next question.</Title>
              <Text size="sm" c="dimmed" mt={5}>
                {roleIntroductions[profile.role]}
              </Text>
            </div>
          </Group>
          <div className={styles.blueprint}>
            <Text size="xs" fw={700} tt="uppercase" className={styles.blueprintLabel}>
              Profile structure
            </Text>
            <Text size="sm">
              {profile.role === "founder"
                ? "Identity → founder credibility → startup context → trusted links"
                : "Identity → organization → investment thesis → stages and ticket → trusted links"}
            </Text>
          </div>
        </div>

        <form action={formAction}>
          <Stack gap="xl">
            <section className={styles.formSection} aria-labelledby="profile-identity-heading">
              <div>
                <Title order={3} size="h4" id="profile-identity-heading">Identity</Title>
                <Text size="sm" c="dimmed" mt={4}>The stable facts people use to understand who you are.</Text>
              </div>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  id="profile-full-name"
                  name="full_name"
                  label="Full name"
                  defaultValue={profile.full_name ?? ""}
                  autoComplete="name"
                  required
                  error={fieldError("full_name")}
                />
                <TextInput
                  id="profile-headline"
                  name="headline"
                  label="Professional headline"
                  placeholder={profile.role === "founder" ? "Founder · Climate infrastructure" : "Partner · Seed-stage B2B"}
                  defaultValue={profile.headline ?? ""}
                  maxLength={120}
                  error={fieldError("headline")}
                />
                <TextInput
                  id="profile-location"
                  name="location"
                  label="Location"
                  defaultValue={profile.location ?? ""}
                  autoComplete="address-level2"
                  error={fieldError("location")}
                />
                <TextInput label="Email" value={email ?? "Unavailable"} readOnly disabled />
                <TextInput
                  label="Role"
                  value={roleLabels[profile.role]}
                  readOnly
                  disabled
                  description="Assigned during registration and locked."
                />
              </SimpleGrid>
              <Textarea
                id="profile-bio"
                name="bio"
                label="About"
                description="A concise point of view, not a full résumé."
                defaultValue={profile.bio ?? ""}
                minRows={4}
                autosize
                error={fieldError("bio")}
              />
            </section>

            <Divider />

            {profile.role === "founder" ? (
              <section className={styles.formSection} aria-labelledby="founder-credibility-heading">
                <div>
                  <Title order={3} size="h4" id="founder-credibility-heading">Founder credibility</Title>
                  <Text size="sm" c="dimmed" mt={4}>Give investors the context that is not already in your startup page.</Text>
                </div>
                <Textarea
                  id="profile-founder-experience"
                  name="founder_experience"
                  label="Relevant founder experience"
                  description="Domain expertise, previous products, customer access, or a hard-won insight."
                  aria-describedby="founder-experience-visibility"
                  defaultValue={profile.founder_experience ?? ""}
                  minRows={5}
                  autosize
                  maxLength={1_200}
                  error={fieldError("founder_experience")}
                />
                <Text id="founder-experience-visibility" size="xs" c="dimmed">
                  This professional summary appears beside your active public startup pages.
                </Text>
              </section>
            ) : (
              <section className={styles.formSection} aria-labelledby="investor-fit-heading">
                <div>
                  <Title order={3} size="h4" id="investor-fit-heading">Investment fit</Title>
                  <Text size="sm" c="dimmed" mt={4}>Help founders qualify the conversation before either side spends time.</Text>
                </div>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    id="profile-investor-organization"
                    name="investor_organization"
                    label="Fund or organization"
                    defaultValue={profile.investor_organization ?? ""}
                    maxLength={120}
                    error={fieldError("investor_organization")}
                  />
                  <TextInput
                    id="profile-website-url"
                    name="website_url"
                    type="url"
                    label="Organization website"
                    placeholder="https://example.com"
                    defaultValue={profile.website_url ?? ""}
                    error={fieldError("website_url")}
                  />
                </SimpleGrid>
                <Textarea
                  id="profile-investment-thesis"
                  name="investment_thesis"
                  label="Investment thesis"
                  description="What you invest in, why now, and what makes a startup a strong fit."
                  defaultValue={profile.investment_thesis ?? ""}
                  minRows={5}
                  autosize
                  maxLength={1_500}
                  error={fieldError("investment_thesis")}
                />
                <fieldset className={styles.stageFieldset}>
                  <legend>Preferred stages</legend>
                  <Text size="xs" c="dimmed" mb="sm">Select every stage you actively consider.</Text>
                  <div className={styles.stageGrid}>
                    {startupStages.map((stage) => (
                      <Checkbox
                        key={stage}
                        name="preferred_stages"
                        value={stage}
                        label={startupStageLabels[stage]}
                        defaultChecked={profile.preferred_stages.includes(stage)}
                      />
                    ))}
                  </div>
                  {fieldError("preferred_stages") && (
                    <Text size="xs" c="red" mt="xs">{fieldError("preferred_stages")}</Text>
                  )}
                </fieldset>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <NumberInput
                    id="profile-ticket-min"
                    name="ticket_min"
                    label="Minimum ticket (USD)"
                    defaultValue={profile.ticket_min ?? undefined}
                    min={1}
                    max={1_000_000_000}
                    decimalScale={0}
                    allowNegative={false}
                    thousandSeparator=","
                    error={fieldError("ticket_min")}
                  />
                  <NumberInput
                    id="profile-ticket-max"
                    name="ticket_max"
                    label="Maximum ticket (USD)"
                    defaultValue={profile.ticket_max ?? undefined}
                    min={1}
                    max={1_000_000_000}
                    decimalScale={0}
                    allowNegative={false}
                    thousandSeparator=","
                    error={fieldError("ticket_max")}
                  />
                </SimpleGrid>
              </section>
            )}

            <Divider />

            <section className={styles.formSection} aria-labelledby="profile-links-heading">
              <div>
                <Title order={3} size="h4" id="profile-links-heading">Trusted links</Title>
                <Text size="sm" c="dimmed" mt={4}>Use public URLs that help the other side verify your identity.</Text>
              </div>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  id="profile-avatar-url"
                  name="avatar_url"
                  type="url"
                  label="Avatar URL"
                  defaultValue={profile.avatar_url ?? ""}
                  error={fieldError("avatar_url")}
                />
                <TextInput
                  id="profile-linkedin-url"
                  name="linkedin_url"
                  type="url"
                  label="LinkedIn URL"
                  placeholder="https://www.linkedin.com/in/your-name"
                  defaultValue={profile.linkedin_url ?? ""}
                  error={fieldError("linkedin_url")}
                />
              </SimpleGrid>
            </section>

            {state.message && (
              <Alert
                color={state.status === "success" ? "teal" : "red"}
                variant="light"
                role={state.status === "error" ? "alert" : "status"}
              >
                {state.message}
              </Alert>
            )}

            <Button type="submit" loading={pending} className={styles.submit}>
              Save profile
            </Button>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
