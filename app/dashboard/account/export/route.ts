import { logRequestError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json(
      { status: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await supabase.rpc("export_my_personal_data");
  if (error || !data) {
    await logRequestError("account.export_failed", { code: error?.code });
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return new Response(`${JSON.stringify(data, null, 2)}\n`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": 'attachment; filename="startup-zone-data.json"',
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
