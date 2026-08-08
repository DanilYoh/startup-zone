"use server";

import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/logger";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/types";
import { parseStartupForm } from "@/lib/startup-form";
import type { StartupInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type StartupActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof StartupInput, string[]>>;
};

const startupIdSchema = z.coerce.number().int().positive();
const startupStatusSchema = z.object({
  startup_id: startupIdSchema,
  is_active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

async function authorizeFounder() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    logServerError("startup.authorization_failed", { code: error.code });
    return { status: "error" as const, supabase, user };
  }

  if (profile?.role !== "founder") {
    return { status: "forbidden" as const, supabase, user };
  }

  return { status: "ready" as const, supabase, user };
}

function authorizationError(status: "error" | "forbidden"): StartupActionState {
  return {
    status: "error",
    message:
      status === "forbidden"
        ? "Only founder profiles can manage startups."
        : "Could not verify your founder profile. Please try again.",
  };
}

export async function createStartup(
  _previousState: StartupActionState,
  formData: FormData,
): Promise<StartupActionState> {
  const authorization = await authorizeFounder();
  if (authorization.status !== "ready") return authorizationError(authorization.status);

  const validated = parseStartupForm(formData);
  if (!validated.success) {
    return {
      status: "error",
      message: "Review the highlighted fields and try again.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const startup: TablesInsert<"startups"> = {
    founder_id: authorization.user.id,
    ...validated.data,
    deck_url: validated.data.deck_url ?? null,
    website_url: validated.data.website_url ?? null,
  };

  const { error } = await authorization.supabase.from("startups").insert(startup);

  if (error) return startupWriteError(error.code);

  revalidatePath("/protected");
  redirect("/protected");
}

export async function updateStartup(
  _previousState: StartupActionState,
  formData: FormData,
): Promise<StartupActionState> {
  const authorization = await authorizeFounder();
  if (authorization.status !== "ready") return authorizationError(authorization.status);

  const startupId = startupIdSchema.safeParse(formData.get("startup_id"));
  const validated = parseStartupForm(formData);

  if (!startupId.success) {
    return { status: "error", message: "The startup identifier is invalid." };
  }

  if (!validated.success) {
    return {
      status: "error",
      message: "Review the highlighted fields and try again.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { data: current, error: readError } = await authorization.supabase
    .from("startups")
    .select("slug")
    .eq("id", startupId.data)
    .eq("founder_id", authorization.user.id)
    .maybeSingle();

  if (readError) {
    logServerError("startup.update_read_failed", { code: readError.code });
    return { status: "error", message: "Could not load the startup. Please try again." };
  }

  if (!current) {
    return { status: "error", message: "Startup not found or you cannot edit it." };
  }

  const update: TablesUpdate<"startups"> = {
    ...validated.data,
    deck_url: validated.data.deck_url ?? null,
    website_url: validated.data.website_url ?? null,
  };

  const { data: updated, error } = await authorization.supabase
    .from("startups")
    .update(update)
    .eq("id", startupId.data)
    .eq("founder_id", authorization.user.id)
    .select("id")
    .maybeSingle();

  if (error) return startupWriteError(error.code);
  if (!updated) return { status: "error", message: "Startup not found or you cannot edit it." };

  revalidatePath("/protected");
  revalidatePath(`/startups/${current.slug}`);
  revalidatePath(`/startups/${validated.data.slug}`);
  redirect("/protected");
}

export async function updateStartupStatus(
  _previousState: StartupActionState,
  formData: FormData,
): Promise<StartupActionState> {
  const authorization = await authorizeFounder();
  if (authorization.status !== "ready") return authorizationError(authorization.status);

  const validated = startupStatusSchema.safeParse({
    startup_id: formData.get("startup_id"),
    is_active: formData.get("is_active"),
  });

  if (!validated.success) {
    return { status: "error", message: "The requested startup status is invalid." };
  }

  const { data: updated, error } = await authorization.supabase
    .from("startups")
    .update({ is_active: validated.data.is_active })
    .eq("id", validated.data.startup_id)
    .eq("founder_id", authorization.user.id)
    .select("slug")
    .maybeSingle();

  if (error) {
    logServerError("startup.status_write_failed", { code: error.code });
    return { status: "error", message: "Could not update the startup status. Try again." };
  }

  if (!updated) {
    return { status: "error", message: "Startup not found or you cannot manage it." };
  }

  revalidatePath("/protected");
  revalidatePath(`/startups/${updated.slug}`);
  revalidatePath("/startups");

  return {
    status: "success",
    message: validated.data.is_active ? "Startup republished." : "Startup deactivated.",
  };
}

function startupWriteError(code: string): StartupActionState {
  if (code === "23505") {
    return {
      status: "error",
      message: "Choose a different slug and try again.",
      errors: { slug: ["This slug is already in use"] },
    };
  }

  logServerError("startup.write_failed", { code });
  return { status: "error", message: "Could not save the startup. Please try again." };
}
