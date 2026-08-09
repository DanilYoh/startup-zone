import { createClient } from "@supabase/supabase-js";
import {
  runProductionPreflight,
  validateProductionPreflightEnvironment,
} from "./production-preflight-core.mjs";

try {
  const config = validateProductionPreflightEnvironment(process.env);
  const clientOptions = {
    auth: { autoRefreshToken: false, persistSession: false },
  };
  const publicClient = createClient(config.supabaseOrigin, config.publishableKey, clientOptions);
  const adminClient = createClient(config.supabaseOrigin, config.serviceRoleKey, clientOptions);
  const report = await runProductionPreflight({ adminClient, config, publicClient });

  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown preflight failure.";
  console.error(`Production preflight failed: ${message}`);
  process.exitCode = 1;
}
