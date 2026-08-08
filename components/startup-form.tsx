"use client";

import {
  createStartup,
  type StartupActionState,
} from "@/app/actions/startup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startupStageLabels, startupStages, type StartupInput } from "@/lib/validations";
import { useActionState } from "react";

const controlClassName =
  "min-h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30";
const initialStartupActionState: StartupActionState = { status: "idle" };

function FieldError({
  field,
  state,
}: {
  field: keyof StartupInput;
  state: StartupActionState;
}) {
  const message = state.errors?.[field]?.[0];
  if (!message) return null;

  return (
    <p id={`${field}-error`} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function StartupForm() {
  const [state, formAction, pending] = useActionState(
    createStartup,
    initialStartupActionState,
  );

  const invalid = (field: keyof StartupInput) => Boolean(state.errors?.[field]?.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish a startup</CardTitle>
        <CardDescription>
          Add the core information founders, specialists, and investors need to understand the
          project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="title">Startup name</Label>
              <Input
                id="title"
                name="title"
                minLength={3}
                maxLength={80}
                required
                aria-invalid={invalid("title")}
                aria-describedby={invalid("title") ? "title-error" : undefined}
              />
              <FieldError field="title" state={state} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="climate-lens"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                minLength={3}
                maxLength={60}
                required
                aria-invalid={invalid("slug")}
                aria-describedby={invalid("slug") ? "slug-error" : "slug-help"}
              />
              <p id="slug-help" className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens.
              </p>
              <FieldError field="slug" state={state} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stage">Stage</Label>
              <select
                id="stage"
                name="stage"
                defaultValue=""
                required
                className={controlClassName}
                aria-invalid={invalid("stage")}
                aria-describedby={invalid("stage") ? "stage-error" : undefined}
              >
                <option value="" disabled>
                  Select a stage
                </option>
                {startupStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {startupStageLabels[stage]}
                  </option>
                ))}
              </select>
              <FieldError field="stage" state={state} />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="one_pager">One-line summary</Label>
              <Input
                id="one_pager"
                name="one_pager"
                minLength={10}
                maxLength={240}
                required
                aria-invalid={invalid("one_pager")}
                aria-describedby={invalid("one_pager") ? "one_pager-error" : undefined}
              />
              <FieldError field="one_pager" state={state} />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={7}
                minLength={50}
                maxLength={5000}
                required
                className={controlClassName}
                aria-invalid={invalid("description")}
                aria-describedby={invalid("description") ? "description-error" : undefined}
              />
              <FieldError field="description" state={state} />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="niche">Niches</Label>
              <Input
                id="niche"
                name="niche"
                placeholder="ClimateTech, B2B SaaS"
                required
                aria-invalid={invalid("niche")}
                aria-describedby={invalid("niche") ? "niche-error" : "niche-help"}
              />
              <p id="niche-help" className="text-xs text-muted-foreground">
                Separate up to eight niches with commas.
              </p>
              <FieldError field="niche" state={state} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="funding_ask">Funding ask (USD)</Label>
              <Input
                id="funding_ask"
                name="funding_ask"
                type="number"
                min="1"
                max="1000000000"
                step="1"
                inputMode="numeric"
                aria-invalid={invalid("funding_ask")}
                aria-describedby={invalid("funding_ask") ? "funding_ask-error" : undefined}
              />
              <FieldError field="funding_ask" state={state} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="equity_offered">Equity offered (%)</Label>
              <Input
                id="equity_offered"
                name="equity_offered"
                type="number"
                min="0"
                max="100"
                step="0.1"
                inputMode="decimal"
                aria-invalid={invalid("equity_offered")}
                aria-describedby={invalid("equity_offered") ? "equity_offered-error" : undefined}
              />
              <FieldError field="equity_offered" state={state} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                name="website_url"
                type="url"
                placeholder="https://example.com"
                aria-invalid={invalid("website_url")}
                aria-describedby={invalid("website_url") ? "website_url-error" : undefined}
              />
              <FieldError field="website_url" state={state} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deck_url">Pitch deck URL</Label>
              <Input
                id="deck_url"
                name="deck_url"
                type="url"
                placeholder="https://example.com/deck"
                aria-invalid={invalid("deck_url")}
                aria-describedby={invalid("deck_url") ? "deck_url-error" : undefined}
              />
              <FieldError field="deck_url" state={state} />
            </div>
          </div>

          {state.status === "error" && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Publishing…" : "Publish startup"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
