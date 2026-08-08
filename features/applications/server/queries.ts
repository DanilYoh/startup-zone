import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/logger";
import { redirect } from "next/navigation";

export async function getApplicationContext(startupId: number, founderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "signed_out" as const };
  if (user.id === founderId) return { status: "owner" as const };

  const [{ data: profile, error: profileError }, { data: existing, error: existingError }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("applications")
        .select("type, status")
        .eq("startup_id", startupId)
        .eq("applicant_id", user.id)
        .maybeSingle(),
    ]);

  if (profileError || existingError) {
    logServerError("application.context_read_failed", {
      profileCode: profileError?.code,
      applicationCode: existingError?.code,
    });
    return { status: "error" as const };
  }

  if (profile?.role !== "specialist" && profile?.role !== "investor") {
    return { status: "unsupported_role" as const };
  }

  return {
    status: "ready" as const,
    role: profile.role,
    existing,
  };
}

export async function listMyApplications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, type, message, status, created_at, startup:startups!applications_startup_id_fkey(id, title, slug, is_active)",
    )
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logServerError("application.list_mine_failed", { code: error.code });
    return { status: "error" as const };
  }

  return { status: "ready" as const, data };
}

export async function listFounderApplications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    logServerError("application.inbox_authorization_failed", { code: profileError.code });
    return { status: "error" as const };
  }

  if (profile?.role !== "founder") return { status: "forbidden" as const };

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, type, message, status, created_at, applicant:profiles!applications_applicant_id_fkey(full_name, bio, location, linkedin_url), startup:startups!applications_startup_id_fkey(id, title, slug)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    logServerError("application.inbox_read_failed", { code: error.code });
    return { status: "error" as const };
  }

  return { status: "ready" as const, data };
}
