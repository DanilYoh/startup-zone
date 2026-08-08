import "server-only";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getOwnedStartupForEdit(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: profile, error: profileError }, { data: startup, error: startupError }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("startups")
        .select(
          "id, title, slug, one_pager, description, stage, niche, funding_ask, equity_offered, deck_url, website_url, is_active",
        )
        .eq("id", id)
        .eq("founder_id", user.id)
        .maybeSingle(),
    ]);

  if (profileError || startupError) {
    console.error("Unable to load owned startup", {
      profileCode: profileError?.code,
      startupCode: startupError?.code,
    });
    throw new Error("Unable to load startup");
  }

  if (profile?.role !== "founder") return { status: "forbidden" as const };
  if (!startup) return { status: "not_found" as const };
  return { status: "ready" as const, startup };
}

