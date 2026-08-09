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
    .select(
      "role, full_name, headline, bio, location, avatar_url, linkedin_url, founder_experience, investor_organization, investment_thesis, preferred_stages, ticket_min, ticket_max, website_url",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    await logRequestError("profile.read_failed", { code: error.code });
    return { status: "error" as const, email: user.email ?? null };
  }

  if (!profile) return { status: "missing" as const, email: user.email ?? null };
  const role = profile.role;
  if (role !== "founder" && role !== "investor") {
    return { status: "retired" as const, email: user.email ?? null };
  }

  return {
    status: "ready" as const,
    email: user.email ?? null,
    profile: { ...profile, role },
  };
}
