import { getSupabaseEnv } from "@/lib/env";
import { logServerError, logServerInfo } from "@/lib/logger";
import { requestIdFromHeaders } from "@/lib/request-id";
import type { Database } from "@/lib/supabase/types";
import { createClient } from "@supabase/supabase-js";

const readinessTimeoutMs = 3_000;

export async function GET(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  const responseHeaders = {
    "Cache-Control": "no-store",
    "x-request-id": requestId,
  };

  try {
    const environment = getSupabaseEnv();
    const supabase = createClient<Database>(
      environment.NEXT_PUBLIC_SUPABASE_URL,
      environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { "x-request-id": requestId } },
      },
    );
    const { error } = await supabase
      .from("startups")
      .select("id")
      .limit(1)
      .abortSignal(AbortSignal.timeout(readinessTimeoutMs));

    if (error) throw Object.assign(new Error("Supabase readiness query failed"), { code: error.code });

    logServerInfo("readiness.succeeded", { requestId });
    return Response.json({ status: "ok" }, { headers: responseHeaders });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined;
    logServerError("readiness.failed", { code, requestId });
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: responseHeaders },
    );
  }
}
