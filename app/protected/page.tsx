import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function getViewer() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return data.claims;
}

async function ProtectedContent() {
  const viewer = await getViewer();

  return (
    <section className="w-full max-w-3xl">
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Authenticated session
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Welcome to Startup Zone</h1>
            <p className="mt-2 text-muted-foreground">
              Signed in as {typeof viewer.email === "string" ? viewer.email : "a verified user"}.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="font-semibold">Security checks active</h2>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            {[
              "HTTP-only session cookies",
              "Server-side claim verification",
              "Protected route middleware",
              "Database row-level security",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function ProtectedPage() {
  return (
    <Suspense
      fallback={<div className="h-72 w-full max-w-3xl animate-pulse rounded-2xl bg-muted" />}
    >
      <ProtectedContent />
    </Suspense>
  );
}
