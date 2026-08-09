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

  const [
    { data: profile, error: profileError },
    { data: contact, error: contactError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "role, full_name, headline, bio, location, avatar_url, linkedin_url, founder_experience, investor_organization, investment_thesis, preferred_stages, ticket_min, ticket_max, website_url",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profile_contacts")
      .select("contact_email, contact_url, sharing_enabled")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  if (profileError || contactError) {
    await logRequestError("profile.read_failed", {
      profileCode: profileError?.code,
      contactCode: contactError?.code,
    });
    return { status: "error" as const, email: user.email ?? null };
  }

  if (!profile || !contact) return { status: "missing" as const, email: user.email ?? null };
  const role = profile.role;
  if (role !== "founder" && role !== "investor") {
    return { status: "retired" as const, email: user.email ?? null };
  }

  return {
    status: "ready" as const,
    email: user.email ?? null,
    profile: { ...profile, role },
    contact,
  };
}
