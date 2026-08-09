import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logRequestError } from "@/lib/logger";
import { APPLICATION_PAGE_SIZE, pageCount, pageRange } from "@/lib/pagination";
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
    await logRequestError("application.context_read_failed", {
      profileCode: profileError?.code,
      applicationCode: existingError?.code,
    });
    return { status: "error" as const };
  }

  if (profile?.role !== "investor") {
    return { status: "unsupported_role" as const };
  }

  return {
    status: "ready" as const,
    existing,
  };
}

export async function listMyApplications(page: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { from, to } = pageRange(page, APPLICATION_PAGE_SIZE);
  const { count, error: countError } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("applicant_id", user.id)
    .eq("type", "investor");

  if (countError) {
    await logRequestError("application.list_mine_failed", { code: countError.code });
    return { status: "error" as const };
  }

  const total = count ?? 0;
  if (from >= total) {
    return {
      status: "ready" as const,
      data: [],
      page,
      pageCount: pageCount(total, APPLICATION_PAGE_SIZE),
      total,
    };
  }

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, type, message, status, created_at, startup:startups!applications_startup_id_fkey(id, title, slug, is_active)",
    )
    .eq("applicant_id", user.id)
    .eq("type", "investor")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    await logRequestError("application.list_mine_failed", { code: error.code });
    return { status: "error" as const };
  }

  return {
    status: "ready" as const,
    data,
    page,
    pageCount: pageCount(total, APPLICATION_PAGE_SIZE),
    total,
  };
}

export async function listFounderApplications(page: number) {
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
    await logRequestError("application.inbox_authorization_failed", { code: profileError.code });
    return { status: "error" as const };
  }

  if (profile?.role !== "founder") return { status: "forbidden" as const };

  const { from, to } = pageRange(page, APPLICATION_PAGE_SIZE);
  const { count, error: countError } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("type", "investor");

  if (countError) {
    await logRequestError("application.inbox_read_failed", { code: countError.code });
    return { status: "error" as const };
  }

  const total = count ?? 0;
  if (from >= total) {
    return {
      status: "ready" as const,
      data: [],
      page,
      pageCount: pageCount(total, APPLICATION_PAGE_SIZE),
      total,
    };
  }

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, type, message, status, created_at, applicant:profiles!applications_applicant_id_fkey(full_name, headline, bio, location, linkedin_url, investor_organization, investment_thesis, preferred_stages, ticket_min, ticket_max, website_url), startup:startups!applications_startup_id_fkey(id, title, slug)",
    )
    .eq("type", "investor")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    await logRequestError("application.inbox_read_failed", { code: error.code });
    return { status: "error" as const };
  }

  return {
    status: "ready" as const,
    data,
    page,
    pageCount: pageCount(total, APPLICATION_PAGE_SIZE),
    total,
  };
}
