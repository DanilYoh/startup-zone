import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logRequestError } from "@/lib/logger";
import { redirect } from "next/navigation";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name, bio, location, avatar_url, linkedin_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    await logRequestError("profile.read_failed", { code: error.code });
    return { status: "error" as const, email: user.email ?? null };
  }

  if (!profile) return { status: "missing" as const, email: user.email ?? null };

  return {
    status: "ready" as const,
    email: user.email ?? null,
    profile,
  };
}
