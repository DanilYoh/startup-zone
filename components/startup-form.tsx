"use client";

import {
  createStartup,
  type StartupActionState,
} from "@/app/actions/startup";
import { startupStageLabels, startupStages, type StartupInput } from "@/lib/validations";
import {
  Alert,
  Button,
  NativeSelect,
  NumberInput,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useActionState } from "react";

const initialStartupActionState: StartupActionState = { status: "idle" };

export function StartupForm() {
  const [state, formAction, pending] = useActionState(
    createStartup,
    initialStartupActionState,
  );

  const fieldError = (field: keyof StartupInput) => state.errors?.[field]?.[0];

  return (
    <Paper withBorder shadow="sm" radius="lg" p={{ base: "md", sm: "xl" }}>
      <Stack gap="xl">
        <div>
          <Title order={1} size="h2">Publish a startup</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Add the core information founders, specialists, and investors need to understand the
            project.
          </Text>
        </div>
        <form action={formAction} className="grid gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              className="sm:col-span-2"
              id="title"
              name="title"
              label="Startup name"
              minLength={3}
              maxLength={80}
              required
              error={fieldError("title")}
            />

            <TextInput
              id="slug"
              name="slug"
              label="Slug"
              description="Lowercase letters, numbers, and hyphens."
              placeholder="climate-lens"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              minLength={3}
              maxLength={60}
              required
              error={fieldError("slug")}
            />

            <NativeSelect
              id="stage"
              name="stage"
              label="Stage"
              data={[
                { value: "", label: "Select a stage", disabled: true },
                ...startupStages.map((stage) => ({
                  value: stage,
                  label: startupStageLabels[stage],
                })),
              ]}
              defaultValue=""
              required
              error={fieldError("stage")}
            />

            <TextInput
              className="sm:col-span-2"
              id="one_pager"
              name="one_pager"
              label="One-line summary"
              minLength={10}
              maxLength={240}
              required
              error={fieldError("one_pager")}
            />

            <Textarea
              className="sm:col-span-2"
              id="description"
              name="description"
              label="Description"
              rows={7}
              minLength={50}
              maxLength={5000}
              required
              error={fieldError("description")}
            />

            <TextInput
              className="sm:col-span-2"
              id="niche"
              name="niche"
              label="Niches"
              description="Separate up to eight niches with commas."
              placeholder="ClimateTech, B2B SaaS"
              required
              error={fieldError("niche")}
            />

            <NumberInput
              id="funding_ask"
              name="funding_ask"
              label="Funding ask (USD)"
              min={1}
              max={1_000_000_000}
              decimalScale={0}
              allowNegative={false}
              error={fieldError("funding_ask")}
            />

            <NumberInput
              id="equity_offered"
              name="equity_offered"
              label="Equity offered (%)"
              min={0}
              max={100}
              decimalScale={1}
              allowNegative={false}
              rightSection="%"
              error={fieldError("equity_offered")}
            />

            <TextInput
              id="website_url"
              name="website_url"
              type="url"
              label="Website URL"
              placeholder="https://example.com"
              error={fieldError("website_url")}
            />

            <TextInput
              id="deck_url"
              name="deck_url"
              type="url"
              label="Pitch deck URL"
              placeholder="https://example.com/deck"
              error={fieldError("deck_url")}
            />
          </div>

          {state.status === "error" && (
            <Alert color="red" variant="light" role="alert">
              {state.message}
            </Alert>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="md" loading={pending}>
              Publish startup
            </Button>
          </div>
        </form>
      </Stack>
    </Paper>
  );
}
