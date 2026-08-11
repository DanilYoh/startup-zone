import { getSupabaseEnv } from "@/lib/env";
import { logServerError, logServerInfo } from "@/lib/logger";
import { requestIdFromHeaders } from "@/lib/request-id";
import type { Database } from "@/lib/supabase/types";
import { createClient } from "@supabase/supabase-js";

const readinessTimeoutMs = 3_000;
const readinessCacheTtlMs = 10_000;
const readinessFailureCacheTtlMs = 2_000;

type ReadinessResult = { ok: true } | { ok: false; code?: string };
type CachedReadiness = ReadinessResult & { expiresAt: number };

let cachedReadiness: CachedReadiness | undefined;
let readinessInFlight: Promise<ReadinessResult> | undefined;

async function probeSupabase(requestId: string): Promise<ReadinessResult> {
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

    if (error) return { ok: false, code: error.code };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code:
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : undefined,
    };
  }
}

async function getReadiness(requestId: string) {
  const now = Date.now();
  if (cachedReadiness && cachedReadiness.expiresAt > now) {
    return { result: cachedReadiness as ReadinessResult, cache: "hit" as const };
  }

  const cache = readinessInFlight ? "hit" as const : "miss" as const;
  readinessInFlight ??= probeSupabase(requestId);
  const result = await readinessInFlight;
  readinessInFlight = undefined;
  cachedReadiness = {
    ...result,
    expiresAt:
      now + (result.ok ? readinessCacheTtlMs : readinessFailureCacheTtlMs),
  };

  return { result, cache };
}

export function resetReadinessCacheForTests() {
  cachedReadiness = undefined;
  readinessInFlight = undefined;
}

export async function GET(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  const responseHeaders = {
    "Cache-Control": "no-store",
    "x-request-id": requestId,
  };

  const { result, cache } = await getReadiness(requestId);
  if (result.ok) {
    logServerInfo("readiness.succeeded", { cache, requestId });
    return Response.json({ status: "ok" }, { headers: responseHeaders });
  }

  logServerError("readiness.failed", { cache, code: result.code, requestId });
  return Response.json(
    { status: "unavailable" },
    { status: 503, headers: responseHeaders },
  );
}
